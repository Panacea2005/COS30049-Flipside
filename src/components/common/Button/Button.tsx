import { type ButtonProps } from './types';
import clsx from 'clsx';

export const Button = ({ 
  children, 
  variant = 'primary',
  className,
  ...props 
}: ButtonProps) => {
  return (
    <button
      className={clsx(
        'font-medium px-4 py-2 rounded-md transition-colors',
        {
          'bg-black text-white hover:bg-gray-800': variant === 'primary',
          'text-gray-700 hover:text-gray-900': variant === 'secondary',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};