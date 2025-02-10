import { Container } from "../../../components/layout/Container";
import { HeroImage } from "../../../components/Hero/HeroImage";

export const AboutHero = () => {
  return (
    <div className="relative min-h-screen pt-32 bg-white">
      <div className="relative">
        <HeroImage />
        <Container className="relative z-10">
          <div className="max-w-4xl">
            <h1 className="text-[8rem] leading-none font-light mb-16">
              We orchestrate 
              <br />
              Blockchain Intelligence
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl">
            Our AI-powered analytics platform transforms raw blockchain data into actionable insights, empowering developers, analysts, and explorers to unlock the full potential of Web3.
            </p>
          </div>
        </Container>
      </div>
      <Container>
        {/* Stats */}
        <div className="bg-white py-8">
          <div className="grid grid-cols-4 gap-8 border-t pt-8">
            <div>
              <div className="text-2xl font-light">2025</div>
              <div className="text-gray-500">Founded</div>
            </div>
            <div>
              <div className="text-2xl font-light">200k+</div>
              <div className="text-gray-500">Smart Contracts Analyzed</div>
            </div>
            <div>
              <div className="text-2xl font-light">10+</div>
              <div className="text-gray-500">Supported Blockchains</div>
            </div>
            <div>
              <div className="text-2xl font-light">10K+</div>
              <div className="text-gray-500">Analysts</div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};