import React from 'react';

// Helper function to generate sparkline points
// Adjusted to ensure sparkline is visible even with flat data or single point
const generateSparklinePoints = (
  data: number[] | undefined,
  svgWidth: number,
  svgHeight: number
): string => {
  if (!data || data.length === 0) return `0,${svgHeight / 2} ${svgWidth},${svgHeight / 2}`; // Flat line if no data

  let points = [...data];
  if (points.length === 1) {
    points = [points[0], points[0]]; // Duplicate single point to draw a line
  }
  
  const minVal = Math.min(...points);
  const maxVal = Math.max(...points);
  
  // If all values are the same, draw a flat line in the middle.
  if (minVal === maxVal) {
    return `0,${svgHeight / 2} ${svgWidth},${svgHeight / 2}`;
  }

  const effectiveHeight = svgHeight * 0.8; // Use 80% of height to add padding
  const yPadding = svgHeight * 0.1;

  return points
    .map((point, i) => {
      const x = (points.length === 1) ? svgWidth / 2 : (i / (points.length - 1)) * svgWidth;
      const y = svgHeight - (((point - minVal) / (maxVal - minVal)) * effectiveHeight + yPadding);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
};


interface DashboardCardProps {
  title: string;
  value: string;
  icon: React.ReactNode; // Expect a rendered icon component
  trendText: string;
  trendColorClass: string; // e.g., "text-green-500"
  sparklineData?: number[];
  sparklineColorClass?: string; // e.g., "stroke-blue-500"
  gradientBgClass?: string; // e.g., "from-blue-50 to-purple-50"
  iconContainerClass?: string; // e.g., "bg-blue-100"
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  trendText,
  trendColorClass,
  sparklineData,
  sparklineColorClass = 'stroke-neutral-500 dark:stroke-neutral-400',
  gradientBgClass = 'from-neutral-100 to-neutral-200 dark:from-neutral-850 dark:to-neutral-800', // Premium default gradient
  iconContainerClass = 'bg-neutral-200 dark:bg-neutral-700'
}) => {
  const sparklinePoints = generateSparklinePoints(sparklineData, 80, 30); // width 80, height 30 for sparkline SVG

  return (
    <div className={`p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out bg-gradient-to-br ${gradientBgClass} border border-neutral-200/60 dark:border-neutral-700/50 transform hover:scale-[1.02] hover:-translate-y-1`}>
      <div className="flex items-center justify-between">
        {/* Left: Icon */}
        <div className={`p-3.5 rounded-xl ${iconContainerClass}`}>
          {icon}
        </div>

        {/* Right: Sparkline (optional) */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="w-20 h-10"> {/* Container for sparkline */}
            <svg viewBox="0 0 80 30" className="w-full h-full" preserveAspectRatio="none">
              <polyline
                fill="none"
                strokeWidth="2.5" // Slightly thicker sparkline
                points={sparklinePoints}
                className={sparklineColorClass}
              />
            </svg>
          </div>
        )}
      </div>

      {/* Middle: Text Content */}
      <div className="mt-5">
        <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">{title}</p>
        <p className="text-4xl font-extrabold text-neutral-800 dark:text-neutral-50 mt-1">{value}</p>
      </div>
      
      {trendText && (
        <p className={`text-xs font-medium mt-3 ${trendColorClass}`}>
          {trendText}
        </p>
      )}
    </div>
  );
};