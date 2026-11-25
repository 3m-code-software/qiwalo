"use client";

import Image from "next/image";
import { useState, type DragEvent } from "react";
import { toArabicDigits } from "@/lib/format";
import { cloudinaryDeliveryUrl, imageOrderAlt } from "@/lib/image-assets";

export type EditableImage = {
  url: string;
  source: "upload" | "link";
};

export default function ImageOrderEditor({
  images,
  onChange,
}: {
  images: EditableImage[];
  onChange: (next: EditableImage[]) => void;
}) {
  const [dragged, setDragged] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  function move(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= images.length || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  function handleDrop(index: number, event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (dragged !== null) move(dragged, index);
    setDragged(null);
    setOver(null);
  }

  if (images.length === 0) return null;

  return (
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {images.map((image, index) => (
        <div
          key={`${image.source}:${image.url}`}
          draggable
          onDragStart={() => setDragged(index)}
          onDragOver={(event) => { event.preventDefault(); setOver(index); }}
          onDragLeave={() => setOver((current) => (current === index ? null : current))}
          onDrop={(event) => handleDrop(index, event)}
          onDragEnd={() => { setDragged(null); setOver(null); }}
          className={`relative aspect-square cursor-grab overflow-hidden rounded-xl border-2 bg-ivory active:cursor-grabbing ${
            over === index && dragged !== index ? "border-gold" : "border-line"
          }`}
          title="اسحب لتغيير الترتيب"
        >
          <Image src={cloudinaryDeliveryUrl(image.url, 320)} alt={imageOrderAlt(index)} fill sizes="160px" loading="lazy" decoding="async" className="object-cover" />

          <span className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold text-white">
            {toArabicDigits(index + 1)}
          </span>
          {index === 0 && (
            <span className="absolute left-1 top-1 rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-navy">
              الغلاف
            </span>
          )}

          <div className="absolute inset-x-1 bottom-1 flex items-center justify-between gap-1">
            {index > 0 ? (
              <button
                type="button"
                onClick={() => move(index, 0)}
                className="rounded-full bg-navy/90 px-2 py-1 text-[10px] font-bold text-white"
                title="اجعلها صورة الغلاف"
              >
                الغلاف
              </button>
            ) : <span />}
            <button
              type="button"
              aria-label="حذف الصورة"
              onClick={() => onChange(images.filter((_, i) => i !== index))}
              className="grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"
            >
              ×
            </button>
          </div>

          <input type="hidden" name="images" value={image.url} />
        </div>
      ))}
    </div>
  );
}
