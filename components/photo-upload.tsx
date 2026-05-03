"use client";

import * as React from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface PhotoUploadProps {
  maxPhotos?: number;
  maxSizeMB?: number;
  storageUsedMB?: number;
  storageLimitMB?: number;
  onPhotosChange?: (files: File[]) => void;
}

export function PhotoUpload({
  maxPhotos = 5,
  maxSizeMB = 5,
  storageUsedMB,
  storageLimitMB,
  onPhotosChange,
}: PhotoUploadProps) {
  const [previews, setPreviews] = React.useState<{ file: File; url: string }[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | File[]) => {
    const newFiles = Array.from(files).filter((file) => {
      if (!file.type.startsWith("image/")) return false;
      if (file.size > maxSizeMB * 1024 * 1024) return false;
      return true;
    });

    const remaining = maxPhotos - previews.length;
    const toAdd = newFiles.slice(0, remaining);

    const newPreviews = toAdd.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    const updated = [...previews, ...newPreviews];
    setPreviews(updated);
    onPhotosChange?.(updated.map((p) => p.file));
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(previews[index].url);
    const updated = previews.filter((_, i) => i !== index);
    setPreviews(updated);
    onPhotosChange?.(updated.map((p) => p.file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, []);

  return (
    <div className="space-y-4">
      <div
        className={`relative rounded-lg border-2 border-dashed p-6 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-input hover:border-primary/50"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="region"
        aria-label="Photo upload area"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = "";
          }}
          aria-label="Upload photos"
        />

        <div className="flex flex-col items-center justify-center text-center">
          <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">
            Drop photos here or{" "}
            <button
              type="button"
              className="text-primary underline underline-offset-4"
              onClick={() => inputRef.current?.click()}
            >
              browse
            </button>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            PNG, JPG up to {maxSizeMB}MB. Max {maxPhotos} photos.
          </p>
        </div>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {previews.map((preview, index) => (
            <div key={index} className="group relative aspect-square overflow-hidden rounded-md">
              <Image
                src={preview.url}
                alt={`Preview ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
              />
              <button
                type="button"
                className="absolute right-1 top-1 rounded-full bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => removePhoto(index)}
                aria-label={`Remove photo ${index + 1}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {storageUsedMB !== undefined && storageLimitMB !== undefined && (
        <StorageBar used={storageUsedMB} limit={storageLimitMB} />
      )}
    </div>
  );
}

function StorageBar({ used, limit }: { used: number; limit: number }) {
  const storagePercent = Math.min((used / limit) * 100, 100);
  const storageColor =
    storagePercent > 90
      ? "bg-destructive"
      : storagePercent > 70
        ? "bg-yellow-500"
        : "bg-primary";
  const remainingMB = Math.max(limit - used, 0);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          Storage: {used.toFixed(1)} MB / {limit} MB
        </span>
        <span className="text-muted-foreground">{remainingMB.toFixed(1)} MB left</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-all ${storageColor}`}
          style={{ width: `${storagePercent}%` }}
          role="progressbar"
          aria-valuenow={used}
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-label={`${storagePercent.toFixed(0)}% storage used`}
        />
      </div>
    </div>
  );
}
