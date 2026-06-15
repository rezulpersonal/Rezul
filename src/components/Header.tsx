import React, { useState, useEffect } from "react";
import { Camera, Menu, X, PlusCircle, Instagram, Code, Mail } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HeaderProps {
  onOpenUpload: () => void;
  activeSection: string;
}

export default function Header({ onOpenUpload, activeSection }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const navItems = [
    { label: "Home", id: "hero" },
    { label: "Gallery", id: "gallery" },
    { label: "About", id: "about" }
  ];

  return (
    <header
      id="site-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
        isScrolled
          ? "bg-dark-950/90 backdrop-blur-md border-dark-800/80 py-4 shadow-xl"
          : "bg-transparent border-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => scrollToSection("hero")}
          id="btn-logo"
          className="flex items-center gap-4 group text-left cursor-pointer"
        >
          <div className="w-8 h-8 border border-gold-500 flex items-center justify-center rotate-45 group-hover:bg-gold-500/10 transition-colors duration-500">
            <span className="-rotate-45 text-[10px] font-bold text-gold-500 tracking-tight">VR</span>
          </div>
          <div>
            <span className="block font-serif text-xl tracking-tighter text-white group-hover:text-gold-200 transition-colors uppercase">
              VIEWOREZ
            </span>
            <span className="block text-[8px] tracking-[0.3em] text-gold-500/80 uppercase font-sans -mt-1 font-bold">
              EXIBITOR
            </span>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav id="nav-desktop" className="hidden md:flex items-center gap-10">
          <ul className="flex items-center gap-8 text-[11px] font-semibold tracking-widest uppercase">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => scrollToSection(item.id)}
                  className={`relative py-2 px-1 cursor-pointer transition-colors duration-300 font-sans tracking-widest ${
                    activeSection === item.id
                      ? "text-gold-500"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {item.label}
                  {activeSection === item.id && (
                    <motion.div
                      layoutId="activeDot"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold-500"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile Menu Trigger */}
        <div className="flex items-center gap-4 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            id="btn-mobile-toggle"
            className="p-2 border border-dark-800 bg-dark-900 text-gray-400 hover:text-white rounded-md cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-dark-800 bg-dark-950/95 backdrop-blur-lg overflow-hidden"
          >
            <div className="px-6 py-8 flex flex-col gap-6">
              <ul className="flex flex-col gap-4 text-xs font-semibold tracking-widest uppercase">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => scrollToSection(item.id)}
                      className={`block w-full text-left py-2 ${
                        activeSection === item.id ? "text-gold-500" : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
              
              {/* Social links inside mobile drawer */}
              <div className="flex items-center gap-4 justify-center pt-2">
                <a
                  href="https://www.instagram.com/i_rezulraghav?igsh=MW9kNHE2bTM1dGEyMw=="
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 border border-dark-800 rounded-full text-gray-500 hover:text-gold-500"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#" className="p-2 border border-dark-800 rounded-full text-gray-500 hover:text-gold-500">
                  <Code className="w-4 h-4" />
                </a>
                <a href="#" className="p-2 border border-dark-800 rounded-full text-gray-500 hover:text-gold-500">
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
