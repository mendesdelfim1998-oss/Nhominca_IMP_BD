import React from 'react';
import { Language } from '../../i18n/translations';

interface FlagIconProps {
  language: Language | 'pt' | 'fr' | 'en' | 'gw';
  className?: string;
}

export const FlagIcon: React.FC<FlagIconProps> = ({ language, className = 'w-5 h-3.5' }) => {
  if (language === 'pt' || language === 'gw') {
    // Official Flag of Republic of Guinea-Bissau (Bandeira da República da Guiné-Bissau)
    return (
      <svg
        viewBox="0 0 24 16"
        className={`${className} inline-block rounded-xs shadow-xs shrink-0 overflow-hidden border border-black/10`}
        aria-label="Bandeira da Guiné-Bissau"
      >
        {/* Top yellow stripe */}
        <rect x="8" y="0" width="16" height="8" fill="#FCD116" />
        {/* Bottom green stripe */}
        <rect x="8" y="8" width="16" height="8" fill="#009E49" />
        {/* Left vertical red stripe */}
        <rect x="0" y="0" width="8" height="16" fill="#CE1126" />
        {/* Black five-pointed star in the red hoist band */}
        <polygon
          points="4,4.2 4.9,7.0 7.3,7.0 5.4,8.5 6.1,11.2 4,9.6 1.9,11.2 2.6,8.5 0.7,7.0 3.1,7.0"
          fill="#000000"
        />
      </svg>
    );
  }

  if (language === 'fr') {
    // Official Flag of France (Drapeau de la France)
    return (
      <svg
        viewBox="0 0 24 16"
        className={`${className} inline-block rounded-xs shadow-xs shrink-0 overflow-hidden border border-black/10`}
        aria-label="Drapeau de la France"
      >
        <rect x="0" y="0" width="8" height="16" fill="#002395" />
        <rect x="8" y="0" width="8" height="16" fill="#FFFFFF" />
        <rect x="16" y="0" width="8" height="16" fill="#ED2939" />
      </svg>
    );
  }

  // English / UK Flag (Union Jack)
  return (
    <svg
      viewBox="0 0 24 16"
      className={`${className} inline-block rounded-xs shadow-xs shrink-0 overflow-hidden border border-black/10`}
      aria-label="Flag of the United Kingdom"
    >
      <clipPath id="uk-clip">
        <rect x="0" y="0" width="24" height="16" />
      </clipPath>
      <g clipPath="url(#uk-clip)">
        {/* Blue background */}
        <rect x="0" y="0" width="24" height="16" fill="#012169" />
        {/* White saltire diagonals */}
        <path d="M0,0 L24,16 M24,0 L0,16" stroke="#FFFFFF" strokeWidth="3.2" />
        {/* Red saltire diagonals */}
        <path d="M0,0 L12,8 M24,0 L12,8 M24,16 L12,8 M0,16 L12,8" stroke="#C8102E" strokeWidth="1.6" />
        {/* White cross */}
        <rect x="10" y="0" width="4" height="16" fill="#FFFFFF" />
        <rect x="0" y="6" width="24" height="4" fill="#FFFFFF" />
        {/* Red cross */}
        <rect x="10.8" y="0" width="2.4" height="16" fill="#C8102E" />
        <rect x="0" y="6.8" width="24" height="2.4" fill="#C8102E" />
      </g>
    </svg>
  );
};
