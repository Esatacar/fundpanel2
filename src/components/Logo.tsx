import React from 'react';

interface LogoProps {
  size?: 'default' | 'large';
}

export default function Logo({ size = 'default' }: LogoProps) {
  const textSize = size === 'large' ? 'text-5xl' : 'text-3xl';
  
  return (
    <div className={`flex items-center justify-center h-${size === 'large' ? '20' : '12'}`}>
      <span className={`${textSize} text-[#0a2547] font-normal leading-none`}>
        <span className="font-bold inline-block">e</span>
        <span className="font-bold inline-block text-[0.9em]">2</span>
        <span className="inline-block">v</span>
        <span className="inline-block">c</span>
      </span>
    </div>
  );
}
