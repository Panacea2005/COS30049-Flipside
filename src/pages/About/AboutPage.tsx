import { AboutHero } from './components/AboutHero';
import { WhatWeBelieve } from './components/WhatWeBelieve';
import { WhatWeDo } from './components/WhatWeDo';
import { Investors } from './components/Investors';
import { Newsletter } from '../../components/sections/Newsletter/Newsletter';

export const AboutPage = () => {
  return (
    <div>
      <AboutHero />
      <WhatWeBelieve />
      <WhatWeDo />
      <Investors />
      <Newsletter />
    </div>
  );
};