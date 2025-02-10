import { type ExploreButtonProps } from './types';
import { getGradientStyle } from './utils';

export const ExploreButton = ({ 
  children, 
  href,
  variant = 'chain'
}: ExploreButtonProps) => {
  const baseClasses = "group relative py-4 px-6 inline-flex items-center justify-between rounded-lg w-full max-w-md transition-all duration-300";
  const textColor = variant === 'impact' ? 'text-white' : 'text-black';
  const bgColor = variant === 'impact' ? 'bg-black' : 'bg-white';
  
  return (
    <a 
      href={href}
      className={`${baseClasses} ${bgColor} ${textColor} hover:text-white`}
    >
      <div className="relative z-10 flex items-center justify-between">
        <span>{children}</span>
        <span className="transform group-hover:translate-x-1 transition-transform">→</span>
      </div>
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"
        style={getGradientStyle(variant)}
      />
    </a>
  );
};