// components/store/review-summary.tsx
// Displays aggregate rating data and breakdown bars for a product

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewSummaryProps {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: Record<number, number>;
}

export function ReviewSummary({
  averageRating,
  totalReviews,
  ratingBreakdown,
}: ReviewSummaryProps) {
  return (
    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center bg-card rounded-4xl p-6 border border-border/40 shadow-sm">
      {/* Average Score */}
      <div className="flex flex-col items-center justify-center text-center px-4">
        <div className="text-5xl font-bold text-foreground mb-2">
          {averageRating.toFixed(1)}
        </div>
        <div className="flex mb-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "h-5 w-5",
                i < Math.round(averageRating)
                  ? "fill-amber-400 text-amber-400"
                  : "fill-muted text-muted-foreground/30"
              )}
            />
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          Based on {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
        </div>
      </div>

      {/* Breakdown Bars */}
      <div className="flex-1 w-full space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = ratingBreakdown[rating] || 0;
          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

          return (
            <div key={rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-8">
                <span className="text-sm font-medium">{rating}</span>
                <Star className="h-3 w-3 fill-foreground text-foreground" />
              </div>
              <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="w-8 text-right">
                <span className="text-xs text-muted-foreground">{count}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
