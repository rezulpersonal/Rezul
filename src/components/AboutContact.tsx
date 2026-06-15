import React, { useState } from "react";
import { User, ShieldCheck, Mail, Send, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { InquiryFormData } from "../types";
import { localDb } from "../lib/localDb";

export default function AboutContact() {
  const [formData, setFormData] = useState<InquiryFormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // 1. Instantly save in local storage
      localDb.addInquiry({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message
      });

      // 2. Clear form and set success state immediately (optimistic UI)
      setSuccessMsg("Your inquiry was logged successfully in the local archive registry!");
      setFormData({ name: "", email: "", subject: "", message: "" });

      // 3. Asynchronously attempt backend dispatch, but don't fail if server is down
      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          const result = await response.json();
          if (result.message) {
            setSuccessMsg(result.message);
          }
        }
      } catch (backendError) {
        console.warn("Backend dispatch skipped (running in pure frontend mode):", backendError);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-dark-900 border-t border-b border-dark-800/80 relative">
      {/* Absolute floating shapes for ambient atmosphere */}
      <div className="absolute top-1/4 right-[10%] w-64 h-64 bg-gold-400/2 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-[5%] w-72 h-72 bg-gold-400/2 rounded-full filter blur-3xl pointer-events-none" />

      {/* Grid container spanning About and Contact */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 relative z-10">
        
        {/* LEFT COLUMN: ABOUT SECTION (5 Cols) */}
        <section id="about" className="lg:col-span-5 flex flex-col justify-center">
          <span className="text-[11px] font-bold tracking-[0.25em] text-gold-500 uppercase block mb-3">
            BIOGRAPHY INDEX
          </span>
          <h2 className="text-3xl md:text-5xl serif-heading font-serif text-white uppercase tracking-tight mb-6">
            Rezul <br />
            <span className="italic text-gold-200">Raghav</span>
          </h2>

          <div className="w-12 h-px bg-gold-500/50 mb-6" />

          <div className="space-y-5 text-sm font-sans tracking-wide text-gray-400 font-light leading-relaxed">
            <p>
              Trained in premium classical compositions, Rezul's lens operates at the pristine intersection of organic storytelling, light, and visual depth.
            </p>
            <p>
              His signature approach strips away visual noise to capture raw instants—just clicking the moment and giving life to the picture in its purest form.
            </p>
            <p>
              Accepting private gallery exhibitions, editorial commissions, global print requests, and bespoke atmospheric collaborations.
            </p>
          </div>

          {/* Core Values Icons */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-dark-800/60">
            <div className="flex gap-3 items-start">
              <div className="p-2 bg-dark-950 border border-dark-800 rounded text-gold-500">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-bold text-white uppercase tracking-widest mb-1">
                  FINE ART ARCHIVES
                </span>
                <span className="block text-[10px] text-gray-500 leading-snug">
                  Archival giclée pigment works certified to museum durability ratios.
                </span>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="p-2 bg-dark-950 border border-dark-800 rounded text-gold-500">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-bold text-white uppercase tracking-widest mb-1">
                  SECURE SHIPMENTS
                </span>
                <span className="block text-[10px] text-gray-500 leading-snug">
                  Crated shipping pipelines supporting global luxury hand-delivered logistics.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: CONTACT INQUIRY FORM (7 Cols) */}
        <section id="contact" className="lg:col-span-7">
          <div className="bg-dark-950/40 border border-dark-800/80 p-5 sm:p-8 md:p-10 rounded-xl sm:rounded-2xl shadow-xl">
            <div className="mb-6">
              <span className="text-[10px] font-bold tracking-[0.2em] text-gold-500 uppercase block mb-1">
                INQUIRY REGISTER
              </span>
              <h3 className="text-xl md:text-2xl font-serif serif-heading text-white">
                Request Commission or Print
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                For commercial licensing, custom prints sizing, or editorial alignment.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {successMsg ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-6 bg-emerald-950/40 border border-emerald-900/60 rounded-xl text-center flex flex-col items-center gap-3"
                >
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-widest">
                    Transmission Successful
                  </h4>
                  <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                    {successMsg}
                  </p>
                  <button
                    onClick={() => setSuccessMsg("")}
                    className="mt-2 text-[10px] font-bold text-gold-400 hover:text-white uppercase tracking-widest border border-gold-500/20 bg-gold-500/5 hover:bg-gold-500/15 py-1.5 px-4 rounded transition-colors"
                  >
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {errorMsg && (
                    <div className="p-3.5 bg-red-950/40 border border-red-900/60 text-red-400 rounded-lg text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold tracking-wider uppercase text-gray-500">
                        Full Name <span className="text-gold-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Alistair Vance"
                        className="border border-dark-800/80 focus:border-gold-500 focus:outline-none bg-dark-900/40 rounded px-3 py-2.5 text-xs text-white"
                      />
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold tracking-wider uppercase text-gray-500">
                        Email Address <span className="text-gold-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="vance@editorial.com"
                        className="border border-dark-800/80 focus:border-gold-500 focus:outline-none bg-dark-900/40 rounded px-3 py-2.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold tracking-wider uppercase text-gray-500">
                      Subject Matter
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="e.g. Editorial culinary cover shoot commission"
                      className="border border-dark-800/80 focus:border-gold-500 focus:outline-none bg-dark-900/40 rounded px-3 py-2.5 text-xs text-white"
                    />
                  </div>

                  {/* Message */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold tracking-wider uppercase text-gray-500">
                      Message Corpus <span className="text-gold-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Detail your inquiry, sizing formats requested, or deadline goals here..."
                      className="border border-dark-800/80 focus:border-gold-500 focus:outline-none bg-dark-900/40 rounded px-3 py-2.5 text-xs text-white resize-none"
                    />
                  </div>

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 border border-gold-500 bg-gold-400 hover:bg-gold-500 text-dark-950 text-xs font-bold uppercase tracking-widest rounded shadow-xl hover:shadow-gold-500/10 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-dark-950 border-t-transparent rounded-full animate-spin" />
                        Transmitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Transmit Inquiry
                      </>
                    )}
                  </button>
                </form>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </div>
  );
}
