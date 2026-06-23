"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Image as ImageIcon,
  FileIcon,
  Trash2,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface MediaFile {
  id: number;
  filename: string;
  url: string;
  bucket: string;
  contentType: string | null;
  createdAt: string;
}

interface MediaManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (media: MediaFile) => void;
  multiple?: boolean;
  onSelectMultiple?: (mediaList: MediaFile[]) => void;
  accept?: string;
}

export function MediaManager({
  open,
  onOpenChange,
  onSelect,
  multiple = false,
  onSelectMultiple,
  accept,
}: MediaManagerProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
  const [uploadBucket, setUploadBucket] = useState<"public" | "private">(
    "public"
  );

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/media");
      if (res.ok) {
        const data = await res.json();
        setMediaFiles(data);
      }
    } catch {
      toast.error("Failed to load media files");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchMedia();
      setSelectedFiles(new Set());
    }
  }, [open, fetchMedia]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      try {
        // Upload directly through server (avoids CORS issues on private buckets)
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", uploadBucket);

        const uploadRes = await fetch("/api/admin/media/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Upload failed");
        const { media: newMedia } = await uploadRes.json();

        // Add to local state
        setMediaFiles((prev) => [newMedia, ...prev]);
        toast.success(`Uploaded: ${file.name}`);
      } catch {
        toast.error(`Failed to upload: ${file.name}`);
      }
    }

    setUploading(false);
    e.target.value = "";
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/media?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMediaFiles((prev) => prev.filter((m) => m.id !== id));
        setSelectedFiles((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        toast.success("File deleted");
      }
    } catch {
      toast.error("Failed to delete file");
    }
  };

  const toggleSelect = (media: MediaFile) => {
    if (multiple) {
      setSelectedFiles((prev) => {
        const next = new Set(prev);
        if (next.has(media.id)) {
          next.delete(media.id);
        } else {
          next.add(media.id);
        }
        return next;
      });
    } else {
      onSelect?.(media);
      onOpenChange(false);
    }
  };

  const handleConfirmMultiple = () => {
    const selected = mediaFiles.filter((m) => selectedFiles.has(m.id));
    onSelectMultiple?.(selected);
    onOpenChange(false);
  };

  const isImage = (contentType: string | null) => {
    return contentType?.startsWith("image/");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Media Manager</DialogTitle>
        </DialogHeader>

        {/* Upload controls */}
        <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2">
            <Button
              variant={uploadBucket === "public" ? "default" : "outline"}
              size="sm"
              onClick={() => setUploadBucket("public")}
            >
              Public (Images)
            </Button>
            <Button
              variant={uploadBucket === "private" ? "default" : "outline"}
              size="sm"
              onClick={() => setUploadBucket("private")}
            >
              Private (.jar)
            </Button>
          </div>

          <label className="ml-auto">
            <Input
              type="file"
              className="hidden"
              multiple
              accept={accept}
              onChange={handleUpload}
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-2 cursor-pointer"
              disabled={uploading}
              asChild
            >
              <span>
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload
              </span>
            </Button>
          </label>
        </div>

        {/* Media grid */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="grid grid-cols-4 gap-3 p-2 sm:grid-cols-5 md:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square animate-pulse rounded-lg bg-neutral-800"
                />
              ))}
            </div>
          ) : mediaFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
              <ImageIcon className="h-12 w-12 mb-3" />
              <p className="text-sm">No media files yet</p>
              <p className="text-xs mt-1">Upload files to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 p-2 sm:grid-cols-4 md:grid-cols-5">
              {mediaFiles.map((file) => (
                <div
                  key={file.id}
                  className={`group relative aspect-square cursor-pointer overflow-hidden rounded-lg border transition-all ${
                    selectedFiles.has(file.id)
                      ? "border-orange-500 ring-2 ring-orange-500/30"
                      : "border-neutral-800 hover:border-neutral-700"
                  }`}
                  onClick={() => toggleSelect(file)}
                >
                  {isImage(file.contentType) ? (
                    <img
                      src={`/api/media/${file.id}`}
                      alt={file.filename}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-neutral-800/50">
                      <FileIcon className="h-8 w-8 text-neutral-500" />
                      <span className="px-2 text-[10px] text-neutral-500 text-center truncate max-w-full">
                        {file.filename}
                      </span>
                    </div>
                  )}

                  {/* Selected indicator */}
                  {selectedFiles.has(file.id) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-orange-500/20">
                      <div className="rounded-full bg-orange-500 p-1">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Bucket badge */}
                  <Badge
                    variant={file.bucket === "public" ? "free" : "premium"}
                    className="absolute left-1 top-1 text-[9px] px-1.5 py-0"
                  >
                    {file.bucket}
                  </Badge>

                  {/* Delete button */}
                  <button
                    className="absolute right-1 top-1 rounded-md bg-red-600/80 p-1 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(file.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {multiple && selectedFiles.size > 0 && (
          <div className="flex items-center justify-between border-t border-neutral-800 pt-4">
            <span className="text-sm text-neutral-400">
              {selectedFiles.size} file{selectedFiles.size > 1 ? "s" : ""}{" "}
              selected
            </span>
            <Button onClick={handleConfirmMultiple} className="gap-2">
              <Check className="h-4 w-4" />
              Confirm Selection
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
