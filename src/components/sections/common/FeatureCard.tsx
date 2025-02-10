interface FeatureCardProps {
  label: string;
  title: string;
  ctaText?: string;
  ctaHref?: string;
  className?: string;
  theme?: 'dark' | 'light';
}

export const FeatureCard = ({ 
  label, 
  title, 
  ctaText, 
  ctaHref,
  className = '',
  theme = 'dark'
}: FeatureCardProps) => {
  const bgColor = theme === 'dark' 
    ? 'bg-black/40 hover:bg-black/50' 
    : 'bg-white/40 hover:bg-white/50';
  const textColor = theme === 'dark' ? 'text-white' : 'text-black';
  const labelColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className={`relative group ${className}`}>
      <div className={`absolute inset-0 backdrop-blur-xl rounded-2xl transition-colors ${bgColor}`} />
      <div className={`relative p-8 rounded-2xl ${textColor}`}>
        <p className={`text-sm mb-4 ${labelColor}`}>{label}</p>
        <h3 className="text-2xl mb-4 font-light">{title}</h3>
        {ctaText && ctaHref && (
          <a 
            href={ctaHref}
            className="inline-flex items-center space-x-2 transition-colors hover:opacity-80"
          >
            <span>{ctaText}</span>
            <span>→</span>
          </a>
        )}
      </div>
    </div>
  );
};