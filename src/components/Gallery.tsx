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
  const [selectedOrientation, setSelectedOrientation] = React.useState<"all" | "portrait" | "landscape">("all");
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  // Filter photos by selected orientation segment
  const filteredPhotos = photos.filter((photo) => {
    if (selectedOrientation === "all") return true;
    const orientation = photo.orientation || "landscape";
    return orientation === selectedOrientation;
  });

  const landscapePhotos = filteredPhotos.filter((p) => (p.orientation || "landscape") === "landscape");
  const portraitPhotos = filteredPhotos.filter((p) => p.orientation === "portrait");

  return (
    <section id="gallery" className="py-16 md:py-24 bg-dark-950 px-4 sm:px-6 md:px-12 relative">
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
          <p className="text-sm font-sans tracking-wide text-gray-400 font-light leading-relaxed mb-8">
            Providing life to the pictures through capturing the moment and each clicks has its own storyboard of it
          </p>

          {/* Segment Selector Toggle Buttons (Portrait & Landscape) */}
          <div className="inline-flex items-center gap-4 bg-dark-900 border border-dark-800 p-1.5 rounded-full select-none">
            <button
              onClick={() => setSelectedOrientation(selectedOrientation === "portrait" ? "all" : "portrait")}
              className={`flex items-center gap-2 py-2.5 px-6 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer select-none ${
                selectedOrientation === "portrait"
                  ? "bg-gold-500 text-dark-950 font-bold shadow-md shadow-gold-500/10"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <span className={`w-2 h-3.5 border block rounded-[1px] ${selectedOrientation === "portrait" ? "border-dark-950" : "border-current"}`} />
              Portrait
            </button>
            <button
              onClick={() => setSelectedOrientation(selectedOrientation === "landscape" ? "all" : "landscape")}
              className={`flex items-center gap-2 py-2.5 px-6 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer select-none ${
                selectedOrientation === "landscape"
                  ? "bg-gold-500 text-dark-950 font-bold shadow-md shadow-gold-500/10"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <span className={`w-3.5 h-2 border block rounded-[1px] ${selectedOrientation === "landscape" ? "border-dark-950" : "border-current"}`} />
              Landscape
            </button>
          </div>
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
            <div className="space-y-16">
              {/* Landscape Section */}
              {landscapePhotos.length > 0 && (
                <div>
                  {selectedOrientation === "all" && (
                    <div className="flex items-center gap-4 mb-8">
                      <h3 className="text-xs font-bold tracking-[0.25em] text-gold-500 uppercase">
                        Landscape Masterpieces ({landscapePhotos.length})
                      </h3>
                      <div className="h-px bg-gradient-to-r from-gold-500/20 to-transparent flex-default flex-grow" />
                    </div>
                  )}
                  <motion.div
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                  >
                    {landscapePhotos.map((photo, index) => {
                      return (
                        <motion.div
                          layout
                          key={photo.id}
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-50px" }}
                          transition={{
                            duration: 0.6,
                            delay: index * 0.04,
                            ease: "easeOut",
                          }}
                          whileHover={{ y: -4 }}
                          className="group relative w-full rounded-lg bg-dark-900 border border-dark-800/60 overflow-hidden shadow-lg transition-all duration-300 hover:border-gold-500/30 hover:shadow-gold-500/5 cursor-pointer aspect-[3/2]"
                        >
                          {/* Absolute control container */}
                          {isAdmin && (
                            <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              {confirmDeleteId === photo.id ? (
                                <div className="flex items-center gap-1.5 bg-dark-950/95 border border-red-500/50 p-1 rounced-md shadow-lg backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeletePhoto(photo.id);
                                      setConfirmDeleteId(null);
                                    }}
                                    className="px-2 py-1 bg-red-650 hover:bg-red-600 text-[10px] text-white font-bold uppercase rounded tracking-wider cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmDeleteId(null);
                                    }}
                                    className="px-2 py-1 bg-dark-900 border border-dark-800 text-[10px] text-gray-400 hover:text-white rounded tracking-wider cursor-pointer"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeleteId(photo.id);
                                  }}
                                  className="p-2 bg-dark-950/85 hover:bg-red-950 border border-dark-800 hover:border-red-500/30 text-gray-400 hover:text-red-400 rounded-md transition-all backdrop-blur-md"
                                  title="Delete entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}

                          {/* Photo Display Frame with zoom effect */}
                          <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center" onClick={() => onPhotoSelect(photo)}>
                            <div className="absolute inset-0 bg-gradient-to-t from-dark-950/90 via-dark-950/20 to-transparent z-10 opacity-60 group-hover:opacity-90 transition-opacity duration-500 pointer-events-none" />
                            <img
                              src={photo.url}
                              alt={photo.title}
                              className="w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-1000 ease-[0.16,1,0.3,1]"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                            />

                            {/* Image details overlay */}
                            <div className="absolute inset-x-0 bottom-0 p-5 md:p-6 z-20 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                              <div className="text-[10px] text-gold-500 tracking-wider uppercase font-medium mb-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <Aperture className="w-3.5 h-3.5" />
                                {photo.camera}
                              </div>

                              <h3 className="text-base md:text-lg font-serif serif-heading text-white font-semibold leading-snug tracking-wide group-hover:text-gold-200 transition-colors duration-300 truncate">
                                {photo.title}
                              </h3>

                              <div className="h-px w-0 group-hover:w-full bg-gold-500/30 my-2 transition-all duration-500" />

                              <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                                <span className="text-[9px] text-gray-400 font-mono truncate max-w-[70%]">
                                  {photo.lens} • {photo.aperture} • {photo.shutter}
                                </span>
                                
                                <span className="text-[9px] flex items-center gap-1 text-gold-500/80 font-semibold tracking-wider uppercase flex-shrink-0">
                                  <Eye className="w-3.5 h-3.5" /> View Full
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
              )}

              {/* Portrait Section */}
              {portraitPhotos.length > 0 && (
                <div>
                  {selectedOrientation === "all" && (
                    <div className="flex items-center gap-4 mb-8 pt-6">
                      <h3 className="text-xs font-bold tracking-[0.25em] text-gold-500 uppercase">
                        Portrait perspectives ({portraitPhotos.length})
                      </h3>
                      <div className="h-px bg-gradient-to-r from-gold-500/20 to-transparent flex-default flex-grow" />
                    </div>
                  )}
                  <motion.div
                    layout
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6"
                  >
                    {portraitPhotos.map((photo, index) => {
                      return (
                        <motion.div
                          layout
                          key={photo.id}
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-50px" }}
                          transition={{
                            duration: 0.6,
                            delay: index * 0.04,
                            ease: "easeOut",
                          }}
                          whileHover={{ y: -4 }}
                          className="group relative w-full rounded-lg bg-dark-900 border border-dark-800/60 overflow-hidden shadow-lg transition-all duration-300 hover:border-gold-500/30 hover:shadow-gold-500/5 cursor-pointer aspect-[2/3]"
                        >
                          {/* Absolute control container */}
                          {isAdmin && (
                            <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              {confirmDeleteId === photo.id ? (
                                <div className="flex items-center gap-1.5 bg-dark-950/95 border border-red-500/50 p-1 rounded-md shadow-lg backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeletePhoto(photo.id);
                                      setConfirmDeleteId(null);
                                    }}
                                    className="px-2 py-1 bg-red-650 hover:bg-red-600 text-[10px] text-white font-bold uppercase rounded tracking-wider cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmDeleteId(null);
                                    }}
                                    className="px-2 py-1 bg-dark-900 border border-dark-800 text-[10px] text-gray-400 hover:text-white rounded tracking-wider cursor-pointer"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeleteId(photo.id);
                                  }}
                                  className="p-2 bg-dark-950/85 hover:bg-red-950 border border-dark-800 hover:border-red-500/30 text-gray-400 hover:text-red-400 rounded-md transition-all backdrop-blur-md"
                                  title="Delete entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}

                          {/* Photo Display Frame with zoom effect */}
                          <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center" onClick={() => onPhotoSelect(photo)}>
                            <div className="absolute inset-0 bg-gradient-to-t from-dark-950/90 via-dark-950/20 to-transparent z-10 opacity-60 group-hover:opacity-90 transition-opacity duration-500 pointer-events-none" />
                            <img
                              src={photo.url}
                              alt={photo.title}
                              className="w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-1000 ease-[0.16,1,0.3,1]"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                            />

                            {/* Image details overlay */}
                            <div className="absolute inset-x-0 bottom-0 p-4 md:p-5 z-20 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                              <div className="text-[10px] text-gold-500 tracking-wider uppercase font-medium mb-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <Aperture className="w-3.5 h-3.5" />
                                {photo.camera}
                              </div>

                              <h3 className="text-sm md:text-base font-serif serif-heading text-white font-semibold leading-snug tracking-wide group-hover:text-gold-200 transition-colors duration-300 truncate">
                                {photo.title}
                              </h3>

                              <div className="h-px w-0 group-hover:w-full bg-gold-500/30 my-2 transition-all duration-500" />

                              <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                                <span className="text-[9px] text-gray-400 font-mono truncate max-w-[65%]">
                                  {photo.lens} • {photo.aperture} • {photo.shutter}
                                </span>
                                
                                <span className="text-[9px] flex items-center gap-1 text-gold-500/80 font-semibold tracking-wider uppercase flex-shrink-0">
                                  <Eye className="w-3.5 h-3.5" /> View Full
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
