import { Container } from '../../components/layout/Container';
import { ExplorersHero } from './components/ExplorersHero';
import { QuestsHero } from './components/QuestsHero';
import { TrendingQuests } from './components/TrendingQuests';
import { HowItWorks } from './components/HowItWorks';
import { GrailSection } from './components/GrailSection';
import { GameSection } from './components/GameSection';
import { QuestBanner } from './components/QuestBanner';
import { FAQ } from './components/FAQ';
import { SignUpBanner } from './components/SignUpBanner';
import { Newsletter } from '../../components/sections/Newsletter/Newsletter';

export const ForExplorersPage = () => {
    return (
        <div>
            <div className='bg-black text-white'>
                <ExplorersHero />
            </div>
            {/* White background sections */}
            <div className="bg-white">
                <QuestsHero />
                <Container>
                    <TrendingQuests />
                    <HowItWorks />
                </Container>
            </div>

            {/* Black background sections */}
            <div className="bg-black text-white">
                <Container>
                    <GrailSection />
                    <GameSection />
                    <QuestBanner />
                    <FAQ />
                </Container>
            </div>
            <div className="bg-white">
                <Container>
                    <SignUpBanner />
                </Container>
                <Newsletter />
            </div>
        </div>
    );
};