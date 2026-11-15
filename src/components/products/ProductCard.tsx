import { Product } from "@/data/products";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rating } from "./Rating";
import { Price } from "./Price";
import Image from "next/image";

interface ProductCardProps {
  product: Product;
  size?: "default" | "large";
}

export function ProductCard({ product, size = "default" }: ProductCardProps) {
  const isLarge = size === "large";

  return (
    <Card className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-200 hover:shadow-lg">
      <div className="relative">
        {/* Product Image Placeholder */}
        <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center overflow-hidden">
          <div className="text-center p-4">
            <div className="w-16 h-16 mx-auto mb-2 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {product.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{product.category}</p>
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {product.isNew && (
            <Badge className="bg-accent text-accent-foreground border-0">
              New
            </Badge>
          )}
          {product.featured && !product.isNew && (
            <Badge className="bg-primary text-primary-foreground border-0">
              Featured
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {product.type}
            </p>
          </div>
          <Price price={product.price} size="sm" />
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {product.technologies.slice(0, 3).map((tech) => (
            <Badge
              key={tech}
              variant="outline"
              className="text-xs font-normal"
            >
              {tech}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
              {product.seller.avatar}
            </div>
            <span className="text-sm text-muted-foreground truncate">
              {product.seller.name}
            </span>
          </div>
          <Rating rating={product.rating} reviewCount={product.reviewCount} />
        </div>
      </CardContent>
    </Card>
  );
}
