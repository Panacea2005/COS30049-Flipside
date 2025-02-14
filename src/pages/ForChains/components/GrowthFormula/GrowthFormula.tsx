import { Container } from "../../../../components/layout/Container";
import { FormulaSteps } from "./FormulaSteps";
import { GrowthBanner } from "./GrowthBanner";

export const GrowthFormula = () => {
  return (
    <section className="py-32">
      <Container>
        <div className="mb-16">
          <span className="text-blue-400 text-sm">How it works</span>
          <h2 className="text-4xl sm:text-6xl md:text-8xl leading-none font-light mt-4">
            <span className="bg-gradient-to-r from-pink-400 via-blue-500 to-sky-700 text-transparent bg-clip-text">
              THE FLIDE AI
            </span>
            <br />
            CONTRACT
            <br />
            OPTIMIZATION
            <br />
            FORMULA
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start mb-32">
          <p className="text-xl sm:text-2xl max-w-2xl font-light">
            We blend data science and community to help our partners achieve
            substantial market cap outperformance.
          </p>
        </div>

        <FormulaSteps />
        <GrowthBanner />
      </Container>
    </section>
  );
};
