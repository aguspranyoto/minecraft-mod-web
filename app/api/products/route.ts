import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const allProducts = await db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt));

    return Response.json(allProducts);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return Response.json([], { status: 200 });
  }
}
