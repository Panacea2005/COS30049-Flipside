export const getGradientStyle = (variant: 'chain' | 'impact' | 'wallet') => {
  const gradients = {
    chain: 'linear-gradient(45deg, #60A5FA, #3B82F6)',
    impact: 'linear-gradient(45deg, #8B5CF6, #6D28D9)',
    wallet: 'linear-gradient(45deg, #F87171, #DC2626)'
  };

  return {
    background: gradients[variant]
  };
};