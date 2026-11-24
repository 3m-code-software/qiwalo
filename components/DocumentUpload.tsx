"use client";

import { useState } from "react";
import { prepareImage } from "@/lib/client-image";

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

  async function handleUpload() {
    if (!file || uploading) return;
    setUploading(true);
    setError("");
    try {
      const payload = await prepareImage(file);
      const body = new FormData();
      body.set("file", payload);
      const response = await fetch("/api/upload", { method: "POST", body });
      let json: { url?: string; error?: string };
      try {
        json = (await response.json()) as { url?: string; error?: string };
      } catch {
        setError(
          response.status === 413
            ? "حجم الصورة كبير جداً — جرّب صورة أصغر."
            : "الرفع فشل. تأكد من الاتصال وحاول مرة تانية.",
        );
        return;
      }
      if (!response.ok || !json.url) {
        setError(json.error ?? `الرفع فشل (${response.status}). حاول مرة تانية.`);
      } else {
        setUrl(json.url);
        onUrlChange?.(json.url);
        setFile(null);
      }
    } catch {
      setError("الرفع فشل. تأكد من الاتصال وحاول مرة تانية.");
    } finally {
      setUploading(false);
    }
  }

  function clear() {
    setUrl("");
    setFile(null);
    setError("");
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
          onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(""); }}
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || uploading}
          className="btn-ghost !py-2 text-sm disabled:opacity-50"
        >
          {uploading ? "جارٍ الرفع..." : "ارفع الصورة"}
        </button>
        {url && (
          <button type="button" onClick={clear} className="btn-ghost !px-3 !py-2 text-xs">
            إزالة
          </button>
        )}
      </div>
      <input type="hidden" name={name} value={url} />
      {(hint || file) && (
        <p className="muted mt-1 text-xs">
          {hint}
          {file && file.size > 4 * 1024 * 1024
            ? " — هتتضغط الصورة تلقائياً قبل الرفع."
            : ""}
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
