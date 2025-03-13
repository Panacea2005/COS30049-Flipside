export interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onMouseEnter?: () => void;  // Add this
  onMouseLeave?: () => void;  // Add this
}