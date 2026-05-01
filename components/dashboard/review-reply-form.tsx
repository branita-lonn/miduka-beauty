// components/dashboard/review-reply-form.tsx
// Inline form for seller to reply to reviews

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ReviewReplyFormProps {
  reviewId: string;
  initialBody?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ReviewReplyForm({
  reviewId,
  initialBody = "",
  onSuccess,
  onCancel,
}: ReviewReplyFormProps) {
  const [body, setBody] = useState(initialBody);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      toast.error("Reply body cannot be empty");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });

      if (!res.ok) throw new Error("Failed to post reply");

      toast.success(initialBody ? "Reply updated." : "Reply posted.");
      onSuccess();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-muted/30 p-4 rounded-2xl border border-border/50">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold">Store Reply</label>
          <span className={cn(
            "text-[10px]",
            body.length > 1000 ? "text-destructive" : "text-muted-foreground"
          )}>
            {body.length}/1000
          </span>
        </div>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your response to the customer..."
          className="min-h-[100px] rounded-xl resize-none"
          maxLength={1000}
        />
      </div>
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-xl"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !body.trim() || body.length > 1000}
          className="rounded-xl"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialBody ? "Update Reply" : "Post Reply"}
        </Button>
      </div>
    </form>
  );
}

// Helper for conditional classes if not imported
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
