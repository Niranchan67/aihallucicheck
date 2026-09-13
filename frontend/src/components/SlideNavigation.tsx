import React, { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Grid,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";

interface SlideNavigationProps {
  currentSlide: number;
  totalSlides: number;
  slideTitles: { title: string; subtitle: string; icon: string }[];
  onSlideChange: (slide: number) => void;
}

export function SlideNavigation({
  currentSlide,
  totalSlides,
  slideTitles,
  onSlideChange,
}: SlideNavigationProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLInputElement
      ) {
        return; // Don't intercept typing in input fields
      }
      if (e.key === "ArrowLeft" && currentSlide > 1) {
        onSlideChange(currentSlide - 1);
      } else if (e.key === "ArrowRight" && currentSlide < totalSlides) {
        onSlideChange(currentSlide + 1);
      } else if (e.key === "Escape") {
        setDrawerOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide, totalSlides, onSlideChange]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const currentInfo = slideTitles[currentSlide - 1] || {
    title: `Slide ${currentSlide}`,
    subtitle: "",
    icon: "slideshow",
  };

  return (
    <>
      {/* Sticky Bottom Slide Navigation Bar */}
      <footer className="sticky bottom-0 z-40 w-full border-t border-zinc-800/80 bg-[#000000]/90 backdrop-blur-xl px-4 py-2.5 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          {/* Left: Previous Button & Slide Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onSlideChange(currentSlide - 1)}
              disabled={currentSlide <= 1}
              className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:border-zinc-600 hover:bg-zinc-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none active:scale-95 cursor-pointer"
              title="Previous Slide (Left Arrow)"
            >
              <ChevronLeft size={15} />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="hidden md:flex flex-col">
              <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-400 font-medium">
                Slide {currentSlide} of {totalSlides}
              </span>
              <span className="text-xs font-medium text-zinc-200 truncate max-w-[200px] lg:max-w-[280px]">
                {currentInfo.title}
              </span>
            </div>
          </div>

          {/* Center: Slide Indicator Dots */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {slideTitles.map((slide, index) => {
              const slideNum = index + 1;
              const isActive = slideNum === currentSlide;
              return (
                <button
                  key={slideNum}
                  type="button"
                  onClick={() => onSlideChange(slideNum)}
                  className={`group relative flex items-center justify-center transition-all ${
                    isActive
                      ? "h-2.5 w-7 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.4)]"
                      : "h-2 w-2 rounded-full bg-zinc-800 hover:bg-zinc-600"
                  }`}
                  title={`${slideNum}. ${slide.title}`}
                >
                  <span className="sr-only">Go to slide {slideNum}</span>
                  {/* Tooltip on hover */}
                  <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-200 opacity-0 shadow-xl transition-opacity group-hover:opacity-100 z-50">
                    {slideNum}. {slide.title}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Next Button, Slide Drawer & Fullscreen */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 p-1.5 text-zinc-400 hover:border-zinc-600 hover:text-white transition-colors cursor-pointer"
              title="View All Slides Menu"
            >
              <Grid size={15} />
              <span className="hidden lg:inline text-xs font-medium text-zinc-300">
                All Slides
              </span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="hidden sm:flex items-center justify-center rounded-md border border-zinc-800 bg-zinc-900/60 p-1.5 text-zinc-400 hover:border-zinc-600 hover:text-white transition-colors cursor-pointer"
              title="Toggle Fullscreen Mode"
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            <button
              type="button"
              onClick={() => onSlideChange(currentSlide + 1)}
              disabled={currentSlide >= totalSlides}
              className="flex items-center gap-1.5 rounded-md bg-white hover:bg-zinc-200 px-4 py-1.5 text-xs font-semibold text-black transition-all shadow-sm disabled:opacity-30 disabled:pointer-events-none active:scale-95 cursor-pointer"
              title="Next Slide (Right Arrow)"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </footer>

      {/* Slide Drawer / Modal (Quick Jump to any slide) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl rounded-xl border border-zinc-800 bg-[#0c0d12] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Grid size={18} className="text-indigo-400" /> Jump to Slide
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Select any slide to navigate directly or use Left/Right arrow keys.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[65vh] overflow-y-auto pr-1">
              {slideTitles.map((slide, idx) => {
                const num = idx + 1;
                const isCurrent = num === currentSlide;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      onSlideChange(num);
                      setDrawerOpen(false);
                    }}
                    className={`flex flex-col text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                      isCurrent
                        ? "border-purple-500/50 bg-[#141221] shadow-[0_0_15px_rgba(168,85,247,0.12)]"
                        : "border-zinc-800/80 bg-zinc-950/70 hover:border-zinc-700 hover:bg-zinc-900/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[11px] font-bold text-zinc-400">
                        0{num}
                      </span>
                      {isCurrent && (
                        <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-mono text-purple-300 border border-purple-500/30">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-white">
                      {slide.title}
                    </span>
                    <span className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">
                      {slide.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
