// file: components/seo/organization-schema.tsx
// purpose: Renders Organization JSON-LD structured data for SEO

interface OrganizationSchemaProps {
  storeName?: string;
  storeTagline?: string;
  storeLogoUrl?: string | null;
  whatsappNumber?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
}

export function OrganizationSchema({
  storeName = "MiDuka",
  storeTagline,
  storeLogoUrl,
  whatsappNumber,
  facebookUrl,
  instagramUrl,
  twitterUrl,
}: OrganizationSchemaProps) {
  const socialLinks = [facebookUrl, instagramUrl, twitterUrl].filter(Boolean) as string[];

  const jsonLd: any = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: storeName,
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    description: storeTagline || undefined,
  };

  if (storeLogoUrl) {
    jsonLd.logo = storeLogoUrl;
    jsonLd.image = storeLogoUrl;
  }

  if (socialLinks.length > 0) {
    jsonLd.sameAs = socialLinks;
  }

  if (whatsappNumber) {
    jsonLd.contactPoint = [
      {
        "@type": "ContactPoint",
        telephone: whatsappNumber,
        contactType: "customer service",
      },
    ];
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
