import React, { useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Aperture, Sliders, Calendar, Tag, Layers, Settings, FileSpreadsheet } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Photo } from "../types";

interface LightboxProps {
  photo: Photo | null;
  photos: Photo[];
  onClose: () => void;
  onNavigate: (photo: Photo) => void;
}

export default function Lightbox({ photo, photos, onClose, onNavigate }: LightboxProps) {
  
  // Handle keyboard events (ESC, Left, Right)
  useEffect(() => {
    if (!photo) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    // Lock scroll when open
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [photo, photos]);

  if (!photo) return null;

  // Find current index
  const currentIndex = photos.findIndex((p) => p.id === photo.id);

  const handlePrev = () => {
    if (currentIndex > 0) {
      onNavigate(photos[currentIndex - 1]);
    } else {
      // Wrap to end
      onNavigate(photos[photos.length - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < photos.length - 1) {
      onNavigate(photos[currentIndex + 1]);
    } else {
      // Wrap to start
      onNavigate(photos[0]);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/98 backdrop-blur-xl p-4 md:p-8 overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-50 p-2.5 bg-dark-900 border border-dark-800 hover:border-gold-500 hover:text-gold-500 rounded-full text-gray-400 transition-colors cursor-pointer"
          aria-label="Close lightbox"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Outer Grid Panel */}
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-auto lg:h-[80vh] py-12 lg:py-0">
          
          {/* Main Photo Area (8 Cols) */}
          <div className="col-span-1 lg:col-span-8 relative flex items-center justify-center h-auto lg:h-full min-h-[250px] md:min-h-[350px] lg:min-h-[500px]">
            
            {/* navigation - Previous */}
            <button
              onClick={handlePrev}
              className="absolute left-2 md:left-4 z-40 p-3 md:p-3.5 bg-dark-900/60 hover:bg-dark-900 border border-dark-800/80 hover:border-gold-500 hover:text-gold-500 text-gray-400 rounded-full transition-all cursor-pointer"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Photo slide */}
            <motion.div
              key={photo.id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative rounded-lg overflow-hidden border border-dark-800 flex items-center justify-center max-h-[45vh] lg:max-h-[75vh]"
            >
              <img
                src={photo.url}
                alt={photo.title}
                className="max-w-full max-h-[45vh] lg:max-h-[75vh] object-contain rounded-lg shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </motion.div>

            {/* navigation - Next */}
            <button
              onClick={handleNext}
              className="absolute right-2 md:right-4 z-40 p-3 md:p-3.5 bg-dark-900/60 hover:bg-dark-900 border border-dark-800/80 hover:border-gold-500 hover:text-gold-500 text-gray-400 rounded-full transition-all cursor-pointer"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Technical Lens & Camera Detail Sidebar (4 Cols) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="col-span-1 lg:col-span-4 bg-dark-900/50 border border-dark-800 p-6 md:p-8 rounded-xl flex flex-col justify-between h-auto lg:h-[75vh] overflow-y-auto"
          >
            <div>
              {/* Header category details */}
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-gold-500 bg-gold-500/10 border border-gold-500/10 rounded-sm">
                  {photo.category}
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  EXPOSURE RECORD
                </span>
              </div>

              {/* Title */}
              <h2 className="text-2xl md:text-3xl serif-heading font-serif text-white uppercase tracking-wide leading-tight mb-4">
                {photo.title}
              </h2>

              <div className="h-px bg-dark-800 my-5" />

              {/* Camera metadata telemetry details */}
              <h4 className="text-[10px] font-bold tracking-[0.2em] text-gold-500/70 uppercase mb-4">
                EXIF / METADATA REGISTRY
              </h4>

              <div className="space-y-4">
                {/* Camera */}
                <div className="flex justify-between items-center text-xs font-sans pb-3 border-b border-dark-800/60">
                  <span className="text-gray-400 flex items-center gap-2 font-medium">
                    <Aperture className="w-4 h-4 text-gold-500/80" /> Camera Body
                  </span>
                  <span className="text-white font-semibold font-mono tracking-wide">{photo.camera}</span>
                </div>

                {/* Lens */}
                <div className="flex justify-between items-center text-xs font-sans pb-3 border-b border-dark-800/60">
                  <span className="text-gray-400 flex items-center gap-2 font-medium">
                    <Layers className="w-4 h-4 text-gold-500/80" /> Optics/Lens
                  </span>
                  <span className="text-white font-semibold font-mono tracking-wide">{photo.lens}</span>
                </div>

                {/* Aperture */}
                <div className="flex justify-between items-center text-xs font-sans pb-3 border-b border-dark-800/60">
                  <span className="text-gray-400 flex items-center gap-2 font-medium">
                    <Sliders className="w-4 h-4 text-gold-500/80" /> Aperture
                  </span>
                  <span className="text-white font-semibold font-mono tracking-wide">{photo.aperture}</span>
                </div>

                {/* Shutter Speed */}
                <div className="flex justify-between items-center text-xs font-sans pb-3 border-b border-dark-800/60">
                  <span className="text-gray-400 flex items-center gap-2 font-medium">
                    <Settings className="w-4 h-4 text-gold-500/80" /> Shutter Speed
                  </span>
                  <span className="text-white font-semibold font-mono tracking-wide">{photo.shutter}</span>
                </div>

                {/* ISO rating */}
                <div className="flex justify-between items-center text-xs font-sans pb-3 border-b border-dark-800/60">
                  <span className="text-gray-400 flex items-center gap-2 font-medium">
                    <FileSpreadsheet className="w-4 h-4 text-gold-500/80" /> ISO Sensitivity
                  </span>
                  <span className="text-white font-semibold font-mono tracking-wide">ISO {photo.iso}</span>
                </div>

                {/* Capture Date */}
                <div className="flex justify-between items-center text-xs font-sans pb-3">
                  <span className="text-gray-400 flex items-center gap-2 font-medium">
                    <Calendar className="w-4 h-4 text-gold-500/80" /> Capture Date
                  </span>
                  <span className="text-white font-semibold font-mono tracking-wide">{photo.date}</span>
                </div>
              </div>
            </div>

            {/* Nice footnote */}
            <div className="mt-8 pt-4 border-t border-dark-800 text-[10px] text-gray-500 leading-relaxed font-sans">
              All prints from this gallery are custom printed on fine-art Hahnemühle Photorag papers in the Amsterdam atelier under strictly managed archival conditions.
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
