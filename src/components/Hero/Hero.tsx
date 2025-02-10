import { Container } from '../layout/Container';
import { HeroText } from './HeroText';
import { HeroImage } from './HeroImage';

export const Hero = () => {
  return (
    <div className="relative min-h-[calc(100vh+200px)] pt-16">
      <HeroImage />
      <Container className="relative z-10">
        <div className="pt-20 pb-16">
          <HeroText />
        </div>
      </Container>
    </div>
  );
};