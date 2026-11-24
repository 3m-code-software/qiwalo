"use client";

import { useState } from "react";
import UploadProgress from "@/components/UploadProgress";
import { uploadImage, UploadError } from "@/lib/client-upload";
import { fileSizeAr } from "@/lib/format";

interface DocumentUploadProps {
  name: string;
  label: string;
  defaultUrl?: string | null;
  hint?: string;
  onUrlChange?: (url: string) => void;
}

/** Reusable client uploader: posts to /api/upload and exposes the signed URL as a hidden form field. */
export default function DocumentUpload({
  name,
  label,
  defaultUrl = "",
  hint,
  onUrlChange,
}: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [lastUpload, setLastUpload] = useState<{ originalSize: number; compressedSize: number } | null>(null);

  async function handleUpload() {
    if (!file || uploading) return;
    setUploading(true);
    setError("");
    setProgress(0);
    try {
      const result = await uploadImage(file, setProgress);
      setUrl(result.url);
      onUrlChange?.(result.url);
      setLastUpload({ originalSize: result.originalSize, compressedSize: result.compressedSize });
      setFile(null);
    } catch (uploadError) {
      setError(uploadError instanceof UploadError ? uploadError.message : "الرفع فشل. تأكد من الاتصال وحاول مرة تانية.");
    } finally {
      setUploading(false);
    }
  }

  function clear() {
    setUrl("");
    setFile(null);
    setError("");
    setProgress(0);
    setLastUpload(null);
    onUrlChange?.("");
  }

  return (
    <div>
      <label className="label" htmlFor={`${name}-file`}>{label}</label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          id={`${name}-file`}
          type="file"
          accept="image/*"
          className="input max-w-xs"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setError("");
            setProgress(0);
            setLastUpload(null);
          }}
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || uploading}
          className="btn-ghost !py-2 text-sm disabled:opacity-50"
        >
          ارفع الصورة
        </button>
        {url && (
          <button type="button" onClick={clear} className="btn-ghost !px-3 !py-2 text-xs">
            إزالة
          </button>
        )}
      </div>
      {uploading && (
        <div className="mt-2">
          <UploadProgress value={progress} />
        </div>
      )}
      <input type="hidden" name={name} value={url} />
      {(hint || file) && (
        <p className="muted mt-1 text-xs">
          {hint}
          {file && file.size > 4 * 1024 * 1024
            ? " — هتتضغط الصورة تلقائياً قبل الرفع."
            : ""}
        </p>
      )}
      {file && !uploading && <p className="muted mt-1 text-xs">الحجم قبل الضغط: {fileSizeAr(file.size)}</p>}
      {lastUpload && (
        <p className="muted mt-1 text-xs">
          آخر صورة: {fileSizeAr(lastUpload.originalSize)} ← {fileSizeAr(lastUpload.compressedSize)} بعد الضغط
        </p>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {url && (
        <div className="mt-2">
          <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={label} className="h-28 w-40 rounded-xl border border-line object-cover" />
            <span className="muted text-xs">عرض الصورة ↗</span>
          </a>
        </div>
      )}
    </div>
  );
}
