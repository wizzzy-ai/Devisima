import { Seller } from "@/data/products";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/products/Rating";
import { CheckCircle } from "lucide-react";

interface SellerCardProps {
  seller: Seller;
}

export function SellerCard({ seller }: SellerCardProps) {
  return (
    <Card className="group hover:border-primary/50 transition-all duration-200 hover:shadow-md cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-lg font-semibold text-primary flex-shrink-0">
            {seller.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">
                {seller.name}
              </h3>
              {seller.verified && (
                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {seller.specialty}
            </p>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                {seller.productsCount} products
              </span>
              <Rating rating={seller.rating} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
