import { Container } from '../../../components/layout/Container';

export const QuestsHero = () => {
  return (
    <div className="pt-32 pb-16">
      <Container>
        <div className="max-w-4xl">
          <h1 className="text-[8rem] leading-none font-light tracking-tight">
            EXPLORE
            <br />
            TRENDING
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-pink-500 text-transparent bg-clip-text">
            BLOCKCHAIN ACTIVITY
            </span>
          </h1>
          <div className="mt-8">
            <button className="text-orange-400 text-sm font-medium">
              Start learning today
            </button>
          </div>
        </div>
      </Container>
    </div>
  );
};