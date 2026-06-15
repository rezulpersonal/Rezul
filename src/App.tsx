import React, { useState, useEffect, useCallback } from "react";
import { Camera, RefreshCw, AlertCircle } from "lucide-react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Gallery from "./components/Gallery";
import Lightbox from "./components/Lightbox";
import UploadModal from "./components/UploadModal";
import AboutContact from "./components/AboutContact";
import Footer from "./components/Footer";
import { Photo } from "./types";

export default function App() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Admin authentication state
  const [adminPasscode, setAdminPasscode] = useState<string | null>(() => {
    try {
      return localStorage.getItem("adminPasscode");
    } catch {
      return null;
    }
  });

  const handleLogin = (passcode: string) => {
    setAdminPasscode(passcode);
    try {
      localStorage.setItem("adminPasscode", passcode);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    setAdminPasscode(null);
    try {
      localStorage.removeItem("adminPasscode");
    } catch (e) {
      console.error(e);
    }
  };

  // Modal & Detail overlays states
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");

  // Fetch all photos from our Full-stack Dynamic Express backend
  const fetchPhotos = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch("/api/photos");
      if (!response.ok) {
        throw new Error("Failed to pull photographs registry from the atelier server.");
      }
      
      const data = await response.json();
      setPhotos(data);
    } catch (err: any) {
      console.error("Photos load error:", err);
      setError(err.message || "An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // ScrollSpy listener to update the active header nav link dynamically as users scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200; // Offset for headers

      const sections = ["hero", "gallery", "about", "contact"];
      
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle addition of a photo
  const handleUploadSuccess = (newPhoto: Photo) => {
    setPhotos((prev) => [newPhoto, ...prev]);
  };

  // Handle update of a photo in the registry
  const handlePhotoUpdate = (updatedPhoto: Photo) => {
    setPhotos((prev) => prev.map((p) => p.id === updatedPhoto.id ? updatedPhoto : p));
    
    // If the currently magnified/lightbox photo was updated, refresh details
    if (selectedPhoto && selectedPhoto.id === updatedPhoto.id) {
      setSelectedPhoto(updatedPhoto);
    }
  };

  // Handle deletion of a photo via backend
  const handleDeletePhoto = async (id: string) => {
    try {
      const response = await fetch(`/api/photos/${id}`, {
        method: "DELETE",
        headers: {
          "X-Admin-Passcode": adminPasscode || ""
        }
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to remove photo.");
      }

      // Remove from state instantly with transition
      setPhotos((prev) => prev.filter((photo) => photo.id !== id));
      
      // If we are deleting the photo which is active in details, close lightbox
      if (selectedPhoto && selectedPhoto.id === id) {
        setSelectedPhoto(null);
      }
    } catch (err: any) {
      alert(err.message || "An error occurred while deleting the artwork.");
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 text-white selection:bg-gold-500 selection:text-dark-950 antialiased font-sans flex flex-col justify-between">
      
      {/* Absolute background subtle star overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] z-[1]" />

      {/* Editorial floating vertical rail (desktop view only) */}
      <div 
        className="fixed bottom-24 left-12 flex flex-col gap-8 text-[10px] tracking-[0.2em] uppercase text-white/30 rotate-180 font-medium select-none z-40 hidden xl:flex"
        style={{ writingMode: "vertical-rl" }}
      >
        <span className="text-gold-500 font-bold border-r border-gold-500 pr-3">EXIBITOR</span>
        <span className="text-white/40">VIEWOREZ</span>
        <span className="text-white/20">REZUL RAGHAV</span>
      </div>

      {/* Header Sticky Navigation */}
      <Header
        onOpenUpload={() => setIsUploadOpen(true)}
        activeSection={activeSection}
      />

      <main className="flex-grow">
        {loading && photos.length === 0 ? (
          /* Initial Luxurious Loading Spinner */
          <div className="h-screen w-full flex flex-col items-center justify-center bg-dark-950 relative z-40">
            <div className="relative flex items-center justify-center mb-6">
              <div className="absolute w-16 h-16 border-t border-b-2 border-gold-500 rounded-full animate-spin" />
              <Camera className="w-6 h-6 text-gold-500 animate-pulse" />
            </div>
            
            <span className="text-xs uppercase tracking-[0.3em] text-gold-500/80 font-bold mb-1">
              Vieworez Showcase
            </span>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
              Loading High Resolution Archives...
            </span>
          </div>
        ) : error && photos.length === 0 ? (
          /* Error Fallback screen */
          <div className="h-screen w-full flex flex-col items-center justify-center bg-dark-950 px-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-serif serif-heading text-white font-medium mb-2">
              Failed to Synchronize Archives
            </h3>
            <p className="text-xs text-gray-400 max-w-sm mb-6 leading-relaxed">
              {error} Please confirm that the back-end Express database system is running correctly.
            </p>
            <button
              onClick={fetchPhotos}
              className="flex items-center gap-2 px-6 py-3 border border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-dark-950 font-sans text-xs font-bold uppercase tracking-widest rounded transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 animate-spin" style={{ animationDuration: "3s" }} />
              Retry Connection
            </button>
          </div>
        ) : (
          /* Fully assembled client sections */
          <>
            {/* Full-screen Hero cover */}
            <Hero photos={photos} />

            {/* Curated Grid Gallery with category tag selections */}
            <Gallery
              photos={photos}
              onPhotoSelect={(p) => setSelectedPhoto(p)}
              onDeletePhoto={handleDeletePhoto}
              isAdmin={!!adminPasscode}
            />

            {/* Unified Bio Information & Contact Inquiry forms */}
            <AboutContact />
          </>
        )}
      </main>

      {/* Copywrite and social handle bars */}
      <Footer onOpenUpload={() => setIsUploadOpen(true)} />

      {/* OVERLAY LAYERS */}

      {/* 1. Modal details lightbox */}
      <Lightbox
        photo={selectedPhoto}
        photos={photos}
        onClose={() => setSelectedPhoto(null)}
        onNavigate={(p) => setSelectedPhoto(p)}
      />

      {/* 2. Drag & drop file addition modal panel */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        adminPasscode={adminPasscode}
        onLogin={handleLogin}
        onLogout={handleLogout}
        photos={photos}
        onPhotoUpdate={handlePhotoUpdate}
        onDeletePhoto={handleDeletePhoto}
      />
    </div>
  );
}
