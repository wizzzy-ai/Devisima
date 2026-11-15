"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff, Play } from "lucide-react";
import { WebsitePreview } from "@/components/marketplace/website-preview";

type GalleryImage = { src: string; alt: string };

export function ProductGallery({
  title,
  assets,
  legacyImages,
  demoUrl,
  videoUrl,
}: {
  title: string;
  assets: Array<{ id: string; fileName: string; isCover: boolean }>;
  legacyImages: string[];
  demoUrl: string | null;
  videoUrl: string | null;
}) {
  function safeImageSource(src: string) {
    if (src.startsWith("/") && !src.startsWith("//")) return src;
    try {
      const url = new URL(src);
      return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
    } catch {
      return null;
    }
  }

  const images: GalleryImage[] = [
    ...assets.map((asset) => ({ src: `/api/products/assets/${asset.id}`, alt: `${title} screenshot${asset.isCover ? "" : `: ${asset.fileName}`}` })),
    ...legacyImages
      .filter((src) => !assets.some((asset) => src === `/api/products/assets/${asset.id}`))
      .map((src, index) => ({ src: safeImageSource(src), alt: `${title} screenshot ${index + 1}` }))
      .filter((image): image is GalleryImage => Boolean(image.src)),
  ];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [failedThumbnails, setFailedThumbnails] = useState<number[]>([]);
  const touchStartX = useRef<number | null>(null);

  function select(index: number) {
    setSelectedIndex((index + images.length) % images.length);
    setImageFailed(false);
  }

  const selected = images[selectedIndex];

  return (
    <section aria-label="Product gallery" className="overflow-hidden rounded-2xl border border-[#dce3dd] bg-white shadow-sm">
      <div
        className="relative aspect-[4/3] overflow-hidden bg-[#eef2ec] sm:aspect-[16/10]"
        onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }}
        onTouchEnd={(event) => {
          const endX = event.changedTouches[0]?.clientX;
          if (touchStartX.current !== null && endX !== undefined && Math.abs(endX - touchStartX.current) > 45 && images.length > 1) {
            select(selectedIndex + (endX < touchStartX.current ? 1 : -1));
          }
          touchStartX.current = null;
        }}
      >
        {selected && !imageFailed ? (
          <Image src={selected.src} alt={selected.alt} fill unoptimized={!selected.src.startsWith("/api/products/assets/")} priority sizes="(max-width: 1024px) 100vw, 60vw" className="object-contain" onError={() => setImageFailed(true)} />
        ) : demoUrl ? (
          <WebsitePreview siteUrl={demoUrl} title={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-[#66756b]">
            <ImageOff className="h-9 w-9 text-[#0F4C5C]/60" />
            <p className="font-semibold text-[#263d34]">{selected ? "Preview unavailable" : "No screenshots yet"}</p>
            <p className="max-w-sm text-sm">{selected ? "This image could not be loaded." : "The seller hasn’t added product images. Check the description and demo links for more details."}</p>
          </div>
        )}
        {images.length > 1 && (
          <>
            <button type="button" onClick={() => select(selectedIndex - 1)} aria-label="Previous image" className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/80 bg-white/90 text-[#163b35] shadow transition hover:bg-white"><ChevronLeft className="h-5 w-5" /></button>
            <button type="button" onClick={() => select(selectedIndex + 1)} aria-label="Next image" className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/80 bg-white/90 text-[#163b35] shadow transition hover:bg-white"><ChevronRight className="h-5 w-5" /></button>
          </>
        )}
        {(demoUrl || videoUrl) && <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
          {demoUrl && <a href={demoUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#0F4C5C] px-3 py-2 text-xs font-semibold text-white shadow">Open live demo <span aria-hidden="true">↗</span></a>}
          {videoUrl && <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/95 px-3 py-2 text-xs font-semibold text-[#173d36] shadow"><Play className="h-3.5 w-3.5" /> Watch video</a>}
        </div>}
      </div>

      {images.length > 1 && <div className="flex snap-x gap-3 overflow-x-auto border-t border-[#e7ece7] p-3 sm:p-4" aria-label="Select a screenshot">
        {images.map((image, index) => (
          <button key={`${image.src}-${index}`} type="button" onClick={() => select(index)} aria-label={`Show image ${index + 1}`} aria-pressed={index === selectedIndex} className={`relative h-16 w-24 shrink-0 snap-start overflow-hidden rounded-lg border-2 bg-[#eef2ec] transition sm:h-20 sm:w-28 ${index === selectedIndex ? "border-[#0F4C5C]" : "border-transparent hover:border-[#35D0BA]"}`}>
            {!failedThumbnails.includes(index) ? <Image src={image.src} alt="" fill unoptimized={!image.src.startsWith("/api/products/assets/")} sizes="112px" className="object-cover" onError={() => setFailedThumbnails((failed) => [...failed, index])} /> : <span className="grid h-full place-items-center text-[10px] text-[#66756b]">Preview</span>}
          </button>
        ))}
      </div>}
    </section>
  );
}
