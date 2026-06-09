import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductDetailClient from "./product-detail-client";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const product = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  if (!product[0]) {
    return { title: "Product Not Found" };
  }

  const p = product[0];

  // Extract first image from content for OG
  const ogImage = p.content?.match(/<img[^>]+src="([^"]+)"/)?.[1];

  return {
    title: `${p.title} | Minecraft Mods by Agus`,
    description: p.description || `Download ${p.title} - a Minecraft mod by Agus.`,
    openGraph: {
      title: p.title,
      description: p.description || `Download ${p.title} - a Minecraft mod by Agus.`,
      type: "article",
      ...(ogImage && { images: [{ url: ogImage }] }),
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;

  const product = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  if (!product[0]) {
    notFound();
  }

  return <ProductDetailClient product={JSON.parse(JSON.stringify(product[0]))} />;
}
