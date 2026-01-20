import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "h-12 w-12" }) => {
  return (
    <div className={`relative flex items-center justify-center border-2 border-dashed border-gray-400 rounded-full bg-gray-50 ${className}`}>
      <span className="text-[10px] font-bold text-gray-400 text-center leading-tight">
        UPLOAD<br/>LOGO
      </span>
    </div>
  );
};