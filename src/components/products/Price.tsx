interface PriceProps {
  price: number;
  size?: "sm" | "md" | "lg";
}

export function Price({ price, size = "md" }: PriceProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl",
  };

  return (
    <div className={`${sizeClasses[size]} font-semibold text-foreground`}>
      ${price}
    </div>
  );
}
