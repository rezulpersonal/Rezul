import React, { useState, useEffect } from "react";
import { ArrowDown, Aperture, Sliders, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Photo } from "../types";

interface HeroProps {
  photos: Photo[];
}

export default function Hero({ photos }: HeroProps) {
  // Grab featured photos, fallback to all photos, fallback to static defaults
  const featuredPhotos = photos.filter(p => p.featured).length > 0
    ? photos.filter(p => p.featured)
    : photos.slice(0, 3);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (featuredPhotos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % featuredPhotos.length);
    }, 6000); // 6 seconds per slide for a relaxed cinematic feel
    return () => clearInterval(interval);
  }, [featuredPhotos]);

  const activePhoto = featuredPhotos[currentIndex] || {
    id: "default-hero",
    title: "Symphony of Citrus",
    category: "Culinary",
    url: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&q=80&w=1200",
    camera: "Sony A7R IV",
    lens: "90mm Macro",
    aperture: "f/2.8",
    shutter: "1/160s",
    iso: "100",
    date: "2026-06-01",
    featured: true,
  };

  const skipToImg = (idx: number) => {
    setCurrentIndex(idx);
  };

  const handleScrollDown = () => {
    const gallerySection = document.getElementById("gallery");
    if (gallerySection) {
      const headerOffset = 80;
      const elementPosition = gallerySection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <section
      id="hero"
      className="relative h-screen w-full bg-dark-950 flex items-center justify-center overflow-hidden"
    >
      {/* Background Slideshow with crossfade */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={activePhoto.id + "-" + currentIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 1.6, ease: [0.25, 1, 0.5, 1] }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Ambient vignette layers */}
            <div className="absolute inset-0 bg-radial-gradient-to-b from-transparent via-dark-950/40 to-dark-950 z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-dark-950/50 z-10" />
            <div className="absolute inset-0 bg-dark-950/40 z-10" />
            
            <img
              src={activePhoto.url}
              alt={activePhoto.title}
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Ambient particle elements */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-gold-500/5 rounded-full filter blur-3xl animate-pulse" style={{ animationDuration: "12s" }} />
        <div className="absolute bottom-1/3 right-10 w-80 h-80 bg-gold-500/5 rounded-full filter blur-3xl animate-pulse" style={{ animationDuration: "8s" }} />
      </div>

      {/* Hero Content Panel */}
      <div className="relative z-20 max-w-5xl mx-auto px-6 text-center flex flex-col items-center">
        {/* Aesthetic label badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex items-center gap-2 px-6 py-2 bg-gold-500/10 border border-gold-500/40 rounded-sm mb-6"
        >
          <span className="text-[12px] uppercase tracking-[0.4em] font-extrabold text-gold-400 font-sans select-none">
            EXIBITOR
          </span>
        </motion.div>

        {/* Big Display Serif Header */}
        <div className="overflow-hidden mb-6">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl serif-heading text-white font-serif leading-[1.1] tracking-wider text-shadow uppercase"
          >
            VIEWOREZ
          </motion.h1>
        </div>

        {/* Elegant Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-sm sm:text-base md:text-lg text-gray-300 max-w-xl font-sans tracking-wide leading-relaxed font-light mb-10 italic"
        >
          just clicking the moment and giving life to the picture
        </motion.p>
      </div>



      {/* Carousel Dots indicator */}
      {featuredPhotos.length > 1 && (
        <div className="absolute bottom-12 right-6 md:right-12 z-20 flex flex-col gap-2.5">
          {featuredPhotos.map((p, index) => (
            <button
              key={"dot-" + p.id}
              onClick={() => skipToImg(index)}
              className="group flex items-center justify-end gap-3 text-right cursor-pointer"
            >
              <span className="text-[9px] font-bold text-gray-500 group-hover:text-gold-400 opacity-0 group-hover:opacity-100 transition-all duration-300 tracking-widest uppercase font-mono">
                {p.title}
              </span>
              <div
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  currentIndex === index
                    ? "bg-gold-500 scale-125 shadow-[0_0_8px_#d4af37]"
                    : "bg-gray-600 hover:bg-gray-400"
                }`}
              />
            </button>
          ))}
        </div>
      )}

      {/* Scroll indicator with subtle bouncing */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 text-center flex flex-col items-center">
        <motion.button
          onClick={handleScrollDown}
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="text-gray-500 hover:text-gold-500/80 transition-colors cursor-pointer"
          aria-label="Scroll to gallery"
        >
          <span className="text-[9px] tracking-[0.25em] font-semibold text-gray-500 uppercase block mb-1">
            Scroll
          </span>
          <ArrowDown className="w-4 h-4 mx-auto" />
        </motion.button>
      </div>
    </section>
  );
}
