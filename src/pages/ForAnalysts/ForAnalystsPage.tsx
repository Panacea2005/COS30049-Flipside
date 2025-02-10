import { Container } from '../../components/layout/Container';
import { AnalystsHero } from './components/AnalystsHero';
import { Stats } from './components/Stats';
import { StudioSection } from './components/StudioSection';
import { DevSection } from './components/DevSection';
import { FAQ } from './components/FAQ';
import { Newsletter } from '../../components/sections/Newsletter/Newsletter';

export const ForAnalystsPage = () => {
  return (
    <div>
      <AnalystsHero />
      <Container>
        <Stats />
        <StudioSection />
      </Container>
      <DevSection />
      <Container>
        <FAQ />
      </Container>
      <div className='bg-white'>
        <Container>
          <Newsletter />
        </Container>
      </div>
    </div>
  );
};