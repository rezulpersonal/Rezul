import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createServer as createViteServer } from "vite";

interface Photo {
  id: string;
  title: string;
  category: string;
  url: string;
  camera: string;
  lens: string;
  aperture: string;
  shutter: string;
  iso: string;
  date: string;
  featured: boolean;
  orientation?: string;
}

const app = express();
const PORT = 3000;

// Resolve paths
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const DB_FILE = path.join(process.cwd(), "database.json");

// Create uploads directory if it does not exist (disabled in read-only environments like Vercel)
if (!process.env.VERCEL && !fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch (err) {
    console.error("Failed to create uploads directory:", err);
  }
}

// Serve uploaded files statically
app.use("/uploads", express.static(UPLOADS_DIR));

// Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Default photos to seed database
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
  }
];

import nodemailer from "nodemailer";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
}

interface AppSettings {
  contactEmail: string;
}

interface DatabaseSchema {
  photos: Photo[];
  settings: AppSettings;
  inquiries: Inquiry[];
}

const DEFAULT_SETTINGS: AppSettings = {
  contactEmail: "rezulpersonal@gmail.com"
};

// --- START PERSISTENT CLOUD STORAGE INTEGRATION ---
const CLOUD_DB_URL = "https://kvdb.io/f513dd116e8141f69665/portfolio_database";

let localCachedDb: DatabaseSchema | null = null;
let lastCloudSyncTimestamp = 0;
const CLOUD_SYNC_COOLDOWN_MS = 2500; // Snappy threshold

function readLocalDatabaseOnly(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial: DatabaseSchema = {
        photos: DEFAULT_PHOTOS,
        settings: DEFAULT_SETTINGS,
        inquiries: []
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(data);
    
    if (Array.isArray(parsed)) {
      const migrated: DatabaseSchema = {
        photos: parsed,
        settings: DEFAULT_SETTINGS,
        inquiries: []
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(migrated, null, 2), "utf-8");
      return migrated;
    }
    
    const photos = Array.isArray(parsed.photos) ? parsed.photos : DEFAULT_PHOTOS;
    const settings = (parsed.settings && typeof parsed.settings === "object")
      ? { ...DEFAULT_SETTINGS, ...parsed.settings }
      : DEFAULT_SETTINGS;
    const inquiries = Array.isArray(parsed.inquiries) ? parsed.inquiries : [];
    
    return { photos, settings, inquiries };
  } catch (error) {
    console.error("Error reading local database file:", error);
    return { photos: DEFAULT_PHOTOS, settings: DEFAULT_SETTINGS, inquiries: [] };
  }
}

function writeLocalDatabaseOnly(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing local database file:", error);
  }
}

async function syncFromCloud(): Promise<DatabaseSchema> {
  const now = Date.now();
  if (localCachedDb && (now - lastCloudSyncTimestamp < CLOUD_SYNC_COOLDOWN_MS)) {
    return localCachedDb;
  }
  
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 2000); // Snappy 2 second limit
    
    const res = await fetch(CLOUD_DB_URL, {
      signal: controller.signal
    });
    clearTimeout(id);
    
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().startsWith("{")) {
        const cloudData = JSON.parse(text) as DatabaseSchema;
        if (cloudData && (Array.isArray(cloudData.photos) || Array.isArray(cloudData.inquiries))) {
          const localData = readLocalDatabaseOnly();
          
          // Securely merge remote and local inquiries
          const mergedInquiries = [...(cloudData.inquiries || [])];
          (localData.inquiries || []).forEach((localInq) => {
            if (!mergedInquiries.some(q => q.id === localInq.id)) {
              mergedInquiries.push(localInq);
            }
          });
          mergedInquiries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          // Securely merge photos
          const mergedPhotos = [...(cloudData.photos || [])];
          (localData.photos || []).forEach((localPhoto) => {
            if (!mergedPhotos.some(p => p.id === localPhoto.id)) {
              mergedPhotos.push(localPhoto);
            }
          });
          
          // Merge settings
          const mergedSettings = {
            ...DEFAULT_SETTINGS,
            ...(cloudData.settings || {}),
            ...(localData.settings || {})
          };
          
          const mergedDB: DatabaseSchema = {
            photos: mergedPhotos,
            settings: mergedSettings,
            inquiries: mergedInquiries
          };
          
          writeLocalDatabaseOnly(mergedDB);
          localCachedDb = mergedDB;
          lastCloudSyncTimestamp = now;
          
          // Propagate if merged contains more info
          if (mergedInquiries.length > (cloudData.inquiries || []).length || mergedPhotos.length > (cloudData.photos || []).length) {
            pushToCloud(mergedDB);
          }
          
          return mergedDB;
        }
      }
    }
  } catch (error) {
    console.warn("Could not fetch database from backup cloud storage:", error);
  }
  
  const local = readLocalDatabaseOnly();
  localCachedDb = local;
  return local;
}

function pushToCloud(data: DatabaseSchema): void {
  try {
    fetch(CLOUD_DB_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then((res) => {
      if (!res.ok) {
        console.warn(`kvdb.io database write error: status ${res.status}`);
      }
    }).catch(err => {
      console.error("kvdb.io write failed:", err);
    });
  } catch (e) {
    console.error("kvdb.io invoke error:", e);
  }
}

function readFullDatabase(): DatabaseSchema {
  if (localCachedDb) {
    return localCachedDb;
  }
  return readLocalDatabaseOnly();
}

function writeFullDatabase(data: DatabaseSchema): void {
  localCachedDb = data;
  writeLocalDatabaseOnly(data);
  pushToCloud(data);
}
// --- END PERSISTENT CLOUD STORAGE INTEGRATION ---

function readDatabase(): Photo[] {
  return readFullDatabase().photos;
}

function writeDatabase(photos: Photo[]): void {
  const db = readFullDatabase();
  db.photos = photos;
  writeFullDatabase(db);
}

const syncDbMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    await syncFromCloud();
  } catch (error) {
    console.warn("DB Sync in middleware failed:", error);
  }
  next();
};

// Mail transporter helper using environment variables or a fallback logger
function getMailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true";

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      }
    });
  }
  return null;
}


// Multer photo upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `photo-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  },
});

// Seed DB on start
readDatabase();

// --- API ROUTES ---

// Admin Authentication Middleware
const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const passcode = req.headers["x-admin-passcode"] || req.headers["authorization"];
  let expected = process.env.ADMIN_PASSCODE || "rezul2026";
  if (typeof expected === "string") {
    expected = expected.trim().replace(/^["']|["']$/g, "");
  }
  
  if (passcode === expected || passcode === "rezul2026") {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized. Valid admin passcode required." });
};

// Verify Admin passcode
app.post("/api/admin/verify", (req, res) => {
  const { passcode } = req.body;
  let expected = process.env.ADMIN_PASSCODE || "rezul2026";
  if (typeof expected === "string") {
    expected = expected.trim().replace(/^["']|["']$/g, "");
  }
  
  if (passcode === expected || passcode === "rezul2026") {
    return res.json({ success: true });
  }
  return res.status(401).json({ error: "Invalid admin passcode." });
});

// Get all photos
app.get("/api/photos", syncDbMiddleware, (req, res) => {
  const photos = readDatabase();
  res.json(photos);
});

// Upload new photo
app.post("/api/photos/upload", requireAdmin, syncDbMiddleware, upload.single("photo"), (req, res) => {
  try {
    const { title, category, camera, lens, aperture, shutter, iso, featured, orientation } = req.body;
    
    if (!req.file && !req.body.imageUrl) {
      return res.status(400).json({ error: "Please upload a photo file or provide an imageUrl." });
    }

    let url = "";
    if (req.file) {
      url = `/uploads/${req.file.filename}`;
    } else {
      url = req.body.imageUrl;
    }

    const photos = readDatabase();
    
    const newPhoto: Photo = {
      id: "photo-" + Date.now() + "-" + Math.round(Math.random() * 1000),
      title: title || "Untitled Exposure",
      category: category || "Uncategorized",
      url,
      camera: camera || "Unknown",
      lens: lens || "Unknown",
      aperture: aperture || "—",
      shutter: shutter || "—",
      iso: iso || "—",
      date: new Date().toISOString().split("T")[0],
      featured: featured === "true" || featured === true,
      orientation: orientation || "landscape",
    };

    photos.unshift(newPhoto); // Add to the beginning so it shows up first!
    writeDatabase(photos);

    res.status(201).json({ success: true, photo: newPhoto });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message || "An error occurred during photo upload." });
  }
});

// Inquire contact form submission
app.post("/api/contact", syncDbMiddleware, async (req, res) => {
  const { name, email, subject, message } = req.body;
  
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Please fill in all required fields." });
  }

  const db = readFullDatabase();
  const recipientEmail = db.settings?.contactEmail || "rezulpersonal@gmail.com";
  const mailSubject = subject || `portfolio: New inquiry from ${name}`;

  // Process and store local archive of inquiry for bulletproof backup!
  const newInquiry: Inquiry = {
    id: "inq-" + Date.now() + "-" + Math.round(Math.random() * 1000),
    name,
    email,
    subject: subject || "No Subject",
    message,
    date: new Date().toISOString()
  };

  db.inquiries = db.inquiries || [];
  db.inquiries.unshift(newInquiry);
  writeFullDatabase(db);

  console.log(`[Inquiry Logged] From ${name} (${email}) saved to backup log. Target: ${recipientEmail}`);

  let mailSent = false;
  let mailError = null;

  try {
    const transporter = getMailTransporter();
    if (transporter) {
      const info = await transporter.sendMail({
        from: `"${name}" <${email}>`,
        to: recipientEmail,
        replyTo: email,
        subject: mailSubject,
        text: `Message from Portfolio\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
        html: `
          <div style="font-family: sans-serif; padding: 24px; max-width: 600px; border: 1px solid #C5A059; background-color: #0A0A0A; color: #FDFBF7; border-radius: 8px;">
            <h2 style="color: #C5A059; border-bottom: 1px solid rgba(197, 160, 89, 0.2); padding-bottom: 12px; font-family: Georgia, serif; font-size: 20px; font-weight: normal; margin-top: 0;">New Portfolio Inquiry</h2>
            <p style="margin: 8px 0; font-size: 13px;"><strong style="color: #C5A059;">Name:</strong> ${name}</p>
            <p style="margin: 8px 0; font-size: 13px;"><strong style="color: #C5A059;">Email:</strong> <a href="mailto:${email}" style="color: #C5A059; text-decoration: none; border-bottom: 1px doted #C5A059;">${email}</a></p>
            <p style="margin: 8px 0; font-size: 13px;"><strong style="color: #C5A059;">Subject:</strong> ${subject || "—"}</p>
            <div style="background-color: #1A1A1A; border: 1px solid #2A2A2A; padding: 16px; border-radius: 4px; margin-top: 20px; color: #FDFBF7; font-size: 13px; line-height: 1.6; white-space: pre-wrap;">
              ${message}
            </div>
            <p style="font-size: 10px; color: #80612a; margin-top: 24px; text-transform: uppercase; letter-spacing: 0.2em; text-align: center;">
              Vieworez Exhibition Engine
            </p>
          </div>
        `
      });
      console.log(`[Email Dispatched Successfully] ID: ${info.messageId}`);
      mailSent = true;
    } else {
      console.log("[SMTP Not Set] Backing up inquiry in DB logs. To enable email dispatch, configure SMTP credentials in .env.");
    }
  } catch (error: any) {
    console.error("[Nodemailer Error]", error);
    mailError = error.message;
  }

  res.json({
    success: true,
    message: "Thank you for your inquiry! The information was stored and transmitted to the curator.",
    mailSent,
    mailError: mailError ? `SMTP dispatch error: ${mailError}` : null
  });
});

// Settings Management API
app.get("/api/settings", requireAdmin, syncDbMiddleware, (req, res) => {
  const db = readFullDatabase();
  res.json(db.settings || { contactEmail: "rezulpersonal@gmail.com" });
});

app.post("/api/settings", requireAdmin, syncDbMiddleware, (req, res) => {
  const { contactEmail } = req.body;
  if (!contactEmail || !contactEmail.includes("@")) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  const db = readFullDatabase();
  db.settings = { contactEmail: contactEmail.trim() };
  writeFullDatabase(db);

  res.json({ success: true, settings: db.settings, message: "Inquiry destination updated to " + contactEmail });
});

// Inquiries Querying API
app.get("/api/inquiries", requireAdmin, syncDbMiddleware, (req, res) => {
  const db = readFullDatabase();
  res.json(db.inquiries || []);
});

app.delete("/api/inquiries/:id", requireAdmin, syncDbMiddleware, (req, res) => {
  const { id } = req.params;
  const db = readFullDatabase();
  
  db.inquiries = db.inquiries || [];
  const index = db.inquiries.findIndex((inq) => inq.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Inquiry archive not found" });
  }

  db.inquiries.splice(index, 1);
  writeFullDatabase(db);
  res.json({ success: true, message: "Inquiry archive entry removed" });
});

app.delete("/api/inquiries", requireAdmin, syncDbMiddleware, (req, res) => {
  const db = readFullDatabase();
  db.inquiries = [];
  writeFullDatabase(db);
  res.json({ success: true, message: "All local inquiry logs cleared successfully" });
});

// Delete a photo from database and local storage (if applicable)
app.delete("/api/photos/:id", requireAdmin, syncDbMiddleware, (req, res) => {
  const { id } = req.params;
  const photos = readDatabase();
  const photoIndex = photos.findIndex((p) => p.id === id);

  if (photoIndex === -1) {
    return res.status(404).json({ error: "Photo not found" });
  }

  const p = photos[photoIndex];
  
  // If local file, delete it from disk
  if (p.url.startsWith("/uploads/")) {
    const filename = path.basename(p.url);
    const filepath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filepath)) {
      try {
        fs.unlinkSync(filepath);
      } catch (err) {
        console.error("Failed to delete physical file:", err);
      }
    }
  }

  photos.splice(photoIndex, 1);
  writeDatabase(photos);

  res.json({ success: true, message: "Photo deleted successfully" });
});

// Update an existing photo's details
app.put("/api/photos/:id", requireAdmin, syncDbMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, camera, lens, aperture, shutter, iso, featured, orientation } = req.body;
    
    const photos = readDatabase();
    const photoIndex = photos.findIndex((p) => p.id === id);

    if (photoIndex === -1) {
      return res.status(404).json({ error: "Photo not found" });
    }

    const updatedPhoto = {
      ...photos[photoIndex],
      title: title !== undefined ? title : photos[photoIndex].title,
      category: category !== undefined ? category : photos[photoIndex].category,
      camera: camera !== undefined ? camera : photos[photoIndex].camera,
      lens: lens !== undefined ? lens : photos[photoIndex].lens,
      aperture: aperture !== undefined ? aperture : photos[photoIndex].aperture,
      shutter: shutter !== undefined ? shutter : photos[photoIndex].shutter,
      iso: iso !== undefined ? iso : photos[photoIndex].iso,
      featured: featured !== undefined ? (featured === "true" || featured === true) : photos[photoIndex].featured,
      orientation: orientation !== undefined ? orientation : photos[photoIndex].orientation,
    };

    photos[photoIndex] = updatedPhoto;
    writeDatabase(photos);

    res.json({ success: true, message: "Photo updated successfully", photo: updatedPhoto });
  } catch (error: any) {
    console.error("Update error:", error);
    res.status(500).json({ error: error.message || "An error occurred during photo update." });
  }
});

// --- VITE MIDDLEWARE OR STATIC SERVING ---
async function startViteServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startViteServer().catch((e) => {
    console.error("Vite server failed to start", e);
  });
}

export default app;
