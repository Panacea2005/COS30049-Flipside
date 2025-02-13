import { Container } from "../../components/layout/Container";
import { ChainsHero } from "./components/ChainsHero";
import { Partners } from "../../components/sections/Partners/Partners";
import { ValueProposition } from "./components/ValueProposition";
import { GrowthFormula } from "./components/GrowthFormula";
import { Newsletter } from "../../components/sections/Newsletter/Newsletter";

export const ForChainsPage = () => {
  return (
    <div>
      <div className="bg-black text-white">
        <ChainsHero />
      </div>

      <div className="bg-white">
        <Partners />
        <Container>
          <ValueProposition />
        </Container>
      </div>

      <div className="bg-black text-white">
        <Container>
          <GrowthFormula />
        </Container>
      </div>
      <div className="bg-white">
        <Newsletter />
      </div>
    </div>
  );
};
