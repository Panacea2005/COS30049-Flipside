import { HexButton } from './HexButton/HexButton';

export const GameSection = () => {
  return (
    <div className="py-32">
      <h2 className="text-[6rem] leading-none font-light text-center mb-16">
        Let's play a game
      </h2>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-6 gap-4">
          {/* First row */}
          <HexButton label="Linear" />
          <HexButton label="Burrow" />
          <HexButton label="Burrow" />
          <HexButton label="Ref finance" />
          <HexButton label="Burrow" />
          <HexButton label="MetaPool" />
        </div>

        <div className="grid grid-cols-6 gap-4">
          {/* Second row */}
          <HexButton label="Ref finance" />
          <HexButton label="Ref finance" />
          <HexButton locked tags={['RFD', 'BH', 'SM', '4SS']} />
          <HexButton locked tags={['RFD', 'BH', 'SM', '4SS']} />
          <HexButton locked tags={['RFD', 'BH', 'SM', '4SS']} />
        </div>

        <button className="w-full mt-16 bg-white text-black py-4 px-6 rounded-lg flex justify-between items-center group hover:bg-gradient-to-r hover:from-orange-400 hover:to-pink-500 hover:text-white transition-all">
          <span>Start Playing</span>
          <span className="transform group-hover:translate-x-2 transition-transform">→</span>
        </button>
      </div>
    </div>
  );
};