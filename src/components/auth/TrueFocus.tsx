"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import "./TrueFocus.css";

type TrueFocusProps = {
  sentence?: string;
  separator?: string;
  manualMode?: boolean;
  blurAmount?: number;
  borderColor?: string;
  glowColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
  loop?: boolean;
  onComplete?: () => void;
};

export function TrueFocus({
  sentence = "True Focus",
  separator = " ",
  manualMode = false,
  blurAmount = 5,
  borderColor = "#35D0BA",
  glowColor = "rgba(53, 208, 186, 0.42)",
  animationDuration = 0.5,
  pauseBetweenAnimations = 1,
  loop = true,
  onComplete,
}: TrueFocusProps) {
  const words = sentence.split(separator).filter(Boolean);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastActiveIndex, setLastActiveIndex] = useState<number | null>(null);
  const [focusRect, setFocusRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const currentIndexRef = useRef(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (manualMode || words.length < 2) return;

    const interval = window.setInterval(() => {
      const nextIndex = currentIndexRef.current + 1;
      if (nextIndex >= words.length) {
        if (!loop) {
          window.clearInterval(interval);
          onCompleteRef.current?.();
          return;
        }
        currentIndexRef.current = 0;
        setCurrentIndex(0);
        return;
      }
      currentIndexRef.current = nextIndex;
      setCurrentIndex(nextIndex);
    }, (animationDuration + pauseBetweenAnimations) * 1000);

    return () => window.clearInterval(interval);
  }, [animationDuration, loop, manualMode, pauseBetweenAnimations, words.length]);

  useEffect(() => {
    const container = containerRef.current;
    const activeWord = wordRefs.current[currentIndex];
    if (!container || !activeWord) return;

    const updateFocusRect = () => {
      const parentRect = container.getBoundingClientRect();
      const activeRect = activeWord.getBoundingClientRect();
      setFocusRect({
        x: activeRect.left - parentRect.left,
        y: activeRect.top - parentRect.top,
        width: activeRect.width,
        height: activeRect.height,
      });
    };

    updateFocusRect();
    const observer = new ResizeObserver(updateFocusRect);
    observer.observe(container);
    observer.observe(activeWord);
    return () => observer.disconnect();
  }, [currentIndex, words.length]);

  function handleMouseEnter(index: number) {
    if (!manualMode) return;
    setLastActiveIndex(index);
    currentIndexRef.current = index;
    setCurrentIndex(index);
  }

  function handleMouseLeave() {
    if (manualMode) {
      const index = lastActiveIndex ?? 0;
      currentIndexRef.current = index;
      setCurrentIndex(index);
    }
  }

  return (
    <div ref={containerRef} className="true-focus-container">
      {words.map((word, index) => {
        const isActive = index === currentIndex;

        return (
          <span
            key={`${word}-${index}`}
            ref={(element) => { wordRefs.current[index] = element; }}
            className="true-focus-word"
            style={{
              filter: isActive ? "blur(0px)" : `blur(${blurAmount}px)`,
              transitionDuration: `${animationDuration}s`,
            }}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            {word}
          </span>
        );
      })}

      <div
        aria-hidden="true"
        className="true-focus-frame"
        style={{
          transform: `translate(${focusRect.x}px, ${focusRect.y}px)`,
          width: focusRect.width,
          height: focusRect.height,
          opacity: 1,
          transition: `transform ${animationDuration}s, width ${animationDuration}s, height ${animationDuration}s`,
          "--focus-border": borderColor,
          "--focus-glow": glowColor,
        } as CSSProperties}
      >
        <span className="true-focus-corner true-focus-top-left" />
        <span className="true-focus-corner true-focus-top-right" />
        <span className="true-focus-corner true-focus-bottom-left" />
        <span className="true-focus-corner true-focus-bottom-right" />
      </div>
    </div>
  );
}
