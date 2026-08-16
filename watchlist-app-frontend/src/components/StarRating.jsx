import React, { useState } from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ rating = 0, onRate, readOnly = false, size = 20 }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = hoverRating || rating;

  const handleClick = (selectedRating) => {
    if (readOnly || !onRate) return;
    onRate(selectedRating);
  };

  const handleMouseEnter = (starIndex) => {
    if (readOnly) return;
    setHoverRating(starIndex);
  };

  const handleMouseLeave = () => {
    if (readOnly) return;
    setHoverRating(0);
  };

  return (
    <div
      className={`star-rating ${readOnly ? 'read-only' : 'interactive'}`}
      onMouseLeave={handleMouseLeave}
      aria-label={`Rating: ${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const isFilled = starIndex <= displayRating;
        return (
          <button
            key={starIndex}
            type="button"
            className={`star-button ${isFilled ? 'filled' : 'empty'} ${
              hoverRating >= starIndex ? 'hovered' : ''
            }`}
            onClick={() => handleClick(starIndex)}
            onMouseEnter={() => handleMouseEnter(starIndex)}
            disabled={readOnly}
            aria-label={`Rate ${starIndex} star${starIndex > 1 ? 's' : ''}`}
          >
            <Star
              size={size}
              fill={isFilled ? 'currentColor' : 'none'}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
