"use client";

import { toArabicDigits } from "@/lib/format";

export default function UploadProgress({ value }: { value: number }) {
  return (
    <div
      role="progressbar"
      aria-label="تقدم رفع الصورة"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className="w-full max-w-xs"
    >
      <div className="muted mb-1 flex items-center justify-between text-xs">
        <span>جارٍ رفع الصورة...</span>
        <span>{toArabicDigits(value)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-nile transition-[width] duration-200"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
