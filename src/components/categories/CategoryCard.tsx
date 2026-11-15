import { Category } from "@/data/categories";
import { Card, CardContent } from "@/components/ui/card";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const Icon = Icons[category.icon as keyof typeof Icons] as LucideIcon | undefined;

  return (
    <Card className="group hover:border-primary/50 transition-all duration-200 hover:shadow-md cursor-pointer">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors flex items-center justify-center">
            {Icon && <Icon className="w-6 h-6 text-primary" />}
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">
              {category.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {category.count} products
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
