"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toArabicDigits } from "@/lib/format";
import { cloudinaryDeliveryUrl } from "@/lib/image-assets";

export interface GalleryImage {
  src: string;
  alt: string;
}

type Props = { images: GalleryImage[] };

/** معرض صور الوحدة: صورة كبيرة + مصغّرات + لايت بوكس أصلي يتحكم به باللمس والأسهم. */
export default function PropertyGallery({ images }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchStartX = useRef<number | null>(null);
  const [index, setIndex] = useState(0);
  const count = images.length;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const step = event.key === "ArrowLeft" ? 1 : -1;
      setIndex((current) => (current + step + count) % count);
    };
    dialog.addEventListener("keydown", handleKey);
    return () => dialog.removeEventListener("keydown", handleKey);
  }, [count]);

  if (count === 0) {
    return <div className="mb-8 h-[300px] rounded-2xl bg-navy-soft" aria-label="لا توجد صور لهذه الوحدة" />;
  }

  const openAt = (position: number) => {
    setIndex(position);
    dialogRef.current?.showModal();
  };
  const step = (direction: number) => setIndex((current) => (current + direction + count) % count);
  const active = images[index];

  return (
    <>
      <div className="mb-8 grid gap-3 sm:grid-cols-4">
        <button
          type="button"
          data-testid="gallery-main"
          aria-label={`عرض معرض الصور: ${images[0].alt}`}
          onClick={() => openAt(0)}
          className="relative h-[300px] overflow-hidden rounded-2xl bg-navy-soft text-right sm:col-span-2 sm:row-span-2 sm:h-full sm:min-h-[460px]"
        >
          <Image
            src={cloudinaryDeliveryUrl(images[0].src, 1400)}
            alt={images[0].alt}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
            preload
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-navy-deep/45 to-transparent" />
          <span className="absolute bottom-4 right-4 rounded-full bg-navy-deep/75 px-3 py-1.5 text-xs font-bold text-white">
            عرض كل الصور ({toArabicDigits(count)})
          </span>
        </button>

        {images.slice(1, 5).map((image, i) => (
          <button
            key={image.src + i}
            type="button"
            data-testid={`gallery-thumb-${i + 1}`}
            aria-label={`عرض الصورة ${toArabicDigits(i + 2)}: ${image.alt}`}
            onClick={() => openAt(i + 1)}
            className="relative h-[140px] overflow-hidden rounded-2xl bg-navy-soft text-right sm:h-full sm:min-h-[220px]"
          >
            <Image
              src={cloudinaryDeliveryUrl(image.src, 600)}
              alt={image.alt}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              loading="lazy"
              decoding="async"
              className="object-cover"
            />
            {i === 3 && count > 5 && (
              <span className="absolute inset-0 grid place-items-center bg-navy-deep/60 text-lg font-black text-white">
                +{toArabicDigits(count - 5)}
              </span>
            )}
          </button>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        data-testid="gallery-dialog"
        aria-label={`معرض صور ${images[0].alt}`}
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="max-h-[92vh] w-[95vw] max-w-5xl overflow-hidden rounded-2xl border-0 bg-ivory p-0 text-navy shadow-2xl backdrop:bg-navy-deep/80"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <p data-testid="gallery-counter" className="text-sm font-extrabold text-navy">
            {toArabicDigits(index + 1)} / {toArabicDigits(count)}
          </p>
          <button
            type="button"
            aria-label="إغلاق المعرض"
            onClick={() => dialogRef.current?.close()}
            className="grid h-11 w-11 place-items-center rounded-full bg-navy-soft text-lg font-black text-navy transition hover:bg-gold-soft"
          >
            ✕
          </button>
        </div>

        <div
          data-testid="gallery-stage"
          onTouchStart={(event) => {
            touchStartX.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            const start = touchStartX.current;
            const end = event.changedTouches[0]?.clientX;
            touchStartX.current = null;
            if (start == null || end == null || Math.abs(end - start) < 40) return;
            step(end < start ? 1 : -1);
          }}
          className="relative h-[58vh] min-h-[280px] bg-navy-deep/5"
        >
          <Image
            key={active.src}
            src={cloudinaryDeliveryUrl(active.src, 1600)}
            alt={active.alt}
            fill
            sizes="100vw"
            className="object-contain"
          />
          <button
            type="button"
            aria-label="الصورة السابقة"
            onClick={() => step(-1)}
            className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-navy-deep/70 text-lg font-black text-white transition hover:bg-navy-deep"
          >
            →
          </button>
          <button
            type="button"
            aria-label="الصورة التالية"
            onClick={() => step(1)}
            className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-navy-deep/70 text-lg font-black text-white transition hover:bg-navy-deep"
          >
            ←
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto p-3" dir="rtl">
          {images.map((image, i) => (
            <button
              key={image.src + i}
              type="button"
              aria-label={`الانتقال للصورة ${toArabicDigits(i + 1)}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === index ? "border-gold" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={cloudinaryDeliveryUrl(image.src, 160)}
                alt={image.alt}
                fill
                sizes="80px"
                loading="lazy"
                className="object-cover"
              />
            </button>
          ))}
        </div>
        <p className="px-4 pb-3 text-center text-[11px] leading-5 text-muted">
          اسحب الصورة لليسار للتالي ولليمين للسابق، أو استخدم الأسهم.
        </p>
      </dialog>
    </>
  );
}
