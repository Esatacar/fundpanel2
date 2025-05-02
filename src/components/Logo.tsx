import React from 'react';

interface LogoProps {
  size?: 'default' | 'large';
}

export default function Logo({ size = 'default' }: LogoProps) {
  const textSize = size === 'large' ? 'text-6xl' : 'text-4xl';
  
  return (
    <div className={`flex items-center justify-center h-${size === 'large' ? '24' : '16'}`}>
      <span className={`${textSize} text-[#0a2547] font-normal leading-none`}>
        <span className="font-[650] inline-block">e</span>
        <span className="font-[650] inline-block text-[0.75em] translate-y-[0.015em]">2</span>
        <span className="font-light inline-block">v</span>
        <span className="font-light inline-block">c</span>
      </span>
    </div>
  );
}
