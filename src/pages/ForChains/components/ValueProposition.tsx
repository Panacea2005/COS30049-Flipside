import { motion } from "framer-motion";
import { Container } from "../../../components/layout/Container";

const VALUE_PROPS = [
  {
    label: "AI-Driven Smart Contract Audits",
    title:
      "Flide AI automatically scans Move & Sui smart contracts, identifying security vulnerabilities, inefficiencies, and optimization opportunities.",
    image: "/for-chains-1.png",
    cta: {
      text: "Run an AI Audit",
      href: "/flide",
    },
  },
  {
    label: "Onchain Intelligence & Security Insights",
    title:
      "Our AI models analyze contract interactions, detect anomalous behavior, and provide risk scores to improve security.",
    image: "/for-chains-2.png",
    cta: {
      text: "Explore AI-Powered Security",
      href: "/flide",
    },
  },
  {
    label: "Effortless Smart Contract Deployment",
    title:
      "Flide AI streamlines the Move & Sui smart contract deployment process, automating deployment while ensuring efficiency and security.",
    image: "/for-chains-3.png",
    cta: {
      text: "Deploy with Flide AI",
      href: "/flide",
    },
  },
];

export const ValueProposition = () => {
  return (
    <section className="py-32 bg-white">
      <Container>
        <h2 className="text-4xl sm:text-6xl md:text-8xl leading-none font-light mb-24 text-gray-900">
          TURN RAW
          <br />
          DATA INTO
          <br />
          <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-blue-700 text-transparent bg-clip-text">
            REAL VALUE
          </span>
        </h2>

        <div className="space-y-16 sm:space-y-32">
          {VALUE_PROPS.map((prop, i) => (
            <div
              key={i}
              className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16 items-center"
            >
              <div className={i % 2 === 0 ? "order-1" : "order-2"}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{
                    duration: 0.5,
                    ease: "easeOut"
                  }}
                >
                  <img
                    src={prop.image}
                    alt={prop.label}
                    className="w-full rounded-lg"
                  />
                </motion.div>
              </div>

              <motion.div
                style={{
                  order: i % 2 === 0 ? 2 : 1, // This replaces the order-* class
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem", // Equivalent to `space-y-4`
                }}
                initial={{ opacity: 0, x: i % 2 === 0 ? 50 : -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{
                  duration: 0.5,
                  ease: "easeOut",
                  delay: 0.2,
                }}
              >

                <span className="text-blue-600 text-sm">{prop.label}</span>
                <p className="text-xl sm:text-2xl font-light mt-4 mb-8 text-gray-900">
                  {prop.title}
                </p>
                {prop.cta && (
                  <a
                    href={prop.cta.href}
                    className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <span>{prop.cta.text}</span>
                    <span>→</span>
                  </a>
                )}
              </motion.div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};