import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  variant = 'rectangular',
  width,
  height 
}) => {
  const baseClasses = 'animate-pulse bg-stone-800/50';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
};

export const PlaceDisplaySkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Header Skeleton */}
      <div className="text-center space-y-4 pt-8">
        <Skeleton height="3rem" width="60%" className="mx-auto" />
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          <Skeleton height="2.5rem" width="10rem" />
          <Skeleton height="2.5rem" width="10rem" />
          <Skeleton height="2.5rem" width="10rem" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex justify-center gap-4 border-b border-stone-800 pb-1 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height="2.5rem" width="8rem" />
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Skeleton */}
        <div className="space-y-6">
          <Skeleton height="24rem" className="aspect-video" />
          <Skeleton height="12rem" />
        </div>

        {/* Cards Skeleton */}
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height="10rem" />
          ))}
        </div>
      </div>
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-stone-900/50 p-5 rounded-lg border border-stone-800 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width="2rem" height="2rem" />
        <Skeleton height="1.5rem" width="60%" />
      </div>
      <Skeleton height="1rem" width="100%" />
      <Skeleton height="1rem" width="90%" />
      <Skeleton height="1rem" width="80%" />
    </div>
  );
};

export default Skeleton;
