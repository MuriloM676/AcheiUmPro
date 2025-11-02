import React, { useState } from 'react';

interface RatingStarsProps {
  rating: number;
  totalReviews?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  onRate?: (rating: number) => void;
  isInteractive?: boolean;
  maxRating?: number;
  className?: string;
}

const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  totalReviews,
  size = 'md',
  showCount = true,
  onRate,
  isInteractive = false,
  maxRating = 5,
  className = ''
}) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  const starSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleRatingClick = (selectedRating: number) => {
    if (isInteractive && onRate) {
      onRate(selectedRating);
    }
  };

  const handleMouseEnter = (starRating: number) => {
    if (isInteractive) {
      setHoveredRating(starRating);
    }
  };

  const handleMouseLeave = () => {
    if (isInteractive) {
      setHoveredRating(null);
    }
  };

  const StarIcon = ({ filled }: { filled: boolean }) => (
    <svg
      className={`${starSizeClasses[size]} ${filled ? 'text-yellow-400' : 'text-gray-300'} fill-current`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className="flex items-center space-x-0.5">
        {Array.from({ length: maxRating }, (_, index) => {
          const starRating = index + 1;
          const isFilled = starRating <= (hoveredRating || rating);

          return (
            <button
              key={index}
              type="button"
              className={`${isInteractive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} focus:outline-none`}
              onClick={() => handleRatingClick(starRating)}
              onMouseEnter={() => handleMouseEnter(starRating)}
              onMouseLeave={handleMouseLeave}
              disabled={!isInteractive}
            >
              <StarIcon filled={isFilled} />
            </button>
          );
        })}
      </div>

      {showCount && (
        <div className={`${sizeClasses[size]} text-gray-600 flex items-center space-x-1`}>
          <span className="font-medium">{rating.toFixed(1)}</span>
          {totalReviews !== undefined && (
            <span className="text-gray-500">
              ({totalReviews} {totalReviews === 1 ? 'avaliação' : 'avaliações'})
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default RatingStars;
