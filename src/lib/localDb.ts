import { Photo, Inquiry, AppSettings } from "../types";

const DEFAULT_PHOTOS: Photo[] = [
  {
    id: "seed-1",
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
    orientation: "landscape"
  },
  {
    id: "seed-2",
    title: "Rustique Patisserie",
    category: "Culinary",
    url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=1200",
    camera: "Fujifilm GFX 100S",
    lens: "80mm Prime",
    aperture: "f/2.0",
    shutter: "1/125s",
    iso: "160",
    date: "2026-06-03",
    featured: true,
    orientation: "landscape"
  },
  {
    id: "seed-3",
    title: "Ethereal Obsidian",
    category: "Landscape",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200",
    camera: "Canon EOS R5",
    lens: "24-70mm f/2.8",
    aperture: "f/8.0",
    shutter: "1/4s",
    iso: "64",
    date: "2026-06-05",
    featured: true,
    orientation: "landscape"
  },
  {
    id: "seed-4",
    title: "Midnight Aurora",
    category: "Landscape",
    url: "https://images.unsplash.com/photo-1579033461380-adb47c3eb938?auto=format&fit=crop&q=80&w=1200",
    camera: "Nikon Z7 II",
    lens: "14-24mm f/2.8",
    aperture: "f/2.8",
    shutter: "15s",
    iso: "1600",
    date: "2026-06-07",
    featured: false,
    orientation: "landscape"
  },
  {
    id: "seed-5",
    title: "Monolithic Shadows",
    category: "Architecture",
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200",
    camera: "Leica M11",
    lens: "35mm Summilux",
    aperture: "f/5.6",
    shutter: "1/500s",
    iso: "200",
    date: "2026-06-09",
    featured: false,
    orientation: "landscape"
  },
  {
    id: "seed-6",
    title: "Golden Hour Facade",
    category: "Architecture",
    url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1200",
    camera: "Sony A7R IV",
    lens: "24mm f/1.4",
    aperture: "f/4.0",
    shutter: "1/320s",
    iso: "100",
    date: "2026-06-11",
    featured: false,
    orientation: "landscape"
  },
  {
    id: "portrait-1",
    title: "Sunder Ban Silhouettes",
    category: "Portrait",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200",
    camera: "Canon R3",
    lens: "85mm f/1.2",
    aperture: "f/1.2",
    shutter: "1/200s",
    iso: "100",
    date: "2026-06-12",
    featured: true,
    orientation: "portrait"
  },
  {
    id: "portrait-2",
    title: "The Sculptor's Hands",
    category: "Portrait",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1200",
    camera: "Leica SL2",
    lens: "50mm APO",
    aperture: "f/2.0",
    shutter: "1/160s",
    iso: "400",
    date: "2026-06-13",
    featured: false,
    orientation: "portrait"
  }
];

const DEFAULT_SETTINGS: AppSettings = {
  contactEmail: "rezulpersonal@gmail.com"
};

export const localDb = {
  getPhotos(): Photo[] {
    try {
      const stored = localStorage.getItem("vieworez_photos");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Local photos read error:", e);
    }
    // Set seed if empty
    this.savePhotos(DEFAULT_PHOTOS);
    return DEFAULT_PHOTOS;
  },

  savePhotos(photos: Photo[]): void {
    try {
      localStorage.setItem("vieworez_photos", JSON.stringify(photos));
    } catch (e) {
      console.error("Local photos save error:", e);
    }
  },

  addPhoto(photo: Omit<Photo, "id" | "date">): Photo {
    const photos = this.getPhotos();
    const newPhoto: Photo = {
      ...photo,
      id: "photo-local-" + Date.now() + "-" + Math.round(Math.random() * 1000),
      date: new Date().toISOString().split("T")[0]
    };
    photos.unshift(newPhoto);
    this.savePhotos(photos);
    return newPhoto;
  },

  updatePhoto(id: string, updatedData: Partial<Photo>): Photo {
    const photos = this.getPhotos();
    const index = photos.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error("Artwork photo not found in local registry.");
    }
    const updated = {
      ...photos[index],
      ...updatedData
    };
    photos[index] = updated;
    this.savePhotos(photos);
    return updated;
  },

  deletePhoto(id: string): void {
    const photos = this.getPhotos();
    const filtered = photos.filter((p) => p.id !== id);
    this.savePhotos(filtered);
  },

  getSettings(): AppSettings {
    try {
      const stored = localStorage.getItem("vieworez_settings");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Local settings read error:", e);
    }
    this.saveSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  },

  saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem("vieworez_settings", JSON.stringify(settings));
    } catch (e) {
      console.error("Local settings save error:", e);
    }
  },

  getInquiries(): Inquiry[] {
    try {
      const stored = localStorage.getItem("vieworez_inquiries");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Local inquiries read error:", e);
    }
    return [];
  },

  saveInquiries(inquiries: Inquiry[]): void {
    try {
      localStorage.setItem("vieworez_inquiries", JSON.stringify(inquiries));
    } catch (e) {
      console.error("Local inquiries save error:", e);
    }
  },

  addInquiry(formData: Omit<Inquiry, "id" | "date">): Inquiry {
    const inquiries = this.getInquiries();
    const newInquiry: Inquiry = {
      ...formData,
      id: "inq-local-" + Date.now() + "-" + Math.round(Math.random() * 1000),
      date: new Date().toISOString()
    };
    inquiries.unshift(newInquiry);
    this.saveInquiries(inquiries);
    return newInquiry;
  },

  deleteInquiry(id: string): void {
    const inquiries = this.getInquiries();
    const filtered = inquiries.filter((inq) => inq.id !== id);
    this.saveInquiries(filtered);
  },

  clearAllInquiries(): void {
    this.saveInquiries([]);
  }
};
