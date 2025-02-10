interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const SectionTitle = ({ children, className = '' }: SectionTitleProps) => {
  return (
    <h2 className={`text-[8rem] font-light leading-none mb-8 ${className}`}>
      {children}
    </h2>
  );
};