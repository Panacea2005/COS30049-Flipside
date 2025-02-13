import { HexButton } from './HexButton/HexButton';

export const GameSection = () => {
  return (
    <div className="py-32">
      <h2 className="text-4xl sm:text-6xl md:text-8xl leading-none font-light text-center mb-16">
        Blockchain Data Explorer
      </h2>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {/* First row */}
          <HexButton label="0x3a5...9b4f" tags={['Ethereum', 'TX']} />
          <HexButton label="NEAR Protocol" tags={['Staking', 'Validator']} />
          <HexButton label="Solana Wallet" tags={['NFT', 'DeFi']} />
          <HexButton label="0xf8d...c2a1" tags={['Polygon', 'L2']} />
          <HexButton label="0x7be...4d6c" tags={['DAO', 'Governance']} />
          <HexButton label="Avalanche" tags={['C-Chain', 'DEX']} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {/* Second row */}
          <HexButton label="Bitcoin Address" tags={['UTXO', 'Ledger']} />
          <HexButton label="Arbitrum Rollup" tags={['L2', 'Optimistic']} />
          <HexButton locked tags={['Private Key', 'Encrypted']} />
          <HexButton locked tags={['Smart Contract', 'Audit Required']} />
          <HexButton locked tags={['Whale Wallet', 'Monitored']} />
        </div>

        <button className="w-full mt-16 bg-white text-black py-4 px-6 rounded-lg flex justify-between items-center group hover:bg-gradient-to-r hover:from-orange-400 hover:to-pink-500 hover:text-white transition-all">
          <span>Start Exploring</span>
          <span className="transform group-hover:translate-x-2 transition-transform">→</span>
        </button>
      </div>
    </div>
  );
};