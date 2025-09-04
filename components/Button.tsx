
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = 'inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg transition-transform transform hover:scale-105 duration-200 disabled:opacity-50 disabled:cursor-not-allowed gap-2';

  const variantStyles = {
    primary: 'text-white bg-brand-primary hover:bg-brand-secondary focus:ring-brand-primary',
    secondary: 'text-light-text bg-dark-card hover:bg-gray-600 focus:ring-gray-500 border-dark-border',
  };

  return (
    <button
      type="button"
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
