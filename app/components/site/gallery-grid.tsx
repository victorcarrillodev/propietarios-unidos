import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export type GalleryPhoto = { src: string; width: number; height: number; alt: string };

export function GalleryGrid({ photos }: { photos: GalleryPhoto[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const showPrev = useCallback(
    () => setOpenIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length)),
    [photos.length],
  );
  const showNext = useCallback(
    () => setOpenIndex((i) => (i === null ? i : (i + 1) % photos.length)),
    [photos.length],
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") showPrev();
      if (event.key === "ArrowRight") showNext();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [openIndex, close, showPrev, showNext]);

  const active = openIndex !== null ? photos[openIndex] : null;

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {photos.map((photo, index) => (
          <li key={photo.src}>
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              className="group block aspect-square w-full overflow-hidden rounded-2xl bg-stone-100 ring-1 ring-forest-900/10 transition-all duration-200 hover:shadow-lg hover:ring-forest-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 focus-visible:ring-offset-2"
              aria-label={`Ampliar foto: ${photo.alt}`}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                loading="lazy"
                decoding="async"
                className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
              />
            </button>
          </li>
        ))}
      </ul>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.alt}
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-forest-950/95 p-4 backdrop-blur-sm sm:p-8 animate-in fade-in duration-150"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar"
            className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="size-5" aria-hidden />
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={showPrev}
                aria-label="Foto anterior"
                className="absolute top-1/2 left-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-4"
              >
                <ChevronLeft className="size-6" aria-hidden />
              </button>
              <button
                type="button"
                onClick={showNext}
                aria-label="Foto siguiente"
                className="absolute top-1/2 right-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-4"
              >
                <ChevronRight className="size-6" aria-hidden />
              </button>
            </>
          )}

          <img
            key={active.src}
            src={active.src}
            alt={active.alt}
            className="max-h-[78vh] max-w-full rounded-lg object-contain shadow-2xl animate-in zoom-in-95 duration-150"
          />
          <p className="mt-4 text-sm text-forest-100">
            {(openIndex ?? 0) + 1} / {photos.length}
          </p>
        </div>
      )}
    </>
  );
}
