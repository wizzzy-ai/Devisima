'use client';

import React, { useState } from 'react';
import { Heart } from 'lucide-react';

interface ProductCardPulseHeartProps {
  count?: number;
  productId?: string;
  isLiked?: boolean;
  onToggle?: (liked: boolean) => void;
}

export function ProductCardPulseHeart({
  count = 0,
  productId,
  isLiked = false,
  onToggle,
}: ProductCardPulseHeartProps) {
  const [liked, setLiked] = useState(isLiked);
  const [total, setTotal] = useState(count);
  const [animating, setAnimating] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const nextLiked = !liked;
    setLiked(nextLiked);
    setTotal((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);

    onToggle?.(nextLiked);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={liked ? 'Unlike product' : 'Like product'}
      className="group/like inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#0F4C5C] shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-black/[0.06] transition-all hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C]"
    >
      <Heart
        className={`h-3.5 w-3.5 transition-all duration-300 ${
          liked
            ? 'fill-[#0F4C5C] text-[#0F4C5C] scale-110'
            : 'text-[#0F4C5C] group-hover/like:scale-110'
        } ${animating ? 'scale-125' : ''}`}
      />
      <span className="tabular-nums font-semibold leading-none text-[#0F4C5C]">
        {total}
      </span>
    </button>
  );
}
