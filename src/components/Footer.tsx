import React from "react";
import { ArrowUp, Instagram, Twitter, Mail, Camera, Heart } from "lucide-react";
import { motion } from "motion/react";

interface FooterProps {
  onOpenUpload: () => void;
}

export default function Footer({ onOpenUpload }: FooterProps) {
  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="bg-dark-950 border-t border-dark-800/80 py-16 px-6 md:px-12 text-gray-500 relative overflow-hidden">
      
      {/* Background soft lighting */}
      <div className="absolute bottom-0 left-[30%] w-80 h-40 bg-gold-500/3 rounded-full filter blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
        
        {/* Left: Branding */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-gold-500/80 animate-pulse" />
            <span className="text-sm font-semibold tracking-widest text-white uppercase font-sans">
              VIEWOREZ
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500/80 text-center md:text-left mt-1">
            © {new Date().getFullYear()} Fine Art Rezul • All Rights Reserved
          </p>
        </div>

        {/* Middle: Brand Core Categories */}
        <div className="flex gap-6 text-[10px] font-bold tracking-widest uppercase text-gray-500 hover:text-gray-400">
          <a href="#gallery" className="hover:text-gold-400 transition-colors">
            Portfolio
          </a>
          <span>•</span>
          <a href="#about" className="hover:text-gold-400 transition-colors">
            Rezul
          </a>
          <span>•</span>
          <a href="#contact" className="hover:text-gold-400 transition-colors">
            Inquire
          </a>
        </div>

        {/* Right: Social & Scroll down */}
        <div className="flex items-center gap-6">
          {/* Social Handles */}
          <div className="flex items-center gap-3">
            <a
              href="https://www.instagram.com/i_rezulraghav?igsh=MW9kNHE2bTM1dGEyMw=="
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram handle"
              className="p-2 border border-dark-800 hover:border-gold-500 hover:text-gold-500 bg-dark-900 rounded-lg transition-colors duration-300"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="#contact"
              aria-label="Mail address"
              className="p-2 border border-dark-800 hover:border-gold-500 hover:text-gold-500 bg-dark-900 rounded-lg transition-colors duration-300"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>

          <div className="w-px h-6 bg-dark-800" />

          {/* Elegant Back to Top button */}
          <button
            onClick={handleScrollToTop}
            className="p-3 border border-gold-500/20 hover:border-gold-500 bg-gold-500/5 hover:bg-gold-500 text-gold-500 hover:text-dark-950 rounded-lg transition-all duration-300 shadow-lg cursor-pointer transform hover:-translate-y-1"
            title="Scroll to summit"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Decorative tiny credit */}
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-dark-800/40 text-center flex items-center justify-center gap-2 text-[9px] tracking-wider uppercase text-gray-600/80 font-mono">
        <span>curated in India</span>
        <span>•</span>
        <span className="flex items-center gap-1">
          crafted with <Heart className="w-3 h-3 text-red-500/70" /> and light
        </span>
        <span>•</span>
        <button
          onClick={onOpenUpload}
          id="btn-nav-upload"
          className="text-gray-700 hover:text-gold-500 transition-colors uppercase font-mono tracking-widest cursor-pointer text-[9px]"
          title="Curator Access"
        >
          +AM
        </button>
      </div>
    </footer>
  );
}
