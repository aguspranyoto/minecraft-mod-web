import { db } from "@/lib/db";
import { products, subscriptions } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductDetailClient from "./product-detail-client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
    title: `${p.title} | Premium Minecraft Mods by Aguud`,
    description:
      p.description ||
      `Download ${p.title} - a Premium Minecraft mod by Aguud.`,
    openGraph: {
      title: p.title,
      description:
        p.description ||
        `Download ${p.title} - a Premium Minecraft mod by Aguud.`,
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

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  let hasActiveSubscription = false;

  if (session?.user?.id) {
    const activeSub = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, session.user.id),
          eq(subscriptions.status, "active"),
          gt(subscriptions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (activeSub.length > 0) {
      hasActiveSubscription = true;
    }
  }

  return (
    <ProductDetailClient 
      product={JSON.parse(JSON.stringify(product[0]))} 
      hasActiveSubscription={hasActiveSubscription}
    />
  );
}
