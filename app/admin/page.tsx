"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TiptapEditor } from "@/components/tiptap-editor";
import { MediaManager } from "@/components/media-manager";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Save,
  X,
  FolderOpen,
  Crown,
  FileIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  isPremium: boolean;
  files: string[];
  createdAt: string;
}

interface MediaFile {
  id: number;
  filename: string;
  url: string;
  bucket: string;
  contentType: string | null;
  createdAt: string;
}

const emptyProduct = {
  title: "",
  slug: "",
  description: "",
  content: "",
  isPremium: true,
  files: [] as string[],
};

export default function AdminPage() {
  const { data: session, isPending } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<typeof emptyProduct | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [mediaManagerOpen, setMediaManagerOpen] = useState(false);

  const isAdmin =
    session && (session.user as { role?: string }).role === "admin";

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
    }
  }, [isAdmin]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch {
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingId(null);
    setEditingProduct({ ...emptyProduct });
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setEditingProduct({
      title: product.title,
      slug: product.slug,
      description: product.description || "",
      content: product.content || "",
      isPremium: product.isPremium,
      files: product.files || [],
    });
  };

  const handleSave = async () => {
    if (!editingProduct) return;
    if (!editingProduct.title || !editingProduct.slug) {
      toast.error("Title and slug are required");
      return;
    }

    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const body = editingId
        ? { id: editingId, ...editingProduct }
        : editingProduct;

      const res = await fetch("/api/admin/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editingId ? "Product updated!" : "Product created!");
        setEditingProduct(null);
        setEditingId(null);
        fetchProducts();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save product");
      }
    } catch {
      toast.error("Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Product deleted");
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  // Auth guard
  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
      </div>
    );
  }

  if (!session || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="text-6xl">🔒</div>
        <h1 className="text-xl font-bold text-white">Access Denied</h1>
        <p className="text-sm text-neutral-500">
          You need admin privileges to access this page.
        </p>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  // ─── Product Editor View ─────────────────────────────────────
  if (editingProduct) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        {/* Top bar */}
        <div className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              onClick={() => {
                setEditingProduct(null);
                setEditingId(null);
              }}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {editingId ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">
              Title
            </label>
            <Input
              value={editingProduct.title}
              onChange={(e) => {
                setEditingProduct((prev) => ({
                  ...prev!,
                  title: e.target.value,
                  slug: editingId ? prev!.slug : generateSlug(e.target.value),
                }));
              }}
              placeholder="My Awesome Mod"
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">
              Slug
            </label>
            <Input
              value={editingProduct.slug}
              onChange={(e) =>
                setEditingProduct((prev) => ({
                  ...prev!,
                  slug: e.target.value,
                }))
              }
              placeholder="my-awesome-mod"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">
              Description (short)
            </label>
            <Input
              value={editingProduct.description}
              onChange={(e) =>
                setEditingProduct((prev) => ({
                  ...prev!,
                  description: e.target.value,
                }))
              }
              placeholder="A brief description of your mod..."
            />
          </div>

          {/* Premium toggle */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-neutral-300">
              Premium Mod
            </label>
            <button
              type="button"
              onClick={() =>
                setEditingProduct((prev) => ({
                  ...prev!,
                  isPremium: !prev!.isPremium,
                }))
              }
              className={`relative h-6 w-11 rounded-full transition-colors cursor-pointer ${
                editingProduct.isPremium ? "bg-orange-500" : "bg-neutral-700"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  editingProduct.isPremium ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <Badge variant={editingProduct.isPremium ? "premium" : "free"}>
              {editingProduct.isPremium ? "Premium" : "Free"}
            </Badge>
          </div>

          {/* Files */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-300">
                Files (.jar, images, etc.)
              </label>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setMediaManagerOpen(true)}
              >
                <FolderOpen className="h-4 w-4" />
                Media Manager
              </Button>
            </div>

            {editingProduct.files.length > 0 && (
              <div className="space-y-1">
                {editingProduct.files.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-800/30 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileIcon className="h-4 w-4 text-neutral-500 shrink-0" />
                      <span className="text-sm text-neutral-300 truncate">
                        {file.split("/").pop()}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingProduct((prev) => ({
                          ...prev!,
                          files: prev!.files.filter((_, idx) => idx !== i),
                        }))
                      }
                      className="text-red-500 hover:text-red-400 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Content (TipTap) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">
              Content
            </label>
            <TiptapEditor
              content={editingProduct.content}
              onChange={(content) =>
                setEditingProduct((prev) => ({
                  ...prev!,
                  content,
                }))
              }
            />
          </div>
        </div>

        {/* Media Manager for file selection */}
        <MediaManager
          open={mediaManagerOpen}
          onOpenChange={setMediaManagerOpen}
          multiple
          onSelectMultiple={(selected) => {
            setEditingProduct((prev) => ({
              ...prev!,
              files: [
                ...prev!.files,
                ...selected.map((m) => m.url),
              ],
            }));
          }}
        />
      </div>
    );
  }

  // ─── Product List View ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Site
          </Link>
          <h1 className="text-lg font-semibold text-white">Admin Dashboard</h1>
          <Button onClick={handleCreate} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Product
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg bg-neutral-800/50"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-6xl">📦</div>
            <h3 className="mt-4 text-lg font-semibold text-neutral-300">
              No products yet
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Create your first Minecraft mod product.
            </p>
            <Button onClick={handleCreate} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Create Product
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3 transition-colors hover:bg-neutral-900"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white truncate">
                        {product.title}
                      </h3>
                      <Badge
                        variant={product.isPremium ? "premium" : "free"}
                        className="shrink-0"
                      >
                        {product.isPremium ? (
                          <>
                            <Crown className="mr-1 h-3 w-3" />
                            Premium
                          </>
                        ) : (
                          "Free"
                        )}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      /{product.slug} •{" "}
                      {product.files?.length || 0} files •{" "}
                      {new Date(product.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(product)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(product.id)}
                    className="text-red-500 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
