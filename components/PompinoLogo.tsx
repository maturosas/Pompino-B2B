
import React from 'react';

interface PompinoLogoProps {
  className?: string;
  variant?: 'full' | 'icon';
  animate?: boolean; // Prop to trigger animation
}

export const PompinoLogo: React.FC<PompinoLogoProps> = ({ className, variant = 'full', animate = false }) => {
  
  // --- Simplified Animation Class Logic ---
  const iconClass = animate ? 'animate-logo-icon' : '';
  const textClass = animate ? 'animate-logo-text' : '';

  // Shared Owl Path Elements
  const OwlContent = () => (
      <g className={iconClass}>
        {/* Top Hat */}
        <path d="M 55 50 L 145 50 L 145 5 L 55 5 Z" fill="currentColor" />
        <rect x="55" y="35" width="90" height="15" fill="#111" /> {/* Band */}
        <path d="M 35 50 L 165 50 L 165 58 Q 165 62 161 62 L 39 62 Q 35 62 35 58 Z" fill="currentColor" /> {/* Brim */}

        {/* Head Shape */}
        <path 
          d="M 30 70 
             Q 10 60 10 90 
             Q 10 150 100 185 
             Q 190 150 190 90 
             Q 190 60 170 70 
             L 100 90 
             L 30 70 Z" 
          fill="currentColor" 
        />
        
        {/* Eyes (Black Background) */}
        <circle cx="65" cy="115" r="28" fill="#050505" />
        <circle cx="135" cy="115" r="28" fill="#050505" />

        {/* Pupils */}
        <circle cx="65" cy="115" r="8" fill="currentColor" />
        <circle cx="135" cy="115" r="8" fill="currentColor" />
        
        {/* Eye Glint */}
        <circle cx="68" cy="112" r="2" fill="#050505" />
        <circle cx="138" cy="112" r="2" fill="#050505" />

        {/* Beak */}
        <path d="M 100 150 L 88 135 L 112 135 Z" fill="currentColor" />
        {/* Mouth */}
        <path d="M 95 155 Q 100 160 105 155" stroke="currentColor" strokeWidth="1.5" fill="none" />

        {/* Monocle */}
        <circle cx="65" cy="115" r="32" stroke="currentColor" strokeWidth="2.5" fill="none" />
        <path d="M 33 115 Q 20 150 40 180" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.8" />
      </g>
  );

  if (variant === 'icon') {
      return (
        <svg viewBox="0 0 200 200" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
            <OwlContent />
        </svg>
      );
  }

  return (
    <svg viewBox="0 0 400 360" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Shadow Filter */}
        <filter id="deep-drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3.5"/>
          <feOffset dx="3" dy="4" result="offsetblur"/>
          <feComponentTransfer><feFuncA type="linear" slope="0.7"/></feComponentTransfer>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* --- OWL ICON (Larger and centered) --- */}
      <g transform="translate(100, 60) scale(1.15)">
        <OwlContent />
      </g>

      {/* --- TEXT GROUP --- */}
      <g className={textClass} style={{ filter: 'url(#deep-drop-shadow)' }}>
        <text x="200" y="280" textAnchor="middle" fontFamily="sans-serif" fontWeight="900" fontSize="52" letterSpacing="3" fill="currentColor">
            POMPINO
        </text>
        <text x="200" y="325" textAnchor="middle" fontFamily="sans-serif" fontWeight="900" fontSize="24" letterSpacing="2" fill="currentColor">
            BZS GRUPO BEBIDAS
        </text>
        <text x="200" y="350" textAnchor="middle" fontFamily="monospace" fontWeight="500" fontSize="16" letterSpacing="2" fill="currentColor" opacity="0.8">
            by Mati Rosas
        </text>
      </g>
    </svg>
  );
};
