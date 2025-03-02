// lib/etherscan/etherscanAddressService.ts
import { AddressInfo, BalanceData, GasData } from '../neo4j/types';
import { ETHERSCAN_API_KEY, getApiUrlForNetwork } from './etherscanService';

export const fetchAddressInfoFromEtherscan = async (
  address: string,
  network: string = 'mainnet'
): Promise<AddressInfo> => {
  try {
    // Get basic address info
    const balanceUrl = `${getApiUrlForNetwork(network)}?module=account&action=balance&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
    const balanceResponse = await fetch(balanceUrl);
    const balanceData = await balanceResponse.json();

    if (balanceData.status !== "1") {
      throw new Error(balanceData.message || "Error fetching address balance");
    }

    // Get transactions list to calculate sent/received counts
    const txListUrl = `${getApiUrlForNetwork(network)}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
    const txListResponse = await fetch(txListUrl);
    const txListData = await txListResponse.json();

    if (txListData.status !== "1" && !txListData.result) {
      throw new Error(txListData.message || "Error fetching transactions");
    }

    // Count transactions
    const transactions = txListData.result || [];
    const sentTransactions = transactions.filter((tx: any) => 
      tx.from.toLowerCase() === address.toLowerCase()
    ).length;
    const receivedTransactions = transactions.filter((tx: any) => 
      tx.to && tx.to.toLowerCase() === address.toLowerCase()
    ).length;

    // Calculate sent/received values
    let totalSentValue = '0';
    let totalReceivedValue = '0';
    let firstSeen = Date.now();
    let lastSeen = 0;

    transactions.forEach((tx: any) => {
      const timestamp = parseInt(tx.timeStamp) * 1000;
      
      // Update first and last seen
      if (timestamp < firstSeen) firstSeen = timestamp;
      if (timestamp > lastSeen) lastSeen = timestamp;
      
      if (tx.from.toLowerCase() === address.toLowerCase()) {
        // If outgoing transaction, add to total sent
        totalSentValue = (BigInt(totalSentValue) + BigInt(tx.value)).toString();
      }
      
      if (tx.to && tx.to.toLowerCase() === address.toLowerCase()) {
        // If incoming transaction, add to total received
        totalReceivedValue = (BigInt(totalReceivedValue) + BigInt(tx.value)).toString();
      }
    });

    // Determine address type (contract or EOA)
    const codeUrl = `${getApiUrlForNetwork(network)}?module=proxy&action=eth_getCode&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
    const codeResponse = await fetch(codeUrl);
    const codeData = await codeResponse.json();
    
    const isContract = codeData.result && codeData.result !== '0x';
    
    return {
      addressId: address,
      balance: balanceData.result,
      type: isContract ? 'contract' : 'eoa',
      sentTransactions,
      receivedTransactions,
      totalTransactions: sentTransactions + receivedTransactions,
      totalSentValue,
      totalReceivedValue,
      firstSeen: new Date(firstSeen).toISOString(),
      lastSeen: new Date(lastSeen).toISOString()
    };
  } catch (err) {
    console.error('Error fetching address info from Etherscan:', err);
    throw err;
  }
};

export const fetchBalanceHistoryFromEtherscan = async (
  address: string,
  network: string = 'mainnet'
): Promise<BalanceData[]> => {
  try {
    // Since Etherscan doesn't provide historical balance data directly,
    // we need to derive it from transaction history
    
    const txListUrl = `${getApiUrlForNetwork(network)}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=1000&sort=asc&apikey=${ETHERSCAN_API_KEY}`;
    const txListResponse = await fetch(txListUrl);
    const txListData = await txListResponse.json();

    if (txListData.status !== "1" && !txListData.result) {
      throw new Error(txListData.message || "Error fetching transactions");
    }

    const transactions = txListData.result || [];
    
    // Get current balance
    const balanceUrl = `${getApiUrlForNetwork(network)}?module=account&action=balance&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
    const balanceResponse = await fetch(balanceUrl);
    const balanceData = await balanceResponse.json();
    
    if (balanceData.status !== "1") {
      throw new Error(balanceData.message || "Error fetching address balance");
    }
    
    // We'll start with the current balance and work backwards
    let currentBalance = BigInt(balanceData.result);
    
    // Group transactions by date (day)
    const balanceByDate = new Map<string, number>();
    
    // Process transactions in reverse chronological order
    for (let i = transactions.length - 1; i >= 0; i--) {
      const tx = transactions[i];
      const date = new Date(parseInt(tx.timeStamp) * 1000);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Update balance based on transaction direction
      if (tx.from.toLowerCase() === address.toLowerCase()) {
        // This was an outgoing transaction, so add the value and gas fee back
        currentBalance = currentBalance + BigInt(tx.value) + (BigInt(tx.gasUsed) * BigInt(tx.gasPrice));
      }
      
      if (tx.to && tx.to.toLowerCase() === address.toLowerCase()) {
        // This was an incoming transaction, so subtract the value
        currentBalance = currentBalance - BigInt(tx.value);
      }
      
      // Store the balance for this date
      balanceByDate.set(dateKey, Number(currentBalance) / 1e18);
    }
    
    // Convert to array format needed by the component
    const balanceHistory: BalanceData[] = Array.from(balanceByDate.entries())
      .map(([date, balance]) => ({
        date,
        balance
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return balanceHistory;
  } catch (err) {
    console.error('Error fetching balance history from Etherscan:', err);
    return [];
  }
};

export const fetchGasDataFromEtherscan = async (
  address: string,
  network: string = 'mainnet'
): Promise<GasData[]> => {
  try {
    const txListUrl = `${getApiUrlForNetwork(network)}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=1000&sort=asc&apikey=${ETHERSCAN_API_KEY}`;
    const txListResponse = await fetch(txListUrl);
    const txListData = await txListResponse.json();

    if (txListData.status !== "1" && !txListData.result) {
      throw new Error(txListData.message || "Error fetching transactions");
    }

    const transactions = txListData.result || [];
    
    // Group gas costs by date
    const gasByDate = new Map<string, number>();
    
    transactions.forEach((tx: any) => {
      // Only consider transactions where the address is the sender (pays gas)
      if (tx.from.toLowerCase() !== address.toLowerCase()) return;
      
      const date = new Date(parseInt(tx.timeStamp) * 1000);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Calculate gas cost in ETH
      const gasCost = (BigInt(tx.gasUsed) * BigInt(tx.gasPrice)) / BigInt(1e18);
      
      // Add to daily total
      const currentTotal = gasByDate.get(dateKey) || 0;
      gasByDate.set(dateKey, currentTotal + Number(gasCost));
    });
    
    // Convert to array format needed by the component
    const gasData: GasData[] = Array.from(gasByDate.entries())
      .map(([date, transactionFee]) => ({
        date,
        transactionFee,
        totalTransactionFee: transactionFee // Assuming totalTransactionFee is the same as transactionFee
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return gasData;
  } catch (err) {
    console.error('Error fetching gas data from Etherscan:', err);
    return [];
  }
};