
import React from 'react';

export const ApmexIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 100 25" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <style>
      {`.apm-text { font: bold 22px Arial, sans-serif; fill: #FFFFFF; }`}
    </style>
    <rect x="0" y="0" width="25" height="25" fill="#002D5D"/>
    <path d="M12.5 5 L5 12.5 L12.5 20 L20 12.5 Z" fill="#FFFFFF"/>
    <text x="35" y="19" className="apm-text">APMEX</text>
  </svg>
);
