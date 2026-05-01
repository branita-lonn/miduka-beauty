// components/store/reviews-section.tsx
// Main reviews section for product pages with summary, sorting, and pagination

"use client";

import { useState, useEffect, useCallback } from "react";
import { ReviewSummary } from "./review-summary";
import { ReviewCard } from "./review-card";
import { ReviewForm } from "./review-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Loader2, PenLine, Star } from "lucide-react";
import type { ReviewWithRelations, ReviewSummaryData } from "@/types";

interface ReviewsSectionProps {
  productId: string;
  productSlug: string;
  isEligible: boolean;
  initialData: {
    averageRating: number;
    totalReviews: number;
    ratingBreakdown: Record<number, number>;
  };
}

export function ReviewsSection({
  productId,
  productSlug,
  isEligible,
  initialData,
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<ReviewWithRelations[]>([]);
  const [total, setTotal] = useState(initialData.totalReviews);
  const [averageRating, setAverageRating] = useState(initialData.averageRating);
  const [ratingBreakdown, setRatingBreakdown] = useState(initialData.ratingBreakdown);
  
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const limit = 10;
  const totalPages = Math.ceil(total / limit);

  const fetchReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/products/${productSlug}/reviews?sort=${sort}&page=${page}&limit=${limit}`
      );
      if (!res.ok) throw new Error();
      const data: ReviewSummaryData = await res.json();
      
      setReviews(data.reviews);
      setTotal(data.total);
      setAverageRating(data.averageRating);
      setRatingBreakdown(data.ratingBreakdown);
    } catch (error) {
      console.error("Failed to fetch reviews", error);
    } finally {
      setIsLoading(false);
    }
  }, [productSlug, sort, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleReviewSuccess = () => {
    setIsDialogOpen(false);
    setPage(1);
    fetchReviews();
  };

  return (
    <div id="reviews" className="space-y-10 pt-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customer Reviews</h2>
          <p className="text-muted-foreground text-sm">
            What other shoppers are saying about this product
          </p>
        </div>

        {isEligible && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl gap-2 shadow-lg shadow-primary/20">
                <PenLine className="h-4 w-4" />
                Write a Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl rounded-4xl sm:rounded-4xl">
              <DialogHeader>
                <DialogTitle>Write a Review</DialogTitle>
              </DialogHeader>
              <ReviewForm
                productId={productId}
                onSuccess={handleReviewSuccess}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <ReviewSummary
        averageRating={averageRating}
        totalReviews={total}
        ratingBreakdown={ratingBreakdown}
      />

      <div className="flex items-center justify-between border-b pb-4">
        <h3 className="font-semibold">{total} Reviews</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sort by:</span>
          <Select value={sort} onValueChange={(val) => { setSort(val); setPage(1); }}>
            <SelectTrigger className="w-[160px] h-9 rounded-xl border-none bg-muted/50 focus:ring-0">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="newest">Most Recent</SelectItem>
              <SelectItem value="helpful">Most Helpful</SelectItem>
              <SelectItem value="highest">Highest Rated</SelectItem>
              <SelectItem value="lowest">Lowest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
          <p className="text-muted-foreground text-sm animate-pulse">Loading reviews...</p>
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-6">
          <div className="grid gap-6">
            {reviews.map((review) => (
              <ReviewCard 
                key={review.id} 
                review={review} 
                onVoteSuccess={(newCount) => {
                  // Local update for better UX
                  setReviews(prev => prev.map(r => 
                    r.id === review.id 
                      ? { ...r, _count: { ...r._count, votes: newCount } } 
                      : r
                  ));
                }}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button 
                      variant="ghost" 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-xl gap-1"
                    >
                      Previous
                    </Button>
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <PaginationItem key={i}>
                      <Button
                        variant={page === i + 1 ? "default" : "ghost"}
                        onClick={() => setPage(i + 1)}
                        className="h-9 w-9 rounded-xl p-0"
                      >
                        {i + 1}
                      </Button>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <Button 
                      variant="ghost" 
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="rounded-xl gap-1"
                    >
                      Next
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/30 rounded-4xl border border-dashed border-border">
          <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Star className="h-6 w-6 text-muted-foreground/40" />
          </div>
          <p className="text-lg font-semibold">No reviews yet</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
            Be the first to review this product and help others make a choice!
          </p>
        </div>
      )}
    </div>
  );
}
