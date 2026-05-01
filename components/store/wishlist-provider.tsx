// components/store/wishlist-provider.tsx
// Client context provider for managing customer wishlist state

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface WishlistContextType {
  wishlistIds: string[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<void>;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export default function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch wishlist IDs on mount/session change
  useEffect(() => {
    const fetchWishlist = async () => {
      if (status !== "authenticated") {
        setWishlistIds([]);
        return;
      }

      try {
        const response = await fetch("/api/wishlist");
        if (response.ok) {
          const data = await response.json();
          setWishlistIds(data.map((p: any) => p.id));
        }
      } catch (error) {
        console.error("Failed to fetch wishlist:", error);
      }
    };

    fetchWishlist();
  }, [status]);

  const isWishlisted = (productId: string) => wishlistIds.includes(productId);

  const toggleWishlist = async (productId: string) => {
    if (status !== "authenticated") {
      toast.error("Please login to add items to your wishlist", {
        action: {
          label: "Login",
          onClick: () => window.location.href = `/auth/login?redirect=${window.location.pathname}`,
        },
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/wishlist", {
        method: "POST",
        body: JSON.stringify({ productId }),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const { isWishlisted: nextState } = await response.json();
        
        if (nextState) {
          setWishlistIds(prev => [...prev, productId]);
          toast.success("Added to wishlist");
        } else {
          setWishlistIds(prev => prev.filter(id => id !== productId));
          toast.success("Removed from wishlist");
        }
      } else {
        throw new Error("Failed to toggle wishlist");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlistIds, isWishlisted, toggleWishlist, isLoading }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
