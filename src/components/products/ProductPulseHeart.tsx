'use client';

import PulseHeart from '@/components/PulseHeart';

export function ProductPulseHeart() {
  return (
    <PulseHeart
      count={1204}
      defaultLiked={false}
      onChange={(liked, count) => console.log(liked, count)}
      showCount
      icon="heart"
      idleOutline
      size={30}
      corner={32}
      likedColor="#277f70"
      idleColor="#52645b"
      pillColor="#122f2b"
      textColor="#f7f8ee"
      duration={560}
      dotSize={0.3}
      overshoot={1.7}
      beat={3}
      rollDuration={350}
      disabled={false}
    />
  );
}
