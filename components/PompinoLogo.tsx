
import React from 'react';

export const PompinoLogo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg 
      viewBox="0 0 512 512" 
      fill="currentColor" 
      className={className} 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top Hat */}
      <path d="M150 140 L362 140 L350 40 L162 40 Z" fill="currentColor"/>
      <rect x="120" y="140" width="272" height="40" rx="8" fill="currentColor"/>
      
      {/* Owl Head Shape */}
      <path d="M110 180 C110 180 90 250 110 350 C130 440 256 500 256 500 C256 500 382 440 402 350 C422 250 402 180 402 180 L256 210 L110 180 Z" fill="currentColor"/>
      
      {/* Eyes Container (Cutout simulation) */}
      <g fill="#050505">
         <circle cx="190" cy="290" r="55"/>
         <circle cx="322" cy="290" r="55"/>
      </g>
      
      {/* Eye Pupils */}
      <circle cx="190" cy="290" r="25" fill="currentColor"/>
      <circle cx="322" cy="290" r="25" fill="currentColor"/>
      
      {/* Monocle Frame & String */}
      <circle cx="190" cy="290" r="62" stroke="currentColor" strokeWidth="8" fill="none"/>
      <path d="M135 260 C120 350 160 500 160 500" stroke="currentColor" strokeWidth="0" fill="none"/> 
      <path d="M245 290 C245 290 260 400 260 450" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.5"/>
      
      {/* Beak */}
      <path d="M240 360 L272 360 L256 410 Z" fill="#050505"/>
      
      {/* Feathers / Details */}
      <path d="M256 190 L256 220" stroke="#050505" strokeWidth="4"/>
    </svg>
  );
};
