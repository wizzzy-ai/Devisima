import type { CSSProperties, ElementType, ReactElement, ReactNode } from "react";

type StarBorderProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  color?: string;
  trailColor?: string;
  duration?: number;
  direction?: "clockwise" | "counterclockwise";
  stars?: number;
  trailLength?: number;
  thickness?: number;
  radius?: number;
  glow?: number;
  sparkle?: boolean;
  hover?: "lap" | "brighten" | "reveal" | "none";
  clickPulse?: boolean;
  theme?: "dark" | "light";
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  href?: string;
  type?: "button" | "submit" | "reset";
  [key: string]: unknown;
};

export default function StarBorder(props: StarBorderProps): ReactElement;
