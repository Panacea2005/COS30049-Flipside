import { Hero } from '../../components/Hero/Hero';
import { GrowChain } from '../../components/sections/GrowChain/GrowChain';
import { GrowImpact } from '../../components/sections/GrowImpact/GrowImpact';
import { GrowWallet } from '../../components/sections/GrowWallet/GrowWallet';
import { Partners } from '../../components/sections/Partners/Partners';
import { Newsletter } from '../../components/sections/Newsletter/Newsletter';

export const HomePage = () => {
  return (
    <>
      <section id="hero">
        <Hero />
      </section>
      <section id="chains">
        <GrowChain />
      </section>
      <section id="analysts">
        <GrowImpact />
      </section>
      <section id="explorers">
        <GrowWallet />
      </section>
      <Partners />
      <Newsletter />
    </>
  );
};