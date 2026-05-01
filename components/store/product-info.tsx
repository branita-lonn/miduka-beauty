// components/store/product-info.tsx
// Client Component — variant selector, quantity control, and Add to Cart action for the product detail page

"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Heart, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/components/store/cart-provider";
import { formatCurrency } from "@/lib/utils";
import type { ProductWithRelationsSerialized } from "@/types";
import { cn } from "@/lib/utils";
import StockAlertButton from "@/components/store/stock-alert-button";
import { useWishlist } from "@/components/store/wishlist-provider";

interface ProductInfoProps {
  product: ProductWithRelationsSerialized;
  externalSelectedColour?: string | null;
  onColourChange?: (colour: string | null) => void;
}

export default function ProductInfo({ 
  product, 
  externalSelectedColour, 
  onColourChange 
}: ProductInfoProps) {
  const { addItem } = useCart();

  const [selectedColour, setSelectedColour] = useState<string | null>(externalSelectedColour ?? null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);

  // Sync internal state with external state
  useEffect(() => {
    if (externalSelectedColour !== undefined) {
      setSelectedColour(externalSelectedColour);
    }
  }, [externalSelectedColour]);

  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const { isWishlisted, toggleWishlist, isLoading: wishlistLoading } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  // Derive selected variant from attributes
  const selectedVariant = product.variants.find(
    (v) =>
      (selectedColour ? v.colour === selectedColour : !v.colour) &&
      (selectedSize ? v.size === selectedSize : !v.size) &&
      (selectedMaterial ? v.material === selectedMaterial : !v.material) &&
      v.isActive
  );

  const selectedVariantId = selectedVariant?.id;

  // Effective price (variant override or base price)
  const effectivePrice = selectedVariant?.priceOverride ?? product.price;

  // Stock
  const totalVariantStock = product.variants.reduce((acc, v) => acc + (v.stockQuantity ?? 0), 0);
  const stockQty =
    product.variants.length > 0
      ? (selectedVariant 
          ? selectedVariant.stockQuantity 
          : totalVariantStock)
      : product.stockQuantity;

  const isOutOfStock = stockQty === 0;
  const isLowStock = !isOutOfStock && stockQty <= 5;

  // Group variant options
  const colours = [...new Set(product.variants.map((v) => v.colour).filter(Boolean))] as string[];
  const sizes = [...new Set(product.variants.map((v) => v.size).filter(Boolean))] as string[];
  const materials = [...new Set(product.variants.map((v) => v.material).filter(Boolean))] as string[];

  function handleOptionSelect(type: 'colour' | 'size' | 'material', value: string) {
    if (type === 'colour') {
      setSelectedColour(value);
      onColourChange?.(value);
    }
    if (type === 'size') setSelectedSize(value);
    if (type === 'material') setSelectedMaterial(value);
    setQuantity(1);
  }

  async function handleAddToCart() {
    if (isOutOfStock) return;
    setIsAdding(true);
    try {
      await addItem({
        productId: product.id,
        variantId: selectedVariantId,
        quantity,
        productName: product.name,
      });
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Name */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {product.isOnSale && (
            <Badge variant="destructive" className="rounded-full text-xs">
              Sale
            </Badge>
          )}
          {product.isFeatured && (
            <Badge variant="secondary" className="rounded-full text-xs">
              Featured
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold leading-tight">{product.name}</h1>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-bold text-primary">
          {formatCurrency(effectivePrice)}
        </span>
        {product.compareAtPrice && product.compareAtPrice > effectivePrice && (
          <span className="text-lg text-muted-foreground line-through">
            {formatCurrency(product.compareAtPrice)}
          </span>
        )}
        {product.compareAtPrice && product.compareAtPrice > effectivePrice && (
          <Badge variant="destructive" className="rounded-full text-xs">
            {Math.round(
              ((product.compareAtPrice - effectivePrice) /
                product.compareAtPrice) *
                100
            )}
            % OFF
          </Badge>
        )}
      </div>

      {/* Stock indicator */}
      {isOutOfStock ? (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>Out of stock</span>
        </div>
      ) : isLowStock ? (
        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-4 w-4" />
          <span>Only {stockQty} left in stock</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>In stock</span>
        </div>
      )}

      {/* Stock Alert for out of stock */}
      {isOutOfStock && (
        <StockAlertButton 
          productId={product.id} 
          variantId={selectedVariantId}
          isOutOfStock={isOutOfStock}
        />
      )}

      {/* Colour selector */}
      {colours.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Colour:{" "}
            <span className="font-normal text-muted-foreground">
              {selectedColour ?? "Select"}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {colours.map((colour) => (
              <button
                key={colour}
                onClick={() => handleOptionSelect('colour', colour)}
                className={cn(
                  "rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-all",
                  selectedColour === colour
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                {colour}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size selector */}
      {sizes.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Size:{" "}
            <span className="font-normal text-muted-foreground">
              {selectedSize ?? "Select"}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => handleOptionSelect('size', size)}
                className={cn(
                  "rounded-xl border-2 px-4 py-1.5 text-sm font-medium transition-all",
                  selectedSize === size
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Material selector */}
      {materials.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Material:{" "}
            <span className="font-normal text-muted-foreground">
              {selectedMaterial ?? "Select"}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {materials.map((material) => (
              <button
                key={material}
                onClick={() => handleOptionSelect('material', material)}
                className={cn(
                  "rounded-xl border-2 px-4 py-1.5 text-sm font-medium transition-all",
                  selectedMaterial === material
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                {material}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Quantity</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-2xl border border-border overflow-hidden">
            <button
              aria-label="Decrease quantity"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="px-4 py-2.5 text-lg font-medium hover:bg-muted transition-colors disabled:opacity-40"
            >
              −
            </button>
            <span className="w-12 text-center text-sm font-semibold">
              {quantity}
            </span>
            <button
              aria-label="Increase quantity"
              onClick={() => setQuantity((q) => Math.min(stockQty, q + 1))}
              disabled={quantity >= stockQty}
              className="px-4 py-2.5 text-lg font-medium hover:bg-muted transition-colors disabled:opacity-40"
            >
              +
            </button>
          </div>
          {stockQty > 0 && (
            <span className="text-sm text-muted-foreground">
              {stockQty} available
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          id="add-to-cart-button"
          size="lg"
          className="flex-1 rounded-2xl gap-2"
          disabled={isOutOfStock || isAdding || (product.variants.length > 0 && !selectedVariantId)}
          onClick={() => void handleAddToCart()}
        >
          <ShoppingCart className="h-5 w-5" />
          {isAdding 
            ? "Adding…" 
            : isOutOfStock 
              ? "Out of Stock" 
              : (product.variants.length > 0 && !selectedVariantId)
                ? "Select Options"
                : "Add to Cart"}
        </Button>
        <Button
          id="wishlist-button"
          variant="outline"
          size="lg"
          className={cn(
            "rounded-2xl gap-2 sm:w-auto transition-all duration-300",
            wishlisted && "bg-primary/5 border-primary/30 text-primary"
          )}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          disabled={wishlistLoading}
          onClick={() => toggleWishlist(product.id)}
        >
          <Heart className={cn("h-5 w-5", wishlisted && "fill-current")} />
          <span className="hidden sm:inline">{wishlisted ? "Wishlisted" : "Wishlist"}</span>
        </Button>
      </div>
    </div>
  );
}
