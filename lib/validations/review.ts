// lib/validations/review.ts
// Zod schemas for review validation

import { z } from "zod";

export const reviewSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  title: z.string().max(100, "Title must be at most 100 characters").optional().nullable(),
  body: z.string().min(20, "Review must be at least 20 characters").max(2000, "Review must be at most 2000 characters"),
  photos: z.array(z.string().url()).max(5, "Maximum 5 photos allowed").optional(),
});

export type ReviewFormValues = z.infer<typeof reviewSchema>;
