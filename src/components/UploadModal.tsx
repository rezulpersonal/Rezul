import React, { useState, useRef, DragEvent, ChangeEvent, useEffect } from "react";
import { X, Upload, Image, Sparkles, Check, HelpCircle, Eye, AlertCircle, Mail, Trash2, Calendar, MessageSquare, Settings, CheckCircle2, Camera } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Photo, Inquiry } from "../types";
import { localDb } from "../lib/localDb";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (newPhoto: Photo) => void;
  adminPasscode: string | null;
  onLogin: (passcode: string) => void;
  onLogout: () => void;
  photos: Photo[];
  onPhotoUpdate: (updatedPhoto: Photo) => void;
  onDeletePhoto: (id: string) => void;
}

export default function UploadModal({ 
  isOpen, 
  onClose, 
  onUploadSuccess, 
  adminPasscode, 
  onLogin, 
  onLogout,
  photos,
  onPhotoUpdate,
  onDeletePhoto
}: UploadModalProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "manage" | "settings" | "inquiries">("upload");
  const [contactEmail, setContactEmail] = useState("rezulpersonal@gmail.com");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [settingsError, setSettingsError] = useState("");

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);

  // Verification states
  const [passcodeInput, setPasscodeInput] = useState("");
  const [verifyingPasscode, setVerifyingPasscode] = useState(false);
  const [passcodeErrorMsg, setPasscodeErrorMsg] = useState("");

  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Landscape");
  const [customCategory, setCustomCategory] = useState("");
  const [camera, setCamera] = useState("");
  const [lens, setLens] = useState("");
  const [aperture, setAperture] = useState("");
  const [shutter, setShutter] = useState("");
  const [iso, setIso] = useState("");
  const [featured, setFeatured] = useState(false);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("landscape");
  
  // Photo Editing States
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("Landscape");
  const [editCustomCategory, setEditCustomCategory] = useState("");
  const [editCamera, setEditCamera] = useState("");
  const [editLens, setEditLens] = useState("");
  const [editAperture, setEditAperture] = useState("");
  const [editShutter, setEditShutter] = useState("");
  const [editIso, setEditIso] = useState("");
  const [editFeatured, setEditFeatured] = useState(false);
  const [editOrientation, setEditOrientation] = useState<"portrait" | "landscape">("landscape");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  
  // Deletion Confirmation States (No-modal iframe safe)
  const [confirmPhotoDeleteId, setConfirmPhotoDeleteId] = useState<string | null>(null);
  const [confirmInquiryDeleteId, setConfirmInquiryDeleteId] = useState<string | null>(null);
  const [confirmClearAllInquiries, setConfirmClearAllInquiries] = useState(false);
  
  // Image handling
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [urlOption, setUrlOption] = useState<"file" | "url">("file");
  const [externalUrl, setExternalUrl] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch settings & inquiries
  useEffect(() => {
    if (isOpen && adminPasscode) {
      fetchSettings();
      fetchInquiries();
    }
  }, [isOpen, adminPasscode]);

  useEffect(() => {
    const handleInquiryAdded = () => {
      if (adminPasscode) {
        fetchInquiries();
      }
    };
    window.addEventListener("vieworez_inquiry_added", handleInquiryAdded);
    return () => {
      window.removeEventListener("vieworez_inquiry_added", handleInquiryAdded);
    };
  }, [adminPasscode]);

  const handleVerifyPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcodeInput.trim()) {
      setPasscodeErrorMsg("Please supply a passcode.");
      return;
    }
    setVerifyingPasscode(true);
    setPasscodeErrorMsg("");
    try {
      const expectedPasscode = "rezul2026";
      
      // Asynchronously check backend first, but don't fail if server is down
      try {
        const res = await fetch("/api/admin/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ passcode: passcodeInput }),
        });
        if (res.ok) {
          onLogin(passcodeInput);
          setPasscodeInput("");
          setVerifyingPasscode(false);
          return;
        }
      } catch (backendError) {
        console.warn("Backend passcode verification skipped (offline mode):", backendError);
      }

      // Local offline passcode verification
      if (passcodeInput === expectedPasscode) {
        onLogin(passcodeInput);
        setPasscodeInput("");
      } else {
        setPasscodeErrorMsg("Incorrect curation passcode.");
      }
    } catch (err: any) {
      setPasscodeErrorMsg("Verification error: " + err.message);
    } finally {
      setVerifyingPasscode(false);
    }
  };

  const fetchSettings = async () => {
    if (!adminPasscode) return;
    try {
      // Load from local storage immediately (bulletproof offline mode)
      const data = localDb.getSettings();
      setContactEmail(data.contactEmail);

      // Async background sync with backend if available
      try {
        const res = await fetch("/api/settings", {
          headers: { "X-Admin-Passcode": adminPasscode }
        });
        if (res.ok) {
          const remoteData = await res.json();
          if (remoteData.contactEmail) {
            setContactEmail(remoteData.contactEmail);
            localDb.saveSettings({ contactEmail: remoteData.contactEmail });
          }
        }
      } catch (e) {
        console.log("No backend connection - operating in frontend mode.");
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    }
  };

  const fetchInquiries = async () => {
    if (!adminPasscode) return;
    setLoadingInquiries(true);
    try {
      // Load from local storage immediately (bulletproof offline mode)
      const data = localDb.getInquiries();
      setInquiries(data);

      // Async background sync with backend if available
      try {
        const res = await fetch("/api/inquiries", {
          headers: { "X-Admin-Passcode": adminPasscode }
        });
        if (res.ok) {
          const remoteInquiries = await res.json();
          if (Array.isArray(remoteInquiries)) {
            // Server database is the active source of truth.
            // This ensures deletion updates and new posts synchronization across all devices!
            setInquiries(remoteInquiries);
            localDb.saveInquiries(remoteInquiries);
          }
        } else {
          console.warn(`Server inquiries response not OK: status ${res.status}`);
        }
      } catch (e) {
        console.log("No backend connection or service error - operating in offline backup mode.");
      }
    } catch (err) {
      console.error("Error loading inquiries:", err);
    } finally {
      setLoadingInquiries(false);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess("");
    setSettingsError("");

    try {
      const email = contactEmail.trim();
      // Instantly save to local storage
      localDb.saveSettings({ contactEmail: email });
      setSettingsSuccess("Destination email changed successfully in local database Config!");
      setTimeout(() => setSettingsSuccess(""), 4000);

      // Async backend sync if alive
      try {
        const res = await fetch("/api/settings", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-Admin-Passcode": adminPasscode || ""
          },
          body: JSON.stringify({ contactEmail: email }),
        });
        if (res.ok) {
          const data = await res.json();
          setSettingsSuccess(data.message || "Destination email changed successfully!");
        }
      } catch (e) {
        console.log("No backend connection - operating in frontend-only mode.");
      }
    } catch (err: any) {
      setSettingsError(err.message || "Error updating email settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    try {
      // Instantly delete from local storage
      localDb.deleteInquiry(id);
      setInquiries(prev => prev.filter(inq => inq.id !== id));

      // Async backend sync if alive
      try {
        await fetch(`/api/inquiries/${id}`, { 
          method: "DELETE",
          headers: { "X-Admin-Passcode": adminPasscode || "" }
        });
      } catch (e) {
        console.log("No backend connection - operating in frontend-only mode.");
      }
    } catch (err) {
      console.error("Error deleting inquiry:", err);
    }
  };

  const handleClearAllInquiries = async () => {
    try {
      // Instantly delete from local storage
      localDb.clearAllInquiries();
      setInquiries([]);

      // Async backend sync if alive
      try {
        await fetch("/api/inquiries", { 
          method: "DELETE",
          headers: { "X-Admin-Passcode": adminPasscode || "" }
        });
      } catch (e) {
        console.log("No backend connection - operating in frontend-only mode.");
      }
    } catch (err) {
      console.error("Error clearing inquiries:", err);
    }
  };


  if (!isOpen) return null;

  // Drag handlers
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setFile(file);
      } else {
        setErrorMsg("Please upload an image file (PNG, JPG, WEBP).");
      }
    }
  };

  const fileSelected = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement("img");
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1400;
          const MAX_HEIGHT = 1400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          
          // Export with high-quality but compressed JPEG (0.82 value)
          const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
          resolve(dataUrl);
        };
        img.onerror = (err) => {
          reject(err);
        };
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const setFile = (file: File) => {
    setSelectedFile(file);
    setErrorMsg("");
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setUrlOption("url");
    setExternalUrl(preset.url);
    setImagePreview(preset.url);
    setTitle(preset.title);
    setCategory(preset.category);
    setCamera(preset.camera);
    setLens(preset.lens);
    setAperture(preset.aperture);
    setShutter(preset.shutter);
    setIso(preset.iso);
    setFeatured(preset.featured);
    setSelectedFile(null);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (urlOption === "file" && !selectedFile) {
      setErrorMsg("Please select or drop an image file.");
      return;
    }

    if (urlOption === "url" && !externalUrl) {
      setErrorMsg("Please input an external photo image URL.");
      return;
    }

    setUploading(true);

    try {
      const finalCategory = category === "Custom" ? customCategory : category;
      let finalImageUrl = "";

      if (urlOption === "file" && selectedFile) {
        // Compress image to optimized Base64
        finalImageUrl = await compressImage(selectedFile);
      } else {
        finalImageUrl = externalUrl;
      }

      // Create new photo metadata payload
      const photoPayload = {
        title: title || "Untitled Exposure",
        category: finalCategory || "Uncategorized",
        camera: camera || "Sony A7R IV",
        lens: lens || "Zenith 50mm Prime",
        aperture: aperture || "f/2.8",
        shutter: shutter || "1/100s",
        iso: iso || "100",
        featured,
        url: finalImageUrl,
        orientation
      };

      // 1. Instantly write to local storage (perfect frontend mode!)
      const localNewPhoto = localDb.addPhoto(photoPayload);
      
      setSuccess(true);
      onUploadSuccess(localNewPhoto);

      // 2. Short delay, then close Modal (optimistic layout response)
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1500);

      // 3. Asynchronously attempt backend upload sync in background
      try {
        await fetch("/api/photos/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Passcode": adminPasscode || ""
          },
          body: JSON.stringify({
            ...photoPayload,
            imageUrl: finalImageUrl
          })
        });
      } catch (backendError) {
        console.warn("Backend upload skipped (running in frontend-only mode):", backendError);
      }

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred while uploading.");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setCategory("Landscape");
    setCustomCategory("");
    setCamera("");
    setLens("");
    setAperture("");
    setShutter("");
    setIso("");
    setFeatured(false);
    setOrientation("landscape");
    setSelectedFile(null);
    setImagePreview(null);
    setExternalUrl("");
    setSuccess(false);
    setErrorMsg("");
  };

  const startEditingPhoto = (photo: Photo) => {
    setEditingPhotoId(photo.id);
    setEditTitle(photo.title);
    setEditCamera(photo.camera);
    setEditLens(photo.lens);
    setEditAperture(photo.aperture);
    setEditShutter(photo.shutter);
    setEditIso(photo.iso);
    setEditFeatured(photo.featured);
    setEditOrientation(photo.orientation || "landscape");

    const categoryPresets = ["Landscape", "Portrait", "Street & Urban", "Wildlife", "Astrophotography", "Macro & CloseUp", "Minimalist"];
    if (categoryPresets.includes(photo.category)) {
      setEditCategory(photo.category);
      setEditCustomCategory("");
    } else {
      setEditCategory("Custom");
      setEditCustomCategory(photo.category);
    }
    setEditError("");
    setEditSuccess("");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhotoId) return;

    setSavingEdit(true);
    setEditError("");
    setEditSuccess("");

    try {
      const finalCategory = editCategory === "Custom" ? editCustomCategory : editCategory;
      
      const updatePayload = {
        title: editTitle || "Untitled Exposure",
        category: finalCategory || "Uncategorized",
        camera: editCamera || "Unknown",
        lens: editLens || "Unknown",
        aperture: editAperture || "—",
        shutter: editShutter || "—",
        iso: editIso || "—",
        featured: editFeatured,
        orientation: editOrientation
      };

      // 1. Instantly save to local storage (perfect frontend mode)
      const updatedPhoto = localDb.updatePhoto(editingPhotoId, updatePayload);

      setEditSuccess("Photo details updated successfully in local archive database!");
      onPhotoUpdate(updatedPhoto);
      
      // Delay slightly and return to list
      setTimeout(() => {
        setEditingPhotoId(null);
        setEditSuccess("");
      }, 1500);

      // 2. Asynchronously Sync to backend if active
      try {
        await fetch(`/api/photos/${editingPhotoId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Passcode": adminPasscode || ""
          },
          body: JSON.stringify(updatePayload)
        });
      } catch (backendError) {
        console.warn("Backend edit sync skipped (running in frontend-only mode):", backendError);
      }

    } catch (err: any) {
      console.error(err);
      setEditError(err.message || "An error occurred while updating.");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/85 backdrop-blur-md p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.94, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.94, y: 20 }}
          transition={{ duration: 0.4 }}
          className="bg-dark-900 border border-dark-800 rounded-xl max-w-3xl w-full p-6 md:p-8 relative shadow-2xl overflow-y-auto max-h-[90vh]"
        >
          {/* Close button */}
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-dark-950 border border-dark-800 rounded-lg hover:border-gold-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Title and descriptions */}
          <div className="mb-6 flex gap-3 items-center justify-between pb-4 border-b border-dark-800/60 mr-12">
            <div className="flex gap-3 items-center">
              <div className="p-2 bg-gold-500/10 border border-gold-500/20 text-gold-500 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-serif serif-heading text-white uppercase tracking-wider">
                  Exhibition Dashboard
                </h2>
                <p className="text-[11px] text-gray-400 mt-0.5 tracking-wide">
                  Publish photography, change contact recipient, or inspect backup client communications.
                </p>
              </div>
            </div>
            {adminPasscode && (
              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-1.5 border border-red-500/30 hover:border-red-500 text-red-550 hover:text-red-400 hover:bg-red-500/10 text-[10px] font-bold tracking-widest uppercase transition-colors rounded-lg bg-dark-950 flex-shrink-0 cursor-pointer"
              >
                Logout
              </button>
            )}
          </div>

          {!adminPasscode ? (
            <div className="py-10 flex flex-col items-center justify-center max-w-sm mx-auto text-center">
              <div className="w-12 h-12 bg-dark-950 border border-dark-800 rounded-full flex items-center justify-center text-sm mb-4">
                🔑
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-1 font-serif">
                Curator Entry Only
              </h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-6">
                Please enter your curation passcode to unlock dashboard features.
              </p>

              {passcodeErrorMsg && (
                <div className="w-full mb-4 p-3.5 bg-red-950/20 border border-red-900/60 text-red-400 rounded-lg text-xs text-left">
                  {passcodeErrorMsg}
                </div>
              )}

              <form onSubmit={handleVerifyPasscode} className="w-full flex flex-col gap-3">
                <input
                  type="password"
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  placeholder="Passcode..."
                  autoFocus
                  className="w-full px-4 py-3 bg-dark-950 border border-dark-800 hover:border-dark-700 focus:border-gold-500 text-white rounded-lg text-xs tracking-widest focus:outline-none transition-all text-center font-mono"
                />
                <button
                  type="submit"
                  disabled={verifyingPasscode}
                  className="w-full py-3 bg-gold-500 disabled:opacity-50 text-dark-950 rounded-lg text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-gold-400 transition-colors cursor-pointer"
                >
                  {verifyingPasscode ? "Verifying..." : "Access Dashboard"}
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Admin tabs */}
          <div className="flex border-b border-dark-800/80 mb-6 gap-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab("upload");
                setErrorMsg("");
              }}
              className={`pb-3 text-xs font-bold uppercase tracking-widest relative cursor-pointer transition-colors ${
                activeTab === "upload" ? "text-gold-500 font-extrabold" : "text-gray-400 hover:text-white"
              }`}
            >
              {activeTab === "upload" && (
                <motion.div layoutId="modalTabBorder" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-500" />
              )}
              Publish Photo
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("manage");
                setEditingPhotoId(null);
                setEditError("");
                setEditSuccess("");
              }}
              className={`pb-3 text-xs font-bold uppercase tracking-widest relative cursor-pointer transition-colors flex items-center gap-2 ${
                activeTab === "manage" ? "text-gold-500 font-extrabold" : "text-gray-400 hover:text-white"
              }`}
            >
              {activeTab === "manage" && (
                <motion.div layoutId="modalTabBorder" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-500" />
              )}
              Manage Photos
              {photos.length > 0 && (
                <span className="bg-gold-500/10 text-gold-500 border border-gold-500/20 text-[9px] px-1.5 py-0.5 rounded-full font-mono">
                  {photos.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`pb-3 text-xs font-bold uppercase tracking-widest relative cursor-pointer transition-colors ${
                activeTab === "settings" ? "text-gold-500 font-extrabold" : "text-gray-400 hover:text-white"
              }`}
            >
              {activeTab === "settings" && (
                <motion.div layoutId="modalTabBorder" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-500" />
              )}
              Email Settings
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("inquiries");
                fetchInquiries();
              }}
              className={`pb-3 text-xs font-bold uppercase tracking-widest relative cursor-pointer transition-colors flex items-center gap-2 ${
                activeTab === "inquiries" ? "text-gold-500 font-extrabold" : "text-gray-400 hover:text-white"
              }`}
            >
              {activeTab === "inquiries" && (
                <motion.div layoutId="modalTabBorder" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-500" />
              )}
              Inquiries Log
              {inquiries.length > 0 && (
                <span className="bg-gold-500/10 text-gold-500 border border-gold-500/20 text-[9px] px-1.5 py-0.5 rounded-full font-mono">
                  {inquiries.length}
                </span>
              )}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "upload" && (
              <motion.div
                key="upload-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {errorMsg && (
                  <div className="mb-5 p-3.5 bg-red-950/40 border border-red-900/60 text-red-400 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  {/* Left Column: Image Selector & Previews (5 Cols) */}
                  <div className="md:col-span-5 flex flex-col gap-4">
                    {/* Option tab toggle: File uploads vs External URLs */}
                    <div className="grid grid-cols-2 bg-dark-950 p-1 rounded-sm border border-dark-800/80">
                      <button
                        type="button"
                        onClick={() => {
                          setUrlOption("file");
                          setErrorMsg("");
                        }}
                        className={`py-1.5 text-[9px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                          urlOption === "file"
                            ? "bg-gold-500 text-dark-950"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        File Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUrlOption("url");
                          setErrorMsg("");
                        }}
                        className={`py-1.5 text-[9px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                          urlOption === "url"
                            ? "bg-gold-500 text-dark-950"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Image URL
                      </button>
                    </div>

                    {urlOption === "file" ? (
                      /* Drag & Drop zone */
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={triggerFileInput}
                        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 h-64 text-center cursor-pointer transition-all ${
                          imagePreview
                            ? "border-dark-800 hover:border-gold-500/50"
                            : "border-dark-800 hover:border-gold-500"
                        } ${dragActive ? "border-gold-500 bg-gold-500/5 scale-102" : "bg-dark-950/40"}`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={fileSelected}
                          className="hidden"
                        />

                        {imagePreview ? (
                          /* Instant Previews */
                          <div className="absolute inset-0 w-full h-full p-2">
                            <div className="absolute top-2.5 right-2.5 z-10 p-1.5 bg-dark-950/90 text-gold-400 border border-gold-500/20 rounded-md text-[9px] font-bold tracking-wider uppercase flex items-center gap-1">
                              <Eye className="w-3 h-3" /> Preview Ready
                            </div>
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-full object-cover rounded-md"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="p-3 bg-dark-900 border border-dark-800 text-gray-400 rounded-full mb-3 group-hover:text-gold-500 transition-colors">
                              <Upload className="w-6 h-6 text-gold-500/70" />
                            </div>
                            <span className="text-[11px] font-semibold text-white tracking-wide uppercase">
                              Drag & Drop Capture
                            </span>
                            <span className="text-[9px] text-gray-500 mt-1 uppercase tracking-wider">
                              Or click to browse storage
                            </span>
                            <span className="text-[8px] text-gray-600 mt-4 font-mono">
                              PNG, JPEG, WEBP UP TO 10MB
                            </span>
                          </>
                        )}
                      </div>
                    ) : (
                      /* External Web URLs */
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                            External Image Address (URL)
                          </label>
                          <input
                            type="url"
                            placeholder="https://images.unsplash.com/photo-..."
                            value={externalUrl}
                            onChange={(e) => {
                              setExternalUrl(e.target.value);
                              setImagePreview(e.target.value);
                            }}
                            className="border border-dark-800 focus:border-gold-500 focus:outline-none bg-dark-950 rounded px-3 py-2 text-xs font-mono w-full"
                          />
                        </div>

                        {imagePreview ? (
                          <div className="relative border border-dark-800 rounded-lg p-1.5 h-48 bg-dark-950">
                            <img
                              src={imagePreview}
                              alt="Preview link"
                              onError={() => setImagePreview(null)}
                              className="w-full h-full object-cover rounded"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <div className="border border-dark-800 border-dashed rounded-lg p-6 h-48 flex flex-col items-center justify-center text-center bg-dark-950/20 text-gray-500">
                            <Image className="w-7 h-7 mb-2 text-dark-800" />
                            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-600">
                              Live Preview Window
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* One-Click Photography Presets Panel */}
                    <div className="p-3.5 border border-dark-800/80 bg-dark-950/40 rounded-lg">
                      <div className="text-[10px] font-bold tracking-[0.15em] text-gold-500 uppercase mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-gold-400" /> Curated Photo Presets
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => applyPreset(preset)}
                            className="group relative h-11 w-full overflow-hidden rounded-md border border-dark-800 hover:border-gold-500/80 transition-all cursor-pointer bg-dark-900"
                            title={`Instantly load ${preset.title} Preset`}
                          >
                            <img
                              src={preset.url}
                              alt={preset.title}
                              className="w-full h-full object-cover opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-dark-950/90 via-dark-950/40 to-transparent flex items-end justify-center p-0.5">
                              <span className="text-[7.5px] font-medium text-gray-300 group-hover:text-gold-200 uppercase tracking-wider truncate max-w-full">
                                {preset.title}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                      <p className="text-[8px] text-gray-500 uppercase tracking-widest mt-2 leading-tight text-center">
                        Choose a preset to instantly import exquisite artwork metadata
                      </p>
                    </div>

                    {/* Slide toggle for featured selection */}
                    <label className="flex items-center justify-between p-3.5 border border-dark-800/80 bg-dark-950/40 rounded-lg cursor-pointer hover:border-dark-700 transition-colors">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                          Feature in Hero Carousel
                        </span>
                        <span className="text-[8px] text-gray-500 uppercase tracking-widest leading-none">
                          Cycle inside fullscreen homepage slider
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={featured}
                        onChange={(e) => setFeatured(e.target.checked)}
                        className="rounded border-dark-800 focus:ring-0 checked:bg-gold-500 text-gold-500 h-4.5 w-4.5 bg-dark-950 cursor-pointer"
                      />
                    </label>
                  </div>

                  {/* Right Column: Parameters & Metadata Form (7 Cols) */}
                  <div className="md:col-span-7 flex flex-col gap-4">
                    {/* Photo Title */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                        Masterpiece Title
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Saffron Whispers"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="border border-dark-800 focus:border-gold-500 focus:outline-none bg-dark-950 rounded px-3 py-2 text-xs text-white"
                      />
                    </div>

                    {/* Categorization & Category */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                          Category Tag
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="border border-dark-800 focus:border-gold-500 focus:outline-none bg-dark-950 rounded px-2.5 py-2 text-xs text-white cursor-pointer"
                        >
                          <option value="Landscape">Landscape</option>
                          <option value="Culinary">Culinary</option>
                          <option value="Architecture">Architecture</option>
                          <option value="Portrait">Portrait</option>
                          <option value="Street">Street</option>
                          <option value="Custom">Custom category...</option>
                        </select>
                      </div>

                      {category === "Custom" && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-gold-400 flex items-center gap-1 animate-pulse">
                            New Category Name
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Astrophotography"
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            className="border border-gold-500/30 focus:border-gold-500 focus:outline-none bg-dark-950 rounded px-3 py-2 text-xs text-white"
                          />
                        </div>
                      )}
                    </div>

                    {/* Picture Proportion Selectors */}
                    <div className="flex flex-col gap-1.5 ">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                        Picture Proportion (Orientation)
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setOrientation("portrait")}
                          className={`flex items-center justify-center gap-2 py-2 px-3 text-xs tracking-wider uppercase font-semibold border rounded transition-all cursor-pointer ${
                            orientation === "portrait"
                              ? "bg-gold-500/15 border-gold-500 text-gold-500 font-bold"
                              : "bg-dark-950 border-dark-800 text-gray-400 hover:border-gray-700 hover:text-white"
                          }`}
                        >
                          <span className="w-2 h-3.5 border border-current block rounded-[1px] bg-transparent" />
                          Portrait
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrientation("landscape")}
                          className={`flex items-center justify-center gap-2 py-2 px-3 text-xs tracking-wider uppercase font-semibold border rounded transition-all cursor-pointer ${
                            orientation === "landscape"
                              ? "bg-gold-500/15 border-gold-500 text-gold-500 font-bold"
                              : "bg-dark-950 border-dark-800 text-gray-400 hover:border-gray-700 hover:text-white"
                          }`}
                        >
                          <span className="w-3.5 h-2 border border-current block rounded-[1px] bg-transparent" />
                          Landscape
                        </button>
                      </div>
                    </div>

                    {/* Subheader parameters */}
                    <div className="h-px bg-dark-800 my-1" />
                    <div className="text-[9px] font-bold tracking-[0.2em] text-gold-500/80 uppercase">
                      Hardware & Exposure parameters (EXIF)
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Camera Body */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-bold uppercase tracking-wider text-gray-500">
                          Camera Model
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Sony A7R V"
                          value={camera}
                          onChange={(e) => setCamera(e.target.value)}
                          className="border border-dark-800 focus:border-gold-500 focus:outline-none bg-dark-950 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                        />
                      </div>

                      {/* Lens Optic */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-bold uppercase tracking-wider text-gray-500">
                          Lens/Focal Length
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. FE 85mm f/1.4 GM"
                          value={lens}
                          onChange={(e) => setLens(e.target.value)}
                          className="border border-dark-800 focus:border-gold-500 focus:outline-none bg-dark-950 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                        />
                      </div>
                    </div>

                    {/* Triad settings */}
                    <div className="grid grid-cols-3 gap-3">
                      {/* Aperture */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-bold uppercase tracking-wider text-gray-500">
                          Aperture
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. f/1.8"
                          value={aperture}
                          onChange={(e) => setAperture(e.target.value)}
                          className="border border-dark-800 focus:border-gold-500 focus:outline-none bg-dark-950 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                        />
                      </div>

                      {/* Shutter Speed */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-bold uppercase tracking-wider text-gray-500">
                          Shutter Speed
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 1/200s"
                          value={shutter}
                          onChange={(e) => setShutter(e.target.value)}
                          className="border border-dark-800 focus:border-gold-500 focus:outline-none bg-dark-950 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                        />
                      </div>

                      {/* ISO */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-bold uppercase tracking-wider text-gray-500">
                          ISO Value
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 100"
                          value={iso}
                          onChange={(e) => setIso(e.target.value)}
                          className="border border-dark-800 focus:border-gold-500 focus:outline-none bg-dark-950 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-6 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          resetForm();
                          onClose();
                        }}
                        className="px-5 py-2.5 bg-transparent hover:bg-dark-950 text-gray-400 hover:text-white border border-dark-800 rounded text-[10px] font-bold tracking-widest uppercase transition-colors cursor-pointer"
                        disabled={uploading}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={uploading || success}
                        className={`px-6 py-2.5 rounded text-[10px] font-bold tracking-widest uppercase border transition-all flex items-center gap-2 cursor-pointer ${
                          success
                            ? "bg-emerald-500 border-emerald-500 text-dark-950"
                            : "bg-gold-500 border-gold-500 text-dark-950 hover:bg-gold-600 hover:shadow-gold-500/10 hover:shadow-lg"
                        }`}
                      >
                        {uploading ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-dark-950 border-t-transparent rounded-full animate-spin" />
                            Publishing...
                          </>
                        ) : success ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Published!
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            Publish Masterpiece
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}

            {activeTab === "manage" && (
              <motion.div
                key="manage-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 py-4"
              >
                {editingPhotoId ? (
                  /* Edit Form Mode */
                  <div>
                    <div className="flex items-center justify-between mb-4 border-b border-dark-800 pb-2">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-gold-500 flex items-center gap-2">
                        <span>Editing Photo Details</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => setEditingPhotoId(null)}
                        className="px-3 py-1 bg-dark-950 border border-dark-800 hover:border-gold-500 text-gray-400 hover:text-white rounded text-[10px] uppercase font-bold tracking-wider transition-all"
                      >
                        Back to List
                      </button>
                    </div>

                    {editError && (
                      <div className="mb-5 p-3.5 bg-red-950/40 border border-red-900/60 text-red-400 rounded-lg text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{editError}</span>
                      </div>
                    )}

                    {editSuccess && (
                      <div className="mb-5 p-3.5 bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 rounded-lg text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        <span>{editSuccess}</span>
                      </div>
                    )}

                    <form onSubmit={handleEditSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-8">
                      {/* Left thumbnail column (no crop) */}
                      <div className="md:col-span-4 flex flex-col gap-4">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                          Photo Thumbnail (Aspect Preserved)
                        </label>
                        <div className="bg-dark-950 border border-dark-800 rounded-lg h-56 flex items-center justify-center p-2 relative overflow-hidden">
                          {(() => {
                            const currentPhoto = photos.find(p => p.id === editingPhotoId);
                            if (currentPhoto) {
                              return (
                                <img
                                  src={currentPhoto.url}
                                  alt={currentPhoto.title}
                                  className="max-w-full max-h-full object-contain rounded"
                                  referrerPolicy="no-referrer"
                                />
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>

                      {/* Right metadata fields column */}
                      <div className="md:col-span-8 flex flex-col gap-4">
                        {/* Title & Category Row */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                              Title
                            </label>
                            <input
                              type="text"
                              required
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="border border-dark-800/80 focus:border-gold-500 focus:outline-none bg-dark-950 rounded px-3 py-2 text-xs text-white shadow-sm"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                              Category
                            </label>
                            <select
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="border border-dark-800/80 focus:border-gold-500 focus:outline-none bg-dark-950 rounded px-3 py-2 text-xs text-white cursor-pointer shadow-sm"
                            >
                              <option value="Landscape">Landscape</option>
                              <option value="Portrait">Portrait</option>
                              <option value="Street & Urban">Street & Urban</option>
                              <option value="Wildlife">Wildlife</option>
                              <option value="Astrophotography">Astrophotography</option>
                              <option value="Macro & CloseUp">Macro & CloseUp</option>
                              <option value="Minimalist">Minimalist</option>
                              <option value="Custom">Custom Group Name</option>
                            </select>
                          </div>
                        </div>

                        {editCategory === "Custom" && (
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-gold-500/80">
                              Specify Custom Category
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Fine Art Monochromatic"
                              value={editCustomCategory}
                              onChange={(e) => setEditCustomCategory(e.target.value)}
                              className="border border-gold-500/30 focus:border-gold-500 focus:outline-none bg-dark-950 rounded px-3 py-2 text-xs text-white shadow-sm"
                            />
                          </div>
                        )}

                        {/* Portrait / Landscape Selector */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                            Picture Proportion (Orientation)
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setEditOrientation("portrait")}
                              className={`flex items-center justify-center gap-2 py-2 px-3 text-xs tracking-wider uppercase font-semibold border rounded transition-all cursor-pointer ${
                                editOrientation === "portrait"
                                  ? "bg-gold-500/15 border-gold-500 text-gold-500 font-bold"
                                  : "bg-dark-950 border-dark-800 text-gray-400 hover:border-gray-700 hover:text-white"
                              }`}
                            >
                              <span className="w-2 h-3.5 border border-current block rounded-[1px] bg-transparent" />
                              Portrait
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditOrientation("landscape")}
                              className={`flex items-center justify-center gap-2 py-2 px-3 text-xs tracking-wider uppercase font-semibold border rounded transition-all cursor-pointer ${
                                editOrientation === "landscape"
                                  ? "bg-gold-500/15 border-gold-500 text-gold-500 font-bold"
                                  : "bg-dark-950 border-dark-800 text-gray-400 hover:border-gray-700 hover:text-white"
                              }`}
                            >
                              <span className="w-3.5 h-2 border border-current block rounded-[1px] bg-transparent" />
                              Landscape
                            </button>
                          </div>
                        </div>

                        {/* EXIF parameters */}
                        <div className="h-px bg-dark-800 my-1" />
                        <div className="text-[9px] font-bold tracking-[0.2em] text-gold-500/80 uppercase">
                          Hardware & Exposure parameters (EXIF)
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] font-bold uppercase tracking-wider text-gray-500">
                              Camera Model
                            </label>
                            <input
                              type="text"
                              value={editCamera}
                              onChange={(e) => setEditCamera(e.target.value)}
                              className="border border-dark-800 focus:border-gold-500 focus:outline-none bg-dark-950 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] font-bold uppercase tracking-wider text-gray-500">
                              Lens/Focal Length
                            </label>
                            <input
                              type="text"
                              value={editLens}
                              onChange={(e) => setEditLens(e.target.value)}
                              className="border border-dark-800 focus:border-gold-500 focus:outline-none bg-dark-950 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] font-bold uppercase tracking-wider text-gray-500">
                              Aperture
                            </label>
                            <input
                              type="text"
                              value={editAperture}
                              onChange={(e) => setEditAperture(e.target.value)}
                              className="border border-dark-800 focus:border-gold-500 focus:outline-none bg-dark-950 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] font-bold uppercase tracking-wider text-gray-500">
                              Shutter Speed
                            </label>
                            <input
                              type="text"
                              value={editShutter}
                              onChange={(e) => setEditShutter(e.target.value)}
                              className="border border-dark-800 focus:border-gold-500 focus:outline-none bg-dark-950 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] font-bold uppercase tracking-wider text-gray-500">
                              ISO Value
                            </label>
                            <input
                              type="text"
                              value={editIso}
                              onChange={(e) => setEditIso(e.target.value)}
                              className="border border-dark-800 focus:border-gold-500 focus:outline-none bg-dark-950 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                            />
                          </div>
                        </div>

                        {/* Feature Banner Option */}
                        <div className="flex items-center gap-3 bg-dark-950 border border-dark-800 p-3 rounded-lg hover:border-gold-500/30 transition-all cursor-pointer" onClick={() => setEditFeatured(!editFeatured)}>
                          <input
                            type="checkbox"
                            id="editFeatured"
                            checked={editFeatured}
                            onChange={(e) => setEditFeatured(e.target.checked)}
                            className="rounded border-dark-800 text-gold-500 focus:ring-gold-500 bg-dark-900 cursor-pointer"
                          />
                          <div className="flex flex-col select-none">
                            <span className="text-[10px] font-bold uppercase text-white tracking-widest flex items-center gap-1.5">
                              ⭐ Feature Highlight (Hero Header Slide)
                            </span>
                            <span className="text-[8px] text-gray-500 uppercase tracking-widest mt-0.5">
                              Tick this box to render this artwork inside the primary landing banner slide.
                            </span>
                          </div>
                        </div>

                        {/* Form controls */}
                        <div className="mt-4 flex items-center justify-end gap-3 pb-8">
                          <button
                            type="button"
                            onClick={() => setEditingPhotoId(null)}
                            className="px-5 py-2 bg-transparent hover:bg-dark-950 text-gray-400 hover:text-white border border-dark-800 rounded text-[10px] font-bold tracking-widest uppercase transition-colors"
                            disabled={savingEdit}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={savingEdit}
                            className="px-6 py-2 bg-gold-500 hover:bg-gold-600 font-bold uppercase tracking-widest text-dark-950 text-[10px] rounded flex items-center gap-2 transition-all cursor-pointer"
                          >
                            {savingEdit ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                ) : (
                  /* Photo List/Directory Mode */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-dark-950/60 p-4 border border-dark-800 rounded-lg">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gold-500 flex items-center gap-2">
                          <Image className="w-4 h-4 text-gold-500" />
                          Archives Registry ({photos.length})
                        </h3>
                        <p className="text-[10px] text-gray-400 mt-0.5 tracking-wide">
                          Select any published exposure to modify its catalog labels or hardware parameters.
                        </p>
                      </div>
                    </div>

                    {photos.length === 0 ? (
                      <div className="py-12 border border-dashed border-dark-800/80 rounded-xl text-center text-gray-400">
                        <Camera className="w-8 h-8 text-dark-700 mx-auto mb-3" />
                        <span className="text-xs uppercase tracking-widest text-gray-500">No photos published yet</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 divide-y divide-dark-800/55 max-h-[50vh] overflow-y-auto pr-1">
                        {photos.map((photo) => (
                          <div key={photo.id} className="py-4 flex gap-4 items-center justify-between group">
                            <div className="flex gap-4 items-center min-w-0">
                              {/* Photo thumbnail - no crop representation */}
                              <div className="w-14 h-14 bg-dark-950 border border-dark-800 rounded flex items-center justify-center overflow-hidden flex-shrink-0 p-1">
                                <img
                                  src={photo.url}
                                  alt={photo.title}
                                  className="max-w-full max-h-full object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              </div>

                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-white truncate uppercase tracking-widest">
                                  {photo.title}
                                </h4>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  <span className="text-[9px] text-gold-500 bg-gold-500/5 border border-gold-500/10 px-1.5 py-0.5 rounded tracking-wider uppercase font-semibold">
                                    {photo.category}
                                  </span>
                                  <span className="text-[9px] text-gray-400 bg-dark-950 border border-dark-800/80 px-1.5 py-0.5 rounded tracking-wider font-mono">
                                    {photo.orientation === "portrait" ? "Portrait" : "Landscape"}
                                  </span>
                                  {photo.featured && (
                                    <span className="text-[9px] text-amber-400 bg-amber-400/5 border border-amber-400/20 px-1.5 py-0.5 rounded tracking-wider uppercase font-semibold">
                                      ⭐ slide
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                             <div className="flex gap-2 flex-shrink-0 items-center">
                              {confirmPhotoDeleteId === photo.id ? (
                                <div className="flex items-center gap-1 bg-dark-950 border border-red-500/50 p-1 rounded-md shadow-lg">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onDeletePhoto(photo.id);
                                      setConfirmPhotoDeleteId(null);
                                    }}
                                    className="px-2 py-1 bg-red-650 hover:bg-red-600 text-[10px] text-white font-bold uppercase rounded tracking-wider cursor-pointer transition-all"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmPhotoDeleteId(null)}
                                    className="px-2 py-1 bg-dark-900 border border-dark-800 text-[10px] text-gray-400 hover:text-white rounded tracking-wider cursor-pointer transition-all"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => startEditingPhoto(photo)}
                                    className="px-3 py-1.5 bg-dark-950 border border-dark-800 hover:border-gold-500 text-xs text-gold-500 hover:text-white rounded transition-colors cursor-pointer font-semibold uppercase tracking-wider"
                                  >
                                    Edit Detail
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmPhotoDeleteId(photo.id)}
                                    className="p-1.5 bg-dark-950 border border-dark-800 hover:border-red-500 text-red-550 rounded hover:bg-red-500/10 transition-colors cursor-pointer"
                                    title="Delete Photo"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div
                key="settings-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 py-4"
              >
                <div className="flex flex-col gap-2 bg-dark-950/60 p-5 border border-dark-800 rounded-lg">
                  <div className="flex gap-2 items-center text-gold-500 font-bold text-xs uppercase tracking-wider">
                    <Settings className="w-4 h-4 text-gold-500" />
                    Inquiry Destination Settings
                  </div>
                  <p className="text-[11px] text-gray-400 font-sans tracking-wide leading-relaxed">
                    Configure the target email address where all portfolio inquiries from the public contact form are dispatched. 
                    Default is <span className="text-gold-200 font-semibold select-all">rezulpersonal@gmail.com</span>.
                  </p>
                </div>

                <form onSubmit={handleUpdateSettings} className="space-y-4 max-w-xl">
                  {settingsSuccess && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 rounded-lg text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>{settingsSuccess}</span>
                    </div>
                  )}

                  {settingsError && (
                    <div className="p-3 bg-red-950/40 border border-red-900/60 text-red-400 rounded-lg text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{settingsError}</span>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Curator Recipient Email
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="rezulpersonal@gmail.com"
                        className="border border-dark-800/80 focus:border-gold-500 focus:outline-none bg-dark-950 rounded px-3.5 py-2.5 text-xs text-white flex-1"
                      />
                      <button
                        type="submit"
                        disabled={savingSettings}
                        className="px-6 py-2.5 bg-gold-400 hover:bg-gold-500 disabled:opacity-50 text-dark-950 text-[10px] font-bold uppercase tracking-widest rounded transition-all cursor-pointer flex items-center gap-2"
                      >
                        {savingSettings ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-dark-950 border-t-transparent rounded-full animate-spin" />
                            Changing...
                          </>
                        ) : "Update Address"}
                      </button>
                    </div>
                  </div>
                </form>
                
                <div className="pt-6 border-t border-dark-800/50 text-[10px] text-gray-500 leading-relaxed max-w-xl font-sans">
                  <span className="text-gold-500/80 font-bold block mb-1">REAL-TIME ARCHIVE BACKUP:</span>
                  All inquiry submissions are logged inside the <span className="text-gray-300 font-bold">Inquiries Log</span> tab.
                  This ensures that even without SMTP configured in your server, you can preview and verify every user submission perfectly!
                </div>
              </motion.div>
            )}

            {activeTab === "inquiries" && (
              <motion.div
                key="inquiries-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 py-4"
              >
                <div className="flex items-center justify-between bg-dark-950/60 p-4 border border-dark-800 rounded-lg">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gold-500 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-gold-500" />
                      Client Messages Archives ({inquiries.length})
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-0.5 tracking-wide">
                      Backup records of submissions captured directly from your inquire contact form.
                    </p>
                  </div>
                  
                  {inquiries.length > 0 && (
                    confirmClearAllInquiries ? (
                      <div className="flex items-center gap-1.5 bg-dark-950 border border-red-500/60 p-1 rounded-md shadow-md">
                        <button
                          onClick={() => {
                            handleClearAllInquiries();
                            setConfirmClearAllInquiries(false);
                          }}
                          className="px-2 py-1 bg-red-650 hover:bg-red-600 text-[9px] text-white font-bold uppercase rounded tracking-wider cursor-pointer"
                        >
                          Confirm Clear All
                        </button>
                        <button
                          onClick={() => setConfirmClearAllInquiries(false)}
                          className="px-2 py-1 bg-dark-900 border border-dark-800 text-[9px] text-gray-400 hover:text-white rounded tracking-wider cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmClearAllInquiries(true)}
                        className="text-[9px] font-bold text-red-400 hover:text-red-300 border border-red-950/80 hover:border-red-500/50 bg-red-950/20 hover:bg-red-950/40 px-3 py-1.5 rounded transition-all cursor-pointer"
                      >
                        Clear All
                      </button>
                    )
                  )}
                </div>

                {loadingInquiries ? (
                  <div className="text-center py-16 text-gray-500 text-xs flex flex-col items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
                    Retrieving messages...
                  </div>
                ) : inquiries.length === 0 ? (
                  <div className="border border-dark-800/80 border-dashed rounded-xl p-12 text-center bg-dark-950/20 text-gray-500">
                    <Mail className="w-8 h-8 mx-auto mb-3 text-gold-500/40 animate-pulse" />
                    <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                      No Messages Logged Yet
                    </h4>
                    <p className="text-[10px] text-gray-500 max-w-sm mx-auto mt-2 leading-relaxed">
                      All new submissions completed in your public contact register module will automatically spawn in this list, forwarding immediately to your dynamically defined email ID!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
                    {inquiries.map((inq) => (
                      <div
                        key={inq.id}
                        className="p-5 border border-dark-800 bg-dark-950/80 rounded-xl relative group hover:border-gold-500/20 transition-all hover:bg-dark-950"
                      >
                        {/* Delete individual button */}
                        {confirmInquiryDeleteId === inq.id ? (
                          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-dark-950 border border-red-500/50 p-1 rounded shadow-lg z-20">
                            <button
                              onClick={() => {
                                handleDeleteInquiry(inq.id);
                                setConfirmInquiryDeleteId(null);
                              }}
                              className="px-2 py-0.5 bg-red-650 hover:bg-red-600 text-[9px] text-white font-bold uppercase rounded cursor-pointer transition-all animate-pulse"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setConfirmInquiryDeleteId(null)}
                              className="px-2 py-0.5 bg-dark-900 border border-dark-800 text-[9px] text-gray-400 hover:text-white rounded cursor-pointer transition-all"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmInquiryDeleteId(inq.id)}
                            className="absolute top-4 right-4 p-1.5 text-gray-500 hover:text-red-400 hover:bg-dark-900/60 rounded transition-colors duration-300 cursor-pointer"
                            title="Delete archive log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
                          <span className="text-xs font-serif font-semibold text-white">
                            {inq.name}
                          </span>
                          <a
                            href={`mailto:${inq.email}`}
                            className="text-[10px] text-gold-400 hover:underline font-mono"
                          >
                            {inq.email}
                          </a>
                          <span className="text-[9px] text-gray-600 font-mono ml-auto">
                            {new Date(inq.date).toLocaleString()}
                          </span>
                        </div>

                        <div className="text-[11px] font-bold text-gray-300 mb-2 font-sans uppercase tracking-wider">
                          Subject: {inq.subject}
                        </div>

                        <div className="text-[11px] text-gray-400 leading-relaxed bg-dark-900/60 p-3.5 border border-dark-800/40 rounded font-light whitespace-pre-wrap">
                          {inq.message}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          </>)}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Curated high-resolution presets for rapid click-to-import publishing
const PRESETS = [
  {
    id: "preset-cosmos",
    title: "Celestia",
    category: "Landscape",
    url: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&q=80&w=1200",
    camera: "Sony A7R IV",
    lens: "24mm f/1.4 GM",
    aperture: "f/1.4",
    shutter: "25s",
    iso: "3200",
    featured: true
  },
  {
    id: "preset-forest",
    title: "Canopy",
    category: "Landscape",
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1200",
    camera: "Fujifilm GFX 100S",
    lens: "32-64mm f/4.0",
    aperture: "f/8.0",
    shutter: "1/15s",
    iso: "100",
    featured: true
  },
  {
    id: "preset-neon",
    title: "Cyberpunk",
    category: "Street",
    url: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&q=80&w=1200",
    camera: "Leica M11",
    lens: "28mm Elmarit Prime",
    aperture: "f/2.8",
    shutter: "1/60s",
    iso: "800",
    featured: false
  },
  {
    id: "preset-monolith",
    title: "Monolith",
    category: "Architecture",
    url: "https://images.unsplash.com/photo-1600585155140-be6161a56a0c?auto=format&fit=crop&q=80&w=1200",
    camera: "Leica M11",
    lens: "35mm Summilux",
    aperture: "f/5.6",
    shutter: "1/500s",
    iso: "200",
    featured: false
  },
  {
    id: "preset-citrus",
    title: "Citrus",
    category: "Culinary",
    url: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&q=80&w=1200",
    camera: "Sony A7R IV",
    lens: "90mm f/2.8 Macro",
    aperture: "f/2.8",
    shutter: "1/160s",
    iso: "100",
    featured: true
  }
];
