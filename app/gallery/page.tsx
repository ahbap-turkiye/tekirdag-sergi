"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, type Photo, type Vote } from "@/lib/supabase";
import {
  getDeviceId,
  getFingerprint,
  getClientIp,
  addMyVote,
  removeMyVote,
  getVoterName,
  setVoterName,
  MAX_VOTES,
} from "@/lib/device";
import { titleCase } from "@/lib/format";

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [myVotes, setMyVotes] = useState<string[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [voters, setVoters] = useState<Record<string, Pick<Vote, "voter_name" | "created_at">[]>>({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [voting, setVoting] = useState(false);
  const [cachedFp, setCachedFp] = useState("");
  const [cachedIp, setCachedIp] = useState("");

  useEffect(() => {
    setNameInput(getVoterName());
    getFingerprint().then(setCachedFp);
    getClientIp().then(setCachedIp);
  }, []);

  const fetchPhotos = useCallback(async () => {
    const { data } = await supabase
      .from("photos")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    if (data) setPhotos(data);
    setLoading(false);
  }, []);

  const fetchVoteCounts = useCallback(async () => {
    const { data } = await supabase
      .from("votes")
      .select("photo_id, voter_name, created_at");
    if (data) {
      const counts: Record<string, number> = {};
      const voterMap: Record<string, Pick<Vote, "voter_name" | "created_at">[]> = {};
      let total = 0;
      data.forEach((v) => {
        counts[v.photo_id] = (counts[v.photo_id] || 0) + 1;
        if (!voterMap[v.photo_id]) voterMap[v.photo_id] = [];
        voterMap[v.photo_id].push({ voter_name: v.voter_name, created_at: v.created_at });
        total++;
      });
      setVoteCounts(counts);
      setVoters(voterMap);
      setTotalVotes(total);
    }
  }, []);

  const syncMyVotes = useCallback(async () => {
    const deviceId = getDeviceId();
    const { data: myDbVotes } = await supabase
      .from("votes")
      .select("photo_id")
      .eq("device_id", deviceId);
    const dbVotedIds = myDbVotes ? myDbVotes.map((v) => v.photo_id) : [];
    if (typeof window !== "undefined") {
      localStorage.setItem("sergi_my_votes", JSON.stringify(dbVotedIds));
    }
    setMyVotes(dbVotedIds);
  }, []);

  useEffect(() => {
    syncMyVotes();
    fetchPhotos();
    fetchVoteCounts();
  }, [fetchPhotos, fetchVoteCounts, syncMyVotes]);

  const handleVote = async (photoId: string) => {
    if (voting) return;
    setVoting(true);
    const deviceId = getDeviceId();
    const alreadyVoted = myVotes.includes(photoId);
    const fingerprint = cachedFp || await getFingerprint();
    const ip = cachedIp || await getClientIp();
    const currentName = nameInput.trim() || null;

    if (alreadyVoted) {
      // Optimistic: update ALL UI state immediately
      const newVotes = removeMyVote(photoId);
      setMyVotes(newVotes);
      setVoteCounts((prev) => ({ ...prev, [photoId]: Math.max(0, (prev[photoId] || 1) - 1) }));
      setVoters((prev) => ({ ...prev, [photoId]: (prev[photoId] || []).slice(0, -1) }));
      setTotalVotes((t) => Math.max(0, t - 1));

      // Optimistic UI + DB write
      setMyVotes(removeMyVote(photoId));
      setVoteCounts((prev) => ({ ...prev, [photoId]: Math.max(0, (prev[photoId] || 1) - 1) }));
      setTotalVotes((t) => Math.max(0, t - 1));
      await supabase.from("votes").delete().eq("photo_id", photoId).eq("device_id", deviceId);
    } else {
      if (myVotes.length >= MAX_VOTES) { setVoting(false); return; }

      // Name check
      if (currentName) {
        const { data: nameTaken } = await supabase
          .from("votes")
          .select("id")
          .eq("voter_name", currentName)
          .neq("fingerprint", fingerprint)
          .limit(1);
        if (nameTaken && nameTaken.length > 0) {
          setNameError("Bu isim başka bir cihazda kullanılıyor. Farklı bir isim dene.");
          setVoting(false);
          return;
        }
        setVoterName(currentName);
      }
      setNameError("");

      // Check duplicate
      const { data: existing } = await supabase
        .from("votes")
        .select("id")
        .eq("photo_id", photoId)
        .eq("fingerprint", fingerprint);

      if (existing && existing.length > 0) {
        setMyVotes(addMyVote(photoId));
        setVoting(false);
        return;
      }

      // Optimistic UI
      setMyVotes(addMyVote(photoId));
      const voterEntry = { voter_name: currentName, created_at: new Date().toISOString() };
      setVoteCounts((prev) => ({ ...prev, [photoId]: (prev[photoId] || 0) + 1 }));
      setVoters((prev) => ({ ...prev, [photoId]: [...(prev[photoId] || []), voterEntry] }));
      setTotalVotes((t) => t + 1);

      // DB write
      await supabase.from("votes").insert({
        photo_id: photoId,
        device_id: deviceId,
        fingerprint,
        ip_address: ip,
        voter_name: currentName,
      });
    }
    setVoting(false);
  };

  return (
    <div className="min-h-screen px-5 md:px-16 py-12">
      <div className="max-w-360 mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-3">
              Seçilmiş <span className="text-primary italic">Kareler</span>
            </h1>
            <p
              className="text-base md:text-lg max-w-lg leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Onaylanmış fotoğraflardan oluşan koleksiyon. Galeriyi keşfet ve
              seni en çok etkileyen karelere oy ver.
            </p>
          </motion.div>

          {/* Voting Rights + Name Input */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass rounded-xl px-5 py-3 flex flex-col gap-3 shrink-0"
          >
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--text-secondary)" }}>
                  OY HAKKI
                </p>
                <div className="mt-1.5 h-1.5 w-32 rounded-full bg-surface-highest overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full progress-glow"
                    initial={{ width: 0 }}
                    animate={{ width: `${(myVotes.length / MAX_VOTES) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
              <span className="text-lg font-bold">
                {myVotes.length}{" "}
                <span className="text-sm font-normal" style={{ color: "var(--text-secondary)" }}>
                  / {MAX_VOTES}
                </span>
              </span>
            </div>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                setVoterName(e.target.value);
              }}
              placeholder="İsmin (isteğe bağlı)"
              className={`w-full px-3 py-1.5 rounded-lg text-sm border bg-transparent focus:outline-none transition-colors ${nameError ? "border-red-500" : "border-(--border) focus:border-primary"}`}
            />
            {nameError && <p className="text-red-400 text-xs mt-1">{nameError}</p>}
          </motion.div>
        </div>

        {/* Gallery Masonry */}
        {loading ? (
          <div className="masonry">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="shimmer rounded-lg"
                style={{ height: `${200 + Math.random() * 200}px` }}
              />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-32">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#78BE20" strokeWidth="1.5">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </div>
            <h3 className="font-display text-2xl font-semibold mb-2">Henüz fotoğraf yok</h3>
            <p style={{ color: "var(--text-secondary)" }}>Onaylanmış fotoğraflar burada görünecek.</p>
          </div>
        ) : (
          <div className="masonry">
            {photos.map((photo, i) => (
              <GalleryCard
                key={photo.id}
                photo={photo}
                index={i}
                voted={myVotes.includes(photo.id)}
                voteCount={voteCounts[photo.id] || 0}
                voters={voters[photo.id] || []}
                totalVotes={totalVotes}
                canVote={myVotes.length < MAX_VOTES || myVotes.includes(photo.id)}
                onVote={() => handleVote(photo.id)}
                onSelect={() => setSelectedPhoto(photo)}
              />
            ))}
          </div>
        )}

        {/* Photo Modal */}
        <AnimatePresence>
          {selectedPhoto && (
            <PhotoModal
              photo={selectedPhoto}
              voted={myVotes.includes(selectedPhoto.id)}
              voteCount={voteCounts[selectedPhoto.id] || 0}
              voters={voters[selectedPhoto.id] || []}
              totalVotes={totalVotes}
              canVote={myVotes.length < MAX_VOTES || myVotes.includes(selectedPhoto.id)}
              onVote={() => handleVote(selectedPhoto.id)}
              onClose={() => setSelectedPhoto(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

type VoterInfo = Pick<Vote, "voter_name" | "created_at">;

function GalleryCard({
  photo,
  index,
  voted,
  voteCount,
  voters,
  totalVotes,
  canVote,
  onVote,
  onSelect,
}: {
  photo: Photo;
  index: number;
  voted: boolean;
  voteCount: number;
  voters: VoterInfo[];
  totalVotes: number;
  canVote: boolean;
  onVote: () => void;
  onSelect: () => void;
}) {
  const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
  const [downloading, setDownloading] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="group luminous-border rounded-lg overflow-hidden cursor-pointer relative"
      style={{ background: "var(--card)" }}
    >
      {/* Image */}
      <div className="relative overflow-hidden" onClick={onSelect}>
        {!imgLoaded && (
          <div className="shimmer w-full" style={{ aspectRatio: "4/3" }} />
        )}
        <picture>
          {photo.mobile_image_url && (
            <source media="(max-width: 768px)" srcSet={photo.mobile_image_url} />
          )}
          <img
            src={photo.image_url}
            alt={photo.title}
            className="w-full object-cover img-zoom"
            style={{
              opacity: imgLoaded ? 1 : 0,
              filter: imgLoaded ? "blur(0px)" : "blur(20px)",
              transform: imgLoaded ? "scale(1)" : "scale(1.05)",
              transition: "opacity 0.6s ease, filter 0.6s ease, transform 0.6s ease",
            }}
            onLoad={() => setImgLoaded(true)}
          />
        </picture>
        {/* Gradient overlay */}
        <div className="absolute inset-0 cinematic-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Download button */}
        <button
          disabled={downloading}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full glass flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 hover:border-primary z-10 ${downloading ? "opacity-50 cursor-wait" : ""}`}
          title="İndir"
          onClick={(e) => {
            e.stopPropagation();
            if (downloading) return;
            setDownloading(true);
            fetch(photo.image_url)
              .then((res) => res.blob())
              .then((blob) => {
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `${photo.title || "foto"}.jpg`;
                a.click();
                URL.revokeObjectURL(a.href);
              })
              .finally(() => setDownloading(false));
          }}
        >
          {downloading ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="animate-spin">
              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          )}
        </button>

        {/* Hover info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
          <p className="font-display text-lg font-semibold text-white">
            {photo.title}
          </p>
          <p className="text-sm text-white/70">{titleCase(photo.author)}</p>
        </div>
      </div>

      {/* Vote bar */}
      <div className="p-3 flex items-center justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs mb-1">
            <span style={{ color: "var(--text-secondary)" }}>{voteCount} oy</span>
            <span className="text-primary font-semibold">{percentage}%</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--elevated)" }}>
            <motion.div
              className="h-full bg-primary rounded-full progress-glow"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          {/* Voters */}
          {voters.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {voters.slice(0, 3).map((v, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--elevated)", color: "var(--text-secondary)" }}>
                  {v.voter_name || "Anonim"}
                </span>
              ))}
              {voters.length > 3 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full text-primary" style={{ background: "var(--elevated)" }}>
                  +{voters.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (canVote) onVote();
          }}
          disabled={!canVote && !voted}
          className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${
            voted
              ? "bg-primary text-black shadow-[0_0_12px_rgba(120,190,32,0.4)]"
              : canVote
              ? "border border-(--border) hover:border-primary hover:shadow-[0_0_8px_rgba(120,190,32,0.3)]"
              : "border border-(--border) opacity-40 cursor-not-allowed"
          }`}
          title={voted ? "Oyu geri al" : canVote ? "Oy ver" : "Oy hakkın doldu"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={voted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}

function PhotoModal({
  photo,
  voted,
  voteCount,
  voters,
  totalVotes,
  canVote,
  onVote,
  onClose,
}: {
  photo: Photo;
  voted: boolean;
  voteCount: number;
  voters: VoterInfo[];
  totalVotes: number;
  canVote: boolean;
  onVote: () => void;
  onClose: () => void;
}) {
  const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

      {/* Content */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative max-w-5xl w-full max-h-[90vh] flex flex-col md:flex-row gap-6 overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top buttons */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
          <button
            disabled={downloading}
            className={`w-10 h-10 rounded-full glass flex items-center justify-center hover:border-primary transition-all ${downloading ? "opacity-50 cursor-wait" : ""}`}
            title="İndir"
            onClick={(e) => {
              e.stopPropagation();
              if (downloading) return;
              setDownloading(true);
              fetch(photo.image_url)
                .then((res) => res.blob())
                .then((blob) => {
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = `${photo.title || "foto"}.jpg`;
                  a.click();
                  URL.revokeObjectURL(a.href);
                })
                .finally(() => setDownloading(false));
            }}
          >
            {downloading ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            )}
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full glass flex items-center justify-center hover:border-primary transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Image */}
        <div className="flex-1 min-h-0">
          <picture>
            {photo.mobile_image_url && (
              <source media="(max-width: 768px)" srcSet={photo.mobile_image_url} />
            )}
            <img
              src={photo.image_url}
              alt={photo.title}
              className="w-full h-full object-contain rounded-lg"
            />
          </picture>
        </div>

        {/* Info Panel */}
        <div className="md:w-80 shrink-0 glass rounded-xl p-6 flex flex-col gap-4">
          <h2 className="font-display text-2xl font-bold">{photo.title}</h2>

          {/* HUD-style metadata */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-primary font-semibold">Fotoğrafçı</span>
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{titleCase(photo.author)}</p>
          </div>

          {photo.location && (
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-primary font-semibold">Konum</span>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{photo.location}</p>
            </div>
          )}

          {photo.story && (
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-primary font-semibold">Hikaye</span>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {photo.story}
              </p>
            </div>
          )}

          {/* Voters list */}
          {voters.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-primary font-semibold">Oy Verenler</span>
              <div className="flex flex-wrap gap-1.5">
                {voters.map((v, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ background: "var(--elevated)", color: "var(--text-secondary)" }}
                  >
                    {v.voter_name || "Anonim"}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Vote section */}
          <div className="mt-auto pt-4 border-t border-(--border)">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">{voteCount} oy</span>
              <span className="text-primary font-bold">{percentage}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background: "var(--elevated)" }}>
              <motion.div
                className="h-full bg-primary rounded-full progress-glow"
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <button
              onClick={onVote}
              disabled={!canVote && !voted}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                voted
                  ? "bg-primary text-black shadow-[0_0_20px_rgba(120,190,32,0.4)]"
                  : canVote
                  ? "border border-(--border) hover:border-primary hover:shadow-[0_0_12px_rgba(120,190,32,0.3)]"
                  : "border border-(--border) opacity-40 cursor-not-allowed"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={voted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {voted ? "Oyu Geri Al" : "Oy Ver"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
