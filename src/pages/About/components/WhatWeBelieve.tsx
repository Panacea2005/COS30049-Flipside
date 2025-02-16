import { Container } from "../../../components/layout/Container";
import { Lightbulb, Trophy, BarChart, Handshake } from "lucide-react";
import { motion, Variants } from "framer-motion";

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

const cardVariants: Variants = {
  hidden: { opacity: 0, y: -50 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: index * 0.2, ease: "easeOut" },
  }),
};

export const WhatWeBelieve = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-96 h-96 bg-gradient-to-br from-pink-400 via-purple-500 to-transparent rounded-full blur-3xl"></div>
      </div>
      <Container>
        <div className="mb-16 relative z-10">
          <span className="text-violet-600 text-sm">Our mission</span>
          <h2 className="text-4xl sm:text-6xl md:text-8xl leading-none font-light mt-4">
            WHAT WE
            <br />
            BELIEVE
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16 relative z-10">
          {BELIEFS.map((belief, index) => (
            <motion.div
              key={belief.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              custom={index}
              variants={cardVariants}
              style={{ background: "white", padding: "2rem", borderRadius: "0.5rem", boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)", transition: "box-shadow 0.3s" }}
              whileHover={{ boxShadow: "0 15px 30px rgba(0, 0, 0, 0.2)" }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>{belief.icon}</div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 300, marginBottom: "1rem" }}>{belief.title}</h3>
              <p style={{ color: "#4B5563" }}>{belief.description}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
};