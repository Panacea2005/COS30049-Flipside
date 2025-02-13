import './styles.css';

interface HexButtonProps {
  label?: string;  // Make label optional
  locked?: boolean;
  tags?: string[];
}


export const HexButton = ({ label, locked, tags = [] }: HexButtonProps) => {
  return (
    <button className={`hex-button group ${locked ? 'locked' : ''}`} disabled={locked}>
      <div className="hex-content">
        <span className="hex-label">{label}</span>
        {tags.length > 0 && (
          <div className="tag-container">
            {tags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
};
