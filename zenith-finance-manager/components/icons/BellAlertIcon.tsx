
import React from 'react';

interface IconProps { className?: string; }
export const BellAlertIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0M3.124 15.632S3 15.548 3 15.33V9A9.01 9.01 0 0112 0c4.968 0 9 4.025 9 9v6.332C21 15.548 20.876 15.632 20.876 15.632M12 21a2.25 2.25 0 01-2.248-2.131H14.248A2.25 2.25 0 0112 21z" />
</svg>
);
