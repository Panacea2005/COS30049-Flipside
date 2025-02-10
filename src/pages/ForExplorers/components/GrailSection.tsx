export const GrailSection = () => {
  return (
    <div className="py-32">
      <div className="mb-16">
        <h2 className="text-[8rem] leading-none font-light">
          <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-pink-500 text-transparent bg-clip-text">
            ENTER, 
            <br />
            LEARN & EARN
          </span>
        </h2>
        <button className="text-orange-400 text-sm font-medium mt-8">
          Start your journey
        </button>
      </div>

      <div className="flex justify-between items-start">
        <p className="text-2xl max-w-2xl">
          Dive into real blockchain transactions, explore smart contract behavior, and gain valuable insights using AI-driven analytics.
        </p>
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-2">
              <img src="/PM.png" alt="" className="w-8 h-8 rounded-full border-2 border-black" />
              <img src="/DE.png" alt="" className="w-8 h-8 rounded-full border-2 border-black" />
              <img src="/SE.png" alt="" className="w-8 h-8 rounded-full border-2 border-black" />
            </div>
            <span>10k+ entering for the</span>
          </div>
          <div className="flex items-center space-x-2">
            <img src="/sui.svg" alt="" className="w-6 h-6" />
            <span>blockchain competitions.</span>
          </div>
        </div>
      </div>
    </div>
  );
};