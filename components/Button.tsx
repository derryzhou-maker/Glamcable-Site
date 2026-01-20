import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'white';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className = '', children, ...props }) => {
  const baseStyles = "inline-flex items-center justify-center px-6 py-3 border text-base font-medium rounded-md shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "border-transparent text-white bg-primary hover:bg-blue-700 focus:ring-primary",
    secondary: "border-transparent text-white bg-secondary hover:bg-orange-600 focus:ring-secondary",
    outline: "border-primary text-primary bg-transparent hover:bg-blue-50 focus:ring-primary",
    white: "border-transparent text-primary bg-white hover:bg-gray-50 focus:ring-white"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};