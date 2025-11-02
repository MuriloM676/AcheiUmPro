import React, { useState } from 'react';
import RatingStars from './RatingStars';

interface ReviewFormProps {
  onSubmit: (reviewData: { rating: number; comment: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialRating?: number;
  initialComment?: string;
  title?: string;
  submitButtonText?: string;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  initialRating = 0,
  initialComment = '',
  title = 'Avaliar Serviço',
  submitButtonText = 'Enviar Avaliação'
}) => {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [errors, setErrors] = useState<{ rating?: string; comment?: string }>({});

  const validateForm = () => {
    const newErrors: { rating?: string; comment?: string } = {};

    if (rating === 0) {
      newErrors.rating = 'Por favor, selecione uma avaliação de 1 a 5 estrelas';
    }

    if (comment.trim().length < 10) {
      newErrors.comment = 'O comentário deve ter pelo menos 10 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit({
      rating,
      comment: comment.trim()
    });
  };

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    if (errors.rating) {
      setErrors(prev => ({ ...prev, rating: undefined }));
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
    if (errors.comment && e.target.value.trim().length >= 10) {
      setErrors(prev => ({ ...prev, comment: undefined }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Avaliação *
          </label>
          <div className="flex items-center space-x-2">
            <RatingStars
              rating={rating}
              isInteractive={true}
              onRate={handleRatingChange}
              showCount={false}
              size="lg"
            />
            <span className="text-sm text-gray-600">
              {rating > 0 ? `${rating} estrela${rating > 1 ? 's' : ''}` : 'Selecione uma nota'}
            </span>
          </div>
          {errors.rating && (
            <p className="mt-1 text-sm text-red-600">{errors.rating}</p>
          )}
        </div>

        {/* Comment Section */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Comentário *
          </label>
          <textarea
            id="comment"
            rows={4}
            value={comment}
            onChange={handleCommentChange}
            placeholder="Compartilhe sua experiência com este serviço..."
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.comment ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          <div className="flex justify-between mt-1">
            {errors.comment && (
              <p className="text-sm text-red-600">{errors.comment}</p>
            )}
            <p className="text-sm text-gray-500 ml-auto">
              {comment.length}/500 caracteres
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={isLoading || rating === 0}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Enviando...
              </div>
            ) : (
              submitButtonText
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;
