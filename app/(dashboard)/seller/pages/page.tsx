import prisma from "@/lib/prisma";
import EditorClient from "./client";

export default async function PagesEditor() {
  const pages = await prisma.staticPage.findMany();
  
  const initialPages = {
    about: pages.find((p) => p.slug === "about") || { slug: "about", title: "About Us", content: "" },
    contact: pages.find((p) => p.slug === "contact") || { slug: "contact", title: "Contact Us", content: "" },
    privacy: pages.find((p) => p.slug === "privacy") || { slug: "privacy", title: "Privacy Policy", content: "" },
    returns: pages.find((p) => p.slug === "returns") || { slug: "returns", title: "Returns Policy", content: "" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Store Pages</h1>
        <p className="text-muted-foreground">Edit your informational pages.</p>
      </div>
      <EditorClient initialPages={initialPages} />
    </div>
  );
}
