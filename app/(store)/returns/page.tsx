import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import prisma from "@/lib/prisma";

export const revalidate = 3600; // ISR: 1 hour

export async function generateMetadata(): Promise<Metadata> {
  const page = await prisma.staticPage.findUnique({
    where: { slug: "returns" },
  });

  if (!page) {
    return { title: "About Us" };
  }

  return {
    title: page.title,
    description: page.content.substring(0, 155),
  };
}

export default async function ReturnsPage() {
  const page = await prisma.staticPage.findUnique({
    where: { slug: "returns" },
  });

  if (!page) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          </li>
          <li>
            <span aria-hidden="true">→</span>
          </li>
          <li aria-current="page" className="text-foreground font-medium">
            {page.title}
          </li>
        </ol>
      </nav>
      <div className="prose dark:prose-invert max-w-none">
        <ReactMarkdown>{page.content}</ReactMarkdown>
      </div>
    </div>
  );
}
