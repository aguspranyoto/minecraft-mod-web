import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { NextRequest } from "next/server";

// Helper to verify admin
async function verifyAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return null;
  if ((session.user as { role?: string }).role !== "admin") return null;
  return session;
}

// GET all products (admin)
export async function GET() {
  const session = await verifyAdmin();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allProducts = await db
    .select()
    .from(products)
    .orderBy(desc(products.createdAt));

  return Response.json(allProducts);
}

// POST create product
export async function POST(request: NextRequest) {
  const session = await verifyAdmin();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, slug, description, content, isPremium, files } = body;

  if (!title || !slug) {
    return Response.json(
      { error: "Title and slug are required" },
      { status: 400 }
    );
  }

  const [newProduct] = await db
    .insert(products)
    .values({
      title,
      slug,
      description: description || null,
      content: content || null,
      isPremium: isPremium ?? true,
      files: files || [],
    })
    .returning();

  return Response.json(newProduct, { status: 201 });
}

// PUT update product
export async function PUT(request: NextRequest) {
  const session = await verifyAdmin();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, title, slug, description, content, isPremium, files } = body;

  if (!id) {
    return Response.json({ error: "Product ID required" }, { status: 400 });
  }

  const [updated] = await db
    .update(products)
    .set({
      title,
      slug,
      description: description || null,
      content: content || null,
      isPremium: isPremium ?? true,
      files: files || [],
      updatedAt: new Date(),
    })
    .where(eq(products.id, id))
    .returning();

  return Response.json(updated);
}

// DELETE product
export async function DELETE(request: NextRequest) {
  const session = await verifyAdmin();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Product ID required" }, { status: 400 });
  }

  await db.delete(products).where(eq(products.id, parseInt(id)));

  return Response.json({ success: true });
}
