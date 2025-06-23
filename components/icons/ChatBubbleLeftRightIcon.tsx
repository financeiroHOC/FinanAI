
import React from 'react';

interface IconProps { className?: string; }
export const ChatBubbleLeftRightIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3.696-3.696A9.003 9.003 0 0112 15.75c-1.036 0-2.022.186-2.902.518A2.25 2.25 0 016.75 18v-2.618C4.282 14.85 3 12.834 3 10.5c0-.94.616-1.785 1.5-2.097V6.75A2.25 2.25 0 016.75 4.5h10.5A2.25 2.25 0 0119.5 6.75v1.761Z M12.75 6.006a.75.75 0 00-1.5 0v2.25a.75.75 0 001.5 0v-2.25Zm-2.625 3.002V6.75a.75.75 0 00-1.5 0v2.25a.75.75 0 001.5 0Z" />
  </svg>
);
