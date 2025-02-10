import { motion } from 'framer-motion';

const STEPS = [
  {
    title: 'Analyze',
    description: 'Flide AI leverages advanced AI models to analyze, optimize, and deploy smart contracts efficiently on Move & Sui blockchains.',
    gradient: 'linear-gradient(45deg, #ff7e5f, #feb47b)' // Pink gradient
  },
  {
    title: 'Score',
    description: 'Our AI assigns risk and performance scores, identifying weaknesses in contract logic, gas efficiency, and security risks before deployment.',
    gradient: 'linear-gradient(45deg, #6a11cb, #2575fc)' // Purple gradient
  },
  {
    title: 'Optimize & Deploy',
    description: 'Flide AI automates smart contract optimization and deployment, ensuring secure, high-performance contracts are launched with ease.',
    gradient: 'linear-gradient(45deg, #43cea2, #185a9d)' // Blue gradient
  }
];

export const FormulaSteps = () => {
  return (
    <div style={{ position: 'relative', backgroundColor: 'black', color: 'white', padding: '2rem' }}>
      <div style={{ position: 'relative' }}>
        {/* Blue wave graphic */}
        <div style={{ position: 'absolute', left: 0, bottom: 0, width: '100%' }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '400px',
                background: 'linear-gradient(to right, #60A5FA, #3B82F6)',
                opacity: 0.1 - i * 0.01,
                transform: `translateY(${i * 40}px) scale(${1 + i * 0.05})`,
                borderRadius: '100%',
              }}
              animate={{
                y: [i * 40, i * 40 + 10, i * 40],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          {STEPS.map((step, i) => (
            <div
              key={i}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(10px)',
                borderRadius: '0.5rem',
                padding: '2rem',
                marginBottom: '2rem',
                maxWidth: '40rem',
                marginLeft: 'auto',
                color: 'white',
              }}
            >
              <h3 style={{ 
                fontSize: '1.875rem', 
                marginBottom: '1rem', 
                background: step.gradient, 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: 'transparent',
                backgroundSize: '200%', // Adjusted to make gradient more visible
                backgroundPosition: 'center', // Adjusted to make gradient more visible
              }}>
                {step.title}
              </h3>
              <p style={{ color: '#D1D5DB' }}>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};