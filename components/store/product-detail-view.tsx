// components/store/product-detail-view.tsx
// Client component that coordinates the ImageGallery and ProductInfo to handle colour-image switching

"use client";

import { useState } from "react";
import ImageGallery from "@/components/store/image-gallery";
import ProductInfo from "@/components/store/product-info";
import { ProductWithRelationsSerialized } from "@/types";

interface ProductDetailViewProps {
  product: ProductWithRelationsSerialized;
}

export default function ProductDetailView({ product }: ProductDetailViewProps) {
  // Lift colour state up to coordinate between gallery and info
  const [selectedColour, setSelectedColour] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
      {/* Left: Image Gallery */}
      <div>
        <ImageGallery 
          images={product.images} 
          productName={product.name} 
          selectedColour={selectedColour}
        />
      </div>

      {/* Right: Info */}
      <div className="flex flex-col gap-6">
        <ProductInfo 
          product={product} 
          externalSelectedColour={selectedColour}
          onColourChange={setSelectedColour}
        />
      </div>
    </div>
  );
}
