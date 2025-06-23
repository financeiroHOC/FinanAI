
import React from 'react';

interface IconProps { className?: string; }
export const HomeIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.5 1.5 0 012.122 0l8.954 8.955M11.25 10.5v8.25m-3.75-8.25v8.25m7.5-8.25v8.25M3 12.75v6.75a1.5 1.5 0 001.5 1.5h15a1.5 1.5 0 001.5-1.5v-6.75M9 6.75h6v-1.5a1.5 1.5 0 00-1.5-1.5h-3a1.5 1.5 0 00-1.5 1.5v1.5z" />
  </svg>
);
