// components/store/stock-alert-button.tsx
// "Notify me" button for out-of-stock items

"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Bell, BellRing, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StockAlertButtonProps {
  productId: string;
  variantId?: string;
  isOutOfStock: boolean;
  className?: string;
}

export default function StockAlertButton({
  productId,
  variantId,
  isOutOfStock,
  className,
}: StockAlertButtonProps) {
  const { data: session } = useSession();
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  if (!isOutOfStock) return null;

  const handleSubscribe = async (guestEmail?: string) => {
    try {
      setLoading(true);
      const response = await fetch("/api/stock-alerts", {
        method: "POST",
        body: JSON.stringify({
          productId,
          variantId,
          email: guestEmail,
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        setIsSubscribed(true);
        toast.success("We'll notify you when it's back!");
      } else if (response.status === 409) {
        setIsSubscribed(true); // Already on the list
        toast.info("You're already on the notification list for this item.");
      } else {
        throw new Error("Failed to subscribe");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setShowGuestForm(false);
    }
  };

  if (isSubscribed) {
    return (
      <div className={cn("flex items-center gap-2 text-primary font-medium p-3 bg-primary/5 rounded-2xl border border-primary/20", className)}>
        <BellRing className="w-4 h-4" />
        <span className="text-sm">You'll be notified!</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {!showGuestForm ? (
        <Button
          onClick={() => {
            if (session?.user) {
              handleSubscribe();
            } else {
              setShowGuestForm(true);
            }
          }}
          disabled={loading}
          variant="outline"
          className="w-full rounded-2xl gap-2 h-12 border-primary/30 text-primary hover:bg-primary/5 transition-all duration-300"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Bell className="w-4 h-4" />
          )}
          Notify Me When Available
        </Button>
      ) : (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
          <p className="text-xs text-muted-foreground px-1">
            Enter your email to get notified:
          </p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl h-10"
              autoFocus
            />
            <Button
              onClick={() => handleSubscribe(email)}
              disabled={loading || !email.includes("@")}
              size="icon"
              className="rounded-xl shrink-0 h-10 w-10 shadow-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGuestForm(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
