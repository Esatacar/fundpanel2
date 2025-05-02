import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

interface LogoProps {
  size?: 'default' | 'large';
}

export default function Logo({ size = 'default' }: LogoProps) {
  const [imageError, setImageError] = useState(false);
  const imageSize = size === 'large' ? 'h-20' : 'h-12';
  
  if (imageError) {
    return (
      <div className={`flex items-center justify-center ${imageSize}`}>
        <Building2 className={`${size === 'large' ? 'h-16 w-16' : 'h-10 w-10'} text-[#0a2547]`} />
      </div>
    );
  }

  return (
    <img 
      src="https://i.postimg.cc/JnsMQwzh/e2vc-logo.png"
      alt="e2vc Logo"
      className={`${imageSize} w-auto object-contain`}
      onError={() => setImageError(true)}
      crossOrigin="anonymous"
    />
  );
}
