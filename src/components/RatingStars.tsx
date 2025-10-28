import React from 'react';

interface RatingStarsProps {
  rating: number;
  totalReviews?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  onRate?: (rating: number) => void;
  isInteractive?: boolean;
}

const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  totalReviews,
  size = 'md',
  showCount = true,
  onRate,
  isInteractive = false
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  const handleRatingClick = (selectedRating: number) => {
    if (isInteractive && onRate) {
      onRate(selectedRating);
    }
  };

  return (
    <div className="flex items-center">
      <div className={`flex text-yellow-400 ${sizeClasses[size]}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => handleRatingClick(star)}
            className={isInteractive ? 'cursor-pointer hover:text-yellow-500' : ''}
          >
            {star <= Math.floor(rating) ? '★' : star - rating < 1 && star - rating > 0 ? '★' : '☆'}
          </span>
        ))}
      </div>
      {showCount && totalReviews !== undefined && (
        <span className="ml-2 text-gray-600 dark:text-gray-300 text-sm">
          ({totalReviews} {totalReviews === 1 ? 'avaliação' : 'avaliações'})
        </span>
      )}
    </div>
  );
};

export default RatingStars;