import { Container } from "../../../components/layout/Container";
import { Lightbulb, Trophy, BarChart, Handshake } from "lucide-react";

const BELIEFS = [
  {
    icon: <Lightbulb className="text-violet-600" />,
    title: "Blockchain Data Should Be Accessible to All",
    description:
      "We believe that onchain data should be open and transparent—so we provide AI-powered insights that help users explore, analyze, and understand blockchain activity.",
  },
  {
    icon: <Trophy className="text-violet-600" />,
    title: "Empowering Builders & Analysts with AI",
    description:
      "Understanding smart contract behavior is key to security, efficiency, and adoption. Our platform enables users to analyze, optimize, and deploy contracts with AI-driven intelligence.",
  },
  {
    icon: <BarChart className="text-violet-600" />,
    title: "Insights Over Speculation",
    description:
      "We prioritize real, measurable insights over hype. Our platform provides data-backed analytics that developers, analysts, and explorers can trust.",
  },
  {
    icon: <Handshake className="text-violet-600" />,
    title: "Collaboration Fuels Innovation",
    description:
      "We connect blockchains, developers, and analysts to create a thriving ecosystem where data, AI, and community-driven research power the next generation of Web3.",
  },
];

export const WhatWeBelieve = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-96 h-96 bg-gradient-to-br from-pink-400 via-purple-500 to-transparent rounded-full blur-3xl"></div>
      </div>
      <Container>
        <div className="mb-16 relative z-10">
          <span className="text-violet-600 text-sm">Our mission</span>
          <h2 className="text-[8rem] leading-none font-light mt-4">
            WHAT WE
            <br />
            BELIEVE
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-16 relative z-10">
          {BELIEFS.map((belief) => (
            <div
              key={belief.title}
              className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="text-4xl mb-4">{belief.icon}</div>
              <h3 className="text-2xl font-light mb-4">{belief.title}</h3>
              <p className="text-gray-600">{belief.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};
