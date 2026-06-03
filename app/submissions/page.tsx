"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, type Photo } from "@/lib/supabase";

const MAX_STORY = 300;

export default function SubmissionsPage() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [location, setLocation] = useState("");
  const [story, setStory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Admin moderation
  const [pendingPhotos, setPendingPhotos] = useState<Photo[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "";

  const fetchPending = useCallback(async () => {
    const { data } = await supabase
      .from("photos")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (data) setPendingPhotos(data);
  }, []);

  useEffect(() => {
    // Check if already authenticated this session
    if (sessionStorage.getItem("admin_auth") === "true") {
      setIsAdmin(true);
      fetchPending();
    }
  }, [fetchPending]);

  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminError(false);
      sessionStorage.setItem("admin_auth", "true");
      fetchPending();
    } else {
      setAdminError(true);
    }
  };

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) return;
    if (f.size > 20 * 1024 * 1024) {
      alert("Dosya boyutu 20MB'den küçük olmalı.");
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !author) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("photos")
        .getPublicUrl(fileName);

      await supabase.from("photos").insert({
        title,
        author,
        location,
        story,
        image_url: urlData.publicUrl,
        status: "pending",
      });

      setSuccess(true);
      setTitle("");
      setAuthor("");
      setLocation("");
      setStory("");
      setFile(null);
      setPreview(null);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      alert("Yükleme sırasında bir hata oluştu.");
    }
    setUploading(false);
  };

  const handleModerate = async (id: string, status: "approved" | "rejected") => {
    await supabase.from("photos").update({ status }).eq("id", id);
    fetchPending();
  };

  return (
    <div className="min-h-screen px-5 md:px-16 py-12">
      <div className="max-w-360 mx-auto">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Submit Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-1 max-w-lg"
          >
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-3">
              Eserini <span className="text-primary italic">Paylaş</span>
            </h1>
            <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
              Dijital arşive katkıda bulun. Yüksek çözünürlüklü fotoğraflar.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* File Upload */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files[0];
                  if (f) handleFile(f);
                }}
                onClick={() => fileRef.current?.click()}
                className={`relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 ${
                  dragOver
                    ? "border-primary bg-primary/5"
                    : preview
                    ? "border-primary/50"
                    : "border-(--border) hover:border-primary/50"
                }`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />

                {preview ? (
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg object-contain"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setPreview(null);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full glass flex items-center justify-center hover:border-red-400 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="py-8">
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="mx-auto mb-4 opacity-40"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    <p className="text-sm font-semibold mb-1">
                      Sürükle & Bırak veya Tıkla
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      JPEG, PNG - max 20MB
                    </p>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs uppercase tracking-widest font-semibold mb-2 text-primary">
                  Eser Başlığı
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ör. Uçmakdere'de Şafak"
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-300"
                  style={{
                    background: "var(--elevated)",
                    color: "var(--text)",
                    border: "1px solid var(--border)",
                  }}
                />
              </div>

              {/* Author + Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest font-semibold mb-2 text-primary">
                    Fotoğrafçı
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Ad Soyad"
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-300"
                    style={{
                      background: "var(--elevated)",
                      color: "var(--text)",
                      border: "1px solid var(--border)",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest font-semibold mb-2 text-primary">
                    Konum
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Çekim yeri"
                    className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-300"
                    style={{
                      background: "var(--elevated)",
                      color: "var(--text)",
                      border: "1px solid var(--border)",
                    }}
                  />
                </div>
              </div>

              {/* Story */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase tracking-widest font-semibold text-primary">
                    Hikaye
                  </label>
                  <span
                    className={`text-xs ${
                      story.length > MAX_STORY ? "text-red-400" : ""
                    }`}
                    style={{ color: story.length > MAX_STORY ? undefined : "var(--text-secondary)" }}
                  >
                    {story.length} / {MAX_STORY}
                  </span>
                </div>
                <textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value.slice(0, MAX_STORY))}
                  placeholder="Bu karenin hikayesini paylaş..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl text-sm resize-none transition-all duration-300"
                  style={{
                    background: "var(--elevated)",
                    color: "var(--text)",
                    border: "1px solid var(--border)",
                  }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploading || !file || !title || !author}
                className="w-full py-4 rounded-xl bg-primary text-black font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:bg-primary-light hover:shadow-[0_0_30px_rgba(120,190,32,0.4)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                {uploading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full"
                  />
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                    Eseri Gönder
                  </>
                )}
              </button>
            </form>

            {/* Success Toast */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center gap-3"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#78BE20" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <path d="M22 4L12 14.01l-3-3" />
                  </svg>
                  <span className="text-sm font-medium text-primary">
                    Fotoğrafın başarıyla gönderildi! Onay bekleniyor.
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Moderation Queue (Admin) */}
          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex-1"
            >
              <div className="flex items-center gap-3 mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#78BE20" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <h2 className="font-display text-2xl font-bold">
                  Onay Sırası
                </h2>
                <span className="ml-auto px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                  {pendingPhotos.length} Bekliyor
                </span>
              </div>

              {pendingPhotos.length === 0 ? (
                <div className="text-center py-16 glass rounded-xl">
                  <p style={{ color: "var(--text-secondary)" }}>
                    Onay bekleyen fotoğraf yok.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pendingPhotos.map((photo) => (
                    <motion.div
                      key={photo.id}
                      layout
                      className="luminous-border rounded-xl overflow-hidden"
                      style={{ background: "var(--card)" }}
                    >
                      <div className="relative">
                        <img
                          src={photo.image_url}
                          alt={photo.title}
                          className="w-full h-48 object-cover"
                        />
                        <span className="absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-bold bg-yellow-500/90 text-black">
                          BEKLİYOR
                        </span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-display text-base font-semibold mb-1">
                          {photo.title}
                        </h3>
                        <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
                          {photo.author}
                          {photo.location && ` — ${photo.location}`}
                        </p>
                        {photo.story && (
                          <p className="text-xs mt-2 leading-relaxed line-clamp-3" style={{ color: "var(--text-secondary)" }}>
                            {photo.story}
                          </p>
                        )}
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleModerate(photo.id, "approved")}
                            className="flex-1 py-2 rounded-lg bg-primary/10 text-primary text-sm font-semibold hover:bg-primary hover:text-black transition-all duration-300"
                          >
                            Onayla
                          </button>
                          <button
                            onClick={() => handleModerate(photo.id, "rejected")}
                            className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-semibold hover:bg-red-500 hover:text-white transition-all duration-300"
                          >
                            Reddet
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Admin Login Button (bottom-right) */}
        {!isAdmin && (
          <div className="fixed bottom-6 right-6 z-40">
            <button
              onClick={() => setShowAdminLogin(true)}
              className="w-12 h-12 rounded-full glass flex items-center justify-center hover:border-primary transition-all duration-300 hover:shadow-[0_0_12px_rgba(120,190,32,0.3)] opacity-30 hover:opacity-100"
              title="Admin Girişi"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </button>
          </div>
        )}

        {/* Admin Login Modal */}
        <AnimatePresence>
          {showAdminLogin && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setShowAdminLogin(false)}
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative glass rounded-2xl p-8 w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-display text-xl font-bold mb-2 text-center">
                  Admin Girişi
                </h3>
                <p className="text-sm text-center mb-6" style={{ color: "var(--text-secondary)" }}>
                  Moderasyon paneline erişmek için şifreyi girin.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAdminLogin();
                  }}
                >
                  <div className="relative mb-3">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={adminPassword}
                      onChange={(e) => {
                        setAdminPassword(e.target.value);
                        setAdminError(false);
                      }}
                      placeholder="Şifre"
                      autoFocus
                      className="w-full px-4 py-3 pr-11 rounded-xl text-sm transition-all duration-300"
                      style={{
                        background: "var(--elevated)",
                        color: "var(--text)",
                        border: `1px solid ${adminError ? "#ef4444" : "var(--border)"}`,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {adminError && (
                    <p className="text-xs text-red-400 mb-3">Yanlış şifre. Tekrar deneyin.</p>
                  )}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAdminLogin(false)}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold border border-(--border) hover:border-primary transition-all"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 rounded-xl text-sm font-semibold bg-primary text-black hover:bg-primary-light transition-all"
                    >
                      Giriş Yap
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
