import './styles.css';

interface HexButtonProps {
  label?: string;
  locked?: boolean;
  tags?: string[];
  icon?: string;
}

export const HexButton = ({ label, locked, tags = [], icon }: HexButtonProps) => {
  return (
    <button 
      className={`hex-button group ${locked ? 'locked' : ''}`}
      disabled={locked}
    >
      <div className="hex-content">
        {label && (
          <div className="flex items-center space-x-2">
            {icon && <img src={icon} alt="" className="w-4 h-4" />}
            <span>{label}</span>
            <span className="transform group-hover:translate-x-1 transition-transform">→</span>
          </div>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}
        {locked && (
          <div className="absolute top-2 right-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </button>
  );
};