// app/(store)/account/wishlist/page.tsx
// Customer wishlist page

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/store/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWishlist } from "@/components/store/wishlist-provider";
import { useCart } from "@/components/store/cart-provider";

export default function WishlistPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { wishlistIds, toggleWishlist } = useWishlist();
  const { addItem } = useCart();

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/wishlist");
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (error) {
        console.error("Failed to fetch wishlist products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistProducts();
  }, []);

  // Synchronize local state with provider if an item is removed from elsewhere
  useEffect(() => {
    setProducts(prev => prev.filter(p => wishlistIds.includes(p.id)));
  }, [wishlistIds]);

  const handleRemove = async (productId: string) => {
    await toggleWishlist(productId);
    // State is updated by the useEffect above
  };

  const handleAddToCart = (product: any) => {
    addItem({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.images[0]?.url,
      quantity: 1,
    });
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-8 w-40 rounded-lg" />
          <Skeleton className="h-4 w-64 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-4xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">My Wishlist</h1>
        <p className="text-muted-foreground">
          Products you've saved for later.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Heart className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">Your wishlist is empty</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">
              Start browsing to save items you love.
            </p>
          </div>
          <Button render={<Link href="/products" />} className="rounded-2xl shadow-md">
            Browse Products
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="flex flex-col gap-3 group">
              <ProductCard
                id={product.id}
                slug={product.slug}
                name={product.name}
                price={Number(product.price)}
                compareAtPrice={product.compareAtPrice ? Number(product.compareAtPrice) : null}
                primaryImage={product.images[0]?.url}
                isOnSale={product.isOnSale}
                stockQuantity={product.stockQuantity}
                createdAt={product.createdAt}
              />
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleAddToCart(product)}
                  className="flex-1 rounded-2xl gap-2 text-xs h-10 shadow-sm"
                  disabled={product.stockQuantity === 0}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Add to Cart
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleRemove(product.id)}
                  className="rounded-2xl shrink-0 h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
