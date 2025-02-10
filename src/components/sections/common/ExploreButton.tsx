interface ExploreButtonProps {
  children: React.ReactNode;
  href: string;
  theme?: 'dark' | 'light';
}

export const ExploreButton = ({ 
  children, 
  href,
  theme = 'dark'
}: ExploreButtonProps) => {
  const bgColor = theme === 'dark' ? 'bg-white' : 'bg-black';
  const textColor = theme === 'dark' ? 'text-black' : 'text-white';

  return (
    <a 
      href={href}
      className={`${bgColor} ${textColor} py-4 px-6 inline-flex items-center justify-between rounded-lg w-full max-w-md`}
    >
      <span>{children}</span>
      <span>→</span>
    </a>
  );
};