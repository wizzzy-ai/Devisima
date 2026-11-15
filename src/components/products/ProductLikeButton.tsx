'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';

export function ProductLikeButton({ productId }: { productId: string }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setLiked(!liked);
    setCount(prev => liked ? prev - 1 : prev + 1);
    // TODO: Add API call to persist like status and fetch real count
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
        liked
          ? 'border-red-500 bg-red-50 text-red-600'
          : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50'
      }`}
    >
      <Heart className={`h-4 w-4 ${liked ? 'fill-red-500' : ''}`} />
      {count > 0 ? count : 'Like'}
    </button>
  );
}
