import React from "react";
import { ImageOff, Aperture, Eye, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Photo } from "../types";

interface GalleryProps {
  photos: Photo[];
  onPhotoSelect: (photo: Photo) => void;
  onDeletePhoto: (id: string) => void;
  isAdmin?: boolean;
}

export default function Gallery({ photos, onPhotoSelect, onDeletePhoto, isAdmin = false }: GalleryProps) {
  // Render all photos together as common exhibition items
  const filteredPhotos = photos;

  return (
    <section id="gallery" className="py-24 bg-dark-950 px-6 md:px-12 relative">
      {/* Background radial soft light glow */}
      <div className="absolute inset-0 ambient-radial pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Gallery Title & Subheader */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[11px] font-bold tracking-[0.25em] text-gold-500 uppercase block mb-3">
            REZUL SHOWCASE
          </span>
          <h2 className="text-3xl sm:text-5xl serif-heading font-serif text-white tracking-tight mb-4">
            Curated Exposures
          </h2>
          <div className="w-12 h-px bg-gold-500/50 mx-auto mb-4" />
          <p className="text-sm font-sans tracking-wide text-gray-400 font-light leading-relaxed">
            Providing life to the pictures through capturing the moment and each clicks has its own storyboard of it
          </p>
        </div>

        {/* Gallery Items Grid */}
        <AnimatePresence mode="popLayout">
          {filteredPhotos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="py-16 text-center border border-dashed border-dark-800 rounded bg-dark-900/20 max-w-md mx-auto"
            >
              <ImageOff className="w-10 h-10 text-gray-600 mx-auto mb-4" />
              <h3 className="text-sm tracking-widest uppercase font-semibold text-gray-300">
                Gallery Empty
              </h3>
              <p className="text-xs text-gray-500 mt-2">
                No items found. Click "Add Masterpiece" to build your exhibition!
              </p>
            </motion.div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredPhotos.map((photo, index) => (
                <motion.div
                  layout
                  key={photo.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.05,
                    ease: "easeOut",
                  }}
                  whileHover={{ y: -4 }}
                  className="group relative h-[380px] w-full rounded-lg bg-dark-900 border border-dark-800/60 overflow-hidden shadow-lg transition-all duration-300 hover:border-gold-500/30 hover:shadow-gold-500/5 cursor-pointer"
                >
                  {/* Absolute control container (Delete file button for convenient testing!) */}
                  {isAdmin && (
                    <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Are you sure you want to remove "${photo.title}"?`)) {
                            onDeletePhoto(photo.id);
                          }
                        }}
                        className="p-2 bg-dark-950/85 hover:bg-red-950 border border-dark-800 hover:border-red-500/30 text-gray-400 hover:text-red-400 rounded-md transition-all backdrop-blur-md"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Photo Display Frame with zoom effect */}
                  <div className="w-full h-full relative overflow-hidden" onClick={() => onPhotoSelect(photo)}>
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-950/90 via-dark-950/20 to-transparent z-10 opacity-60 group-hover:opacity-90 transition-opacity duration-500" />
                    <img
                      src={photo.url}
                      alt={photo.title}
                      className="w-full h-full object-cover object-center transform scale-102 group-hover:scale-110 transition-transform duration-1000 ease-[0.16,1,0.3,1]"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />

                    {/* Image details overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-6 z-20 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                      <div className="text-[10px] text-gold-500 tracking-wider uppercase font-medium mb-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Aperture className="w-3.5 h-3.5" />
                        {photo.camera}
                      </div>

                      <h3 className="text-lg font-serif serif-heading text-white font-semibold leading-snug tracking-wide group-hover:text-gold-200 transition-colors duration-300">
                        {photo.title}
                      </h3>

                      <div className="h-px w-0 group-hover:w-full bg-gold-500/30 my-2.5 transition-all duration-500" />

                      <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                        <span className="text-[9px] text-gray-400 font-mono">
                          {photo.lens} • {photo.aperture} • {photo.shutter}
                        </span>
                        
                        <span className="text-[9px] flex items-center gap-1 text-gold-500/80 font-semibold tracking-wider uppercase">
                          <Eye className="w-3.5 h-3.5" /> View Full
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
