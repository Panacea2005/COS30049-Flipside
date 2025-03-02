import { Driver, Session, auth, driver as neo4jDriver } from "neo4j-driver";
import { GraphData, Transaction, AddressInfo, GasData, BalanceData } from "./types";
import { 
  fetchAddressInfoFromEtherscan, 
  fetchBalanceHistoryFromEtherscan, 
  fetchGasDataFromEtherscan 
} from '../etherscan/etherscanAddressService';
import { fetchEtherscanTransactions, getTransactionCount } from '../etherscan/etherscanTransactionService';

class Neo4jClient {
  private driver: Driver;
  private static instance: Neo4jClient;
  private useEtherscan: boolean = false;

  private constructor() {
    const URI =
      import.meta.env.NEO4J_URI || "neo4j+s://d05609b7.databases.neo4j.io";
    const USER = import.meta.env.NEO4J_USERNAME || "neo4j";
    const PASSWORD =
      import.meta.env.NEO4J_PASSWORD ||
      "HzJ5l6ipua9t3x2fX-xS5_oYhLV1eXHxwXWyoL6CsZA";

    if (!URI || !USER || !PASSWORD) {
      throw new Error("Missing required Neo4j environment variables");
    }

    const isSecure = URI.startsWith("neo4j+s") || URI.startsWith("bolt+s");
    const config = {
      ...(isSecure ? {} : { encrypted: false }),
      connectionTimeout: 60000,
      maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
    };

    this.driver = neo4jDriver(URI, auth.basic(USER, PASSWORD), config);
  }

  public setUseEtherscan(useEtherscan: boolean) {
    this.useEtherscan = useEtherscan;
  }

  // Method to get the current mode
  public isUsingEtherscan() {
    return this.useEtherscan;
  }

  static getInstance(): Neo4jClient {
    if (!Neo4jClient.instance) {
      Neo4jClient.instance = new Neo4jClient();
    }
    return Neo4jClient.instance;
  }

  private formatTimestamp(timestamp: number): string {
    const timestampMs =
      String(timestamp).length === 10
        ? Number(timestamp) * 1000
        : Number(timestamp);

    return new Date(timestampMs).toISOString();
  }

  async withSession<T>(
    operation: (session: Session) => Promise<T>
  ): Promise<T> {
    const session = this.driver.session();
    try {
      return await operation(session);
    } finally {
      await session.close();
    }
  }

  async getTransactions(
    page: number = 1,
    pageSize: number = 10,
    address?: string
  ): Promise<Transaction[]> {
    try {
      if (this.useEtherscan) {
        return await fetchEtherscanTransactions(page, pageSize, address);
      }
  
      const skip = (page - 1) * pageSize; // Calculate the skip value for pagination
  
      return await this.withSession(async (session) => {
        const result = await session.run(
          `MATCH (from:nodes)-[p:transaction]->(to:nodes)
           WITH from, to, p
           ORDER BY p.block_timestamp DESC
           SKIP toInteger($skip)
           LIMIT toInteger($pageSize)
           RETURN p {
             .*,
             fromAddress: from.addressId,
             toAddress: to.addressId
           } as transaction`,
          { skip, pageSize }
        );
  
        return result.records.map((record) => {
          const tx = record.get("transaction");
  
          // Handle Neo4j Integer objects
          const getNumberValue = (value: any) => {
            if (
              value &&
              typeof value === "object" &&
              "low" in value &&
              "high" in value
            ) {
              return value.low;
            }
            return typeof value === "bigint" ? Number(value) : value;
          };
  
          const blockTimestamp = getNumberValue(tx.block_timestamp);
  
          return {
            hash: tx.hash,
            fromAddress: tx.fromAddress,
            toAddress: tx.toAddress,
            value:
              typeof tx.value === "object"
                ? tx.value.toString()
                : tx.value?.toString(),
            timestamp: this.formatTimestamp(blockTimestamp),
            formattedDate: new Date(blockTimestamp * 1000).toLocaleString(),
            blockNumber: getNumberValue(tx.block_number),
            gas: getNumberValue(tx.gas),
            gasUsed: getNumberValue(tx.gas_used),
            gasPrice: getNumberValue(tx.gas_price),
          };
        });
      });
    } catch (error) {
      console.error("Error getting transactions:", error);
      return [];
    }
  }  

  async getAddressTypes() {
    const query = `
      MATCH (n:nodes)
      WITH n.type AS type, count(n) AS count
      RETURN type, count
    `;

    return this.withSession(async (session) => {
      const result = await session.run(query);

      return result.records.map((record) => ({
        type: record.get("type"),
        count: record.get("count").toNumber(),
      }));
    });
  }

  async getBiggestTransactions() {
    const query = `
      MATCH (from:nodes)-[p:transaction]->(to:nodes)
      RETURN p.hash AS hash, p.value AS value, from.addressId AS fromAddress, to.addressId AS toAddress
      ORDER BY toFloat(p.value) DESC
      LIMIT 3
    `;

    return this.withSession(async (session) => {
      const result = await session.run(query);

      return result.records.map((record) => ({
        hash: record.get("hash"),
        value: parseFloat(record.get("value").toString()),
        fromAddress: record.get("fromAddress"),
        toAddress: record.get("toAddress"),
      }));
    });
  }

  async getVolumeData() {
    const query = `
      MATCH (from:nodes)-[p:transaction]->(to:nodes)
      WITH date(datetime({epochMillis: p.block_timestamp * 1000})) AS date, sum(toFloat(p.value)) AS totalVolume
      RETURN date.year AS year, date.month AS month, sum(totalVolume) AS totalVolume
      ORDER BY year ASC, month ASC
    `;

    return this.withSession(async (session) => {
      const result = await session.run(query);

      return result.records.map((record) => ({
        year: record.get("year").toString(),
        month: record.get("month").toString(),
        totalVolume: record.get("totalVolume").toString(),
      }));
    });
  }

  async getTransactionsByTimeRange() {
    const query = `
      MATCH (from:nodes)-[p:transaction]->(to:nodes)
      WITH date(datetime({epochMillis: p.block_timestamp * 1000})) AS date, count(p) AS totalTransactions
      RETURN date.year AS year, date.month AS month, sum(totalTransactions) AS totalTransactions
      ORDER BY year ASC, month ASC
    `;

    return this.withSession(async (session) => {
      const result = await session.run(query);

      return result.records.map((record) => ({
        year: record.get("year").toString(),
        month: record.get("month").toString(),
        totalTransactions: record.get("totalTransactions").toNumber(),
      }));
    });
  }

  async getDistributionData() {
    const query = `
      MATCH (from:nodes)-[p:transaction]->(to:nodes)
      WITH from.addressId AS address, sum(toFloat(p.value)) AS totalValue
      RETURN address, totalValue
      ORDER BY totalValue DESC
      LIMIT 3
    `;

    return this.withSession(async (session) => {
      const result = await session.run(query);

      return result.records.map((record) => ({
        address: record.get("address"),
        totalValue: parseFloat(record.get("totalValue").toString()),
      }));
    });
  }

  async getGraphData(address: string): Promise<GraphData> {
    return this.withSession(async (session) => {
      const result = await session.run(
        `MATCH (from:nodes)-[p:transaction]->(to:nodes)
       WHERE (from.addressId = $address OR to.addressId = $address)
       WITH from, to, p,
            CASE WHEN from.addressId = $address THEN 'out' ELSE 'in' END as direction
       RETURN from.addressId AS fromAddress, 
              to.addressId AS toAddress,
              sum(toFloat(p.value)) AS totalValue,
              count(p) AS txCount,
              direction,
              min(toFloat(p.block_timestamp)) as firstTx,
              max(toFloat(p.block_timestamp)) as lastTx`,
        { address }
      );

      const nodes = new Set<string>();
      const links = result.records.map((record) => {
        const from = record.get("fromAddress");
        const to = record.get("toAddress");
        nodes.add(from);
        nodes.add(to);

        return {
          source: from,
          target: to,
          value: parseFloat(record.get("totalValue").toString()),
          transactions: record.get("txCount").toNumber(),
          direction: record.get("direction"),
          firstTransaction: this.formatTimestamp(record.get("firstTx")),
          lastTransaction: this.formatTimestamp(record.get("lastTx")),
        };
      });

      return {
        nodes: Array.from(nodes).map((id) => ({ id })),
        links,
      };
    });
  }

  async getTransactionsForAddress(address: string): Promise<Transaction[]> {
    const query = `
      MATCH (from:nodes)-[p:transaction]->(to:nodes)
      WHERE from.addressId = $address OR to.addressId = $address
      RETURN p.hash AS hash, from.addressId AS fromAddress, to.addressId AS toAddress, p.value AS value, p.block_timestamp AS timestamp, p.block_number AS blockNumber, p.gas AS gas, p.gas_used AS gasUsed, p.gas_price AS gasPrice
      ORDER BY p.block_timestamp DESC
    `;

    return this.withSession(async (session) => {
      const result = await session.run(query, { address });

      return result.records.map((record) => {
        const blockTimestamp = record.get("timestamp").toNumber();
        return {
          hash: record.get("hash"),
          fromAddress: record.get("fromAddress"),
          toAddress: record.get("toAddress"),
          value: record.get("value").toString(), // Convert value to string
          timestamp: this.formatTimestamp(blockTimestamp),
          formattedDate: new Date(blockTimestamp * 1000).toLocaleString(),
          blockNumber: record.get("blockNumber").toNumber(),
          gas: record.get("gas").toNumber(),
          gasUsed: record.get("gasUsed").toNumber(),
          gasPrice: record.get("gasPrice").toNumber(),
        };
      });
    });
  }

  async getAddressInfo(address: string): Promise<AddressInfo | null> {
    try {
      if (this.useEtherscan) {
        return await fetchAddressInfoFromEtherscan(address);
      }
  
      const query = `
        MATCH (n:nodes {addressId: $address})
        OPTIONAL MATCH (n)-[pOut:transaction]->() // Outgoing transactions
        OPTIONAL MATCH ()-[pIn:transaction]->(n) // Incoming transactions
        RETURN n.addressId AS addressId, 
               n.type AS type, 
               min(COALESCE(pOut.block_timestamp, pIn.block_timestamp)) AS firstSeen, 
               max(COALESCE(pOut.block_timestamp, pIn.block_timestamp)) AS lastSeen, 
               count(DISTINCT pOut) AS sentTransactions, 
               count(DISTINCT pIn) AS receivedTransactions,
               count(DISTINCT pOut) + count(DISTINCT pIn) AS totalTransactions, 
               sum(DISTINCT CASE WHEN pIn.value IS NOT NULL THEN toFloat(pIn.value) ELSE 0 END) AS totalReceivedValue,
               sum(DISTINCT CASE WHEN pOut.value IS NOT NULL THEN toFloat(pOut.value) ELSE 0 END) AS totalSentValue,
               sum(DISTINCT CASE WHEN pIn.value IS NOT NULL THEN toFloat(pIn.value) ELSE 0 END) - 
               sum(DISTINCT CASE WHEN pOut.value IS NOT NULL THEN toFloat(pOut.value) ELSE 0 END) AS balance
      `;
  
      try {
        return await this.withSession(async (session) => {
          const result = await session.run(query, { address });
          const record = result.records[0];
  
          if (!record) {
            throw new Error("Not found in Neo4j");
          }
  
          return {
            addressId: record.get("addressId"),
            type: record.get("type"),
            balance: record.get("balance")
              ? record.get("balance").toString()
              : "0",
            totalSentValue: record.get("totalSentValue")
              ? record.get("totalSentValue").toString()
              : "0",
            totalReceivedValue: record.get("totalReceivedValue")
              ? record.get("totalReceivedValue").toString()
              : "0",
            firstSeen: record.get("firstSeen")
              ? this.formatTimestamp(record.get("firstSeen").toNumber())
              : "",
            lastSeen: record.get("lastSeen")
              ? this.formatTimestamp(record.get("lastSeen").toNumber())
              : "",
            totalTransactions: record.get("totalTransactions").toNumber(),
            sentTransactions: record.get("sentTransactions").toNumber(),
            receivedTransactions: record.get("receivedTransactions").toNumber(),
          };
        });
      } catch (neoError) {
        console.log("Address not found in Neo4j, fetching from Etherscan");
        return await fetchAddressInfoFromEtherscan(address);
      }
    } catch (error) {
      console.error("Error getting address info:", error);
      return null;
    }
  }  

  async getBalanceOverTime(address: string): Promise<BalanceData[]> {
    try {
      if (this.useEtherscan) {
        return await fetchBalanceHistoryFromEtherscan(address);
      }
  
      const query = `
        MATCH (n:nodes {addressId: $address})-[p:transaction]->()
        RETURN p.block_timestamp AS timestamp, 
               CASE WHEN p.to = $address THEN toFloat(p.value) ELSE -toFloat(p.value) END AS balanceChange
        ORDER BY timestamp
      `;
  
      try {
        return await this.withSession(async (session) => {
          const result = await session.run(query, { address });
  
          let cumulativeBalance = 0;
          return result.records.map((record) => {
            const balanceChange = record.get("balanceChange").toNumber
              ? record.get("balanceChange").toNumber()
              : parseFloat(record.get("balanceChange"));
            cumulativeBalance += balanceChange;
  
            return {
              date: this.formatTimestamp(
                record.get("timestamp").toNumber
                  ? record.get("timestamp").toNumber()
                  : parseFloat(record.get("timestamp"))
              ),
              balance: cumulativeBalance,
            };
          });
        });
      } catch (neoError) {
        console.log("Balance history not found in Neo4j, fetching from Etherscan");
        return await fetchBalanceHistoryFromEtherscan(address);
      }
    } catch (error) {
      console.error("Error getting balance over time:", error);
      return [];
    }
  }  

  async getGasDataOverTime(address: string): Promise<GasData[]> {
    try {
      if (this.useEtherscan) {
        return await fetchGasDataFromEtherscan(address);
      }
  
      const query = `
        MATCH (n:nodes {addressId: $address})-[p:transaction]->()
        RETURN p.block_timestamp AS timestamp, 
               toFloat(p.transaction_fee) / 1e18 AS transactionFee
        ORDER BY timestamp
      `;
  
      try {
        return await this.withSession(async (session) => {
          const result = await session.run(query, { address });
  
          let cumulativeTransactionFee = 0;
          return result.records.map((record) => {
            const transactionFee = record.get("transactionFee").toNumber
              ? record.get("transactionFee").toNumber()
              : parseFloat(record.get("transactionFee"));
            cumulativeTransactionFee += transactionFee;
  
            return {
              date: this.formatTimestamp(
                record.get("timestamp").toNumber
                  ? record.get("timestamp").toNumber()
                  : parseFloat(record.get("timestamp"))
              ),
              transactionFee: transactionFee,
              totalTransactionFee: cumulativeTransactionFee,
            };
          });
        });
      } catch (neoError) {
        console.log("Gas data not found in Neo4j, fetching from Etherscan");
        return await fetchGasDataFromEtherscan(address);
      }
    } catch (error) {
      console.error("Error getting gas data over time:", error);
      return [];
    }
  }  
}

// Export singleton instance
export const neo4jClient = Neo4jClient.getInstance();
