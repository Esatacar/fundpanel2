import React from 'react';

interface LogoProps {
  size?: 'default' | 'large';
}

export default function Logo({ size = 'default' }: LogoProps) {
  const imageSize = size === 'large' ? 'h-20' : 'h-12';
  
  return (
    <img 
      src="https://i.postimg.cc/JnsMQwzh/e2vc-logo.png" 
      alt="InvestorPortal Logo" 
      className={`${imageSize} w-auto object-contain`}
    />
  );
}