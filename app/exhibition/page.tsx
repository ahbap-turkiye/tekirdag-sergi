"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, type Photo } from "@/lib/supabase";

export default function ExhibitionPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);

  const fetchPhotos = useCallback(async () => {
    const { data } = await supabase
      .from("photos")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    if (data) setPhotos(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // Auto slideshow
  useEffect(() => {
    if (!autoPlay || photos.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % photos.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [autoPlay, photos.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setCurrent((c) => (c + 1) % photos.length);
        setAutoPlay(false);
      }
      if (e.key === "ArrowLeft") {
        setCurrent((c) => (c - 1 + photos.length) % photos.length);
        setAutoPlay(false);
      }
      if (e.key === " ") {
        e.preventDefault();
        setAutoPlay((a) => !a);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [photos.length]);

  const photo = photos[current];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full"
        />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#78BE20" strokeWidth="1.5">
              <rect x="2" y="2" width="20" height="20" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">Sergi Hazırlanıyor</h2>
          <p style={{ color: "var(--text-secondary)" }}>Yakında burada eserler sergilenecek.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Fullscreen photo with crossfade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={photo.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0"
        >
          <picture>
            {photo.mobile_image_url && (
              <source media="(max-width: 768px)" srcSet={photo.mobile_image_url} />
            )}
            <img
              src={photo.image_url}
              alt={photo.title}
              className="w-full h-full object-cover"
            />
          </picture>
          {/* Cinematic vignette */}
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-black/40" />
          <div className="absolute inset-0 bg-linear-to-r from-black/30 via-transparent to-black/30" />
        </motion.div>
      </AnimatePresence>

      {/* HUD Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-5 md:p-16">
        {/* Top bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-between"
        >
          <div className="glass rounded-lg px-4 py-2">
            <span className="text-xs uppercase tracking-widest font-semibold text-primary">
              Sergi
            </span>
            <span className="text-xs ml-3" style={{ color: "rgba(255,255,255,0.6)" }}>
              {current + 1} / {photos.length}
            </span>
          </div>

          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className="glass rounded-lg px-4 py-2 flex items-center gap-2 hover:border-primary transition-all"
          >
            {autoPlay ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
            <span className="text-xs font-medium text-white">
              {autoPlay ? "Duraklat" : "Oynat"}
            </span>
          </button>
        </motion.div>

        {/* Bottom info */}
        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8 }}
              className="max-w-xl"
            >
              <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-3">
                {photo.title}
              </h2>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm font-medium text-white/80">
                  {photo.author}
                </span>
                {photo.location && (
                  <>
                    <span className="text-white/30">|</span>
                    <span className="text-sm text-white/60 flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {photo.location}
                    </span>
                  </>
                )}
              </div>
              {photo.story && (
                <p className="text-sm text-white/70 leading-relaxed max-w-md">
                  {photo.story}
                </p>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center gap-4 mt-8">
            <button
              onClick={() => {
                setCurrent((c) => (c - 1 + photos.length) % photos.length);
                setAutoPlay(false);
              }}
              className="w-12 h-12 rounded-full glass flex items-center justify-center hover:border-primary transition-all group"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="group-hover:stroke-primary transition-colors">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => {
                setCurrent((c) => (c + 1) % photos.length);
                setAutoPlay(false);
              }}
              className="w-12 h-12 rounded-full glass flex items-center justify-center hover:border-primary transition-all group"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="group-hover:stroke-primary transition-colors">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>

            {/* Progress dots */}
            <div className="hidden md:flex items-center gap-1.5 ml-4">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrent(i); setAutoPlay(false); }}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === current
                      ? "w-8 bg-primary"
                      : "w-1.5 bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Auto-play progress bar */}
          {autoPlay && (
            <div className="mt-4 h-0.5 w-full max-w-xl rounded-full bg-white/10 overflow-hidden">
              <motion.div
                key={`progress-${current}`}
                className="h-full bg-primary rounded-full progress-glow"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 6, ease: "linear" }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
