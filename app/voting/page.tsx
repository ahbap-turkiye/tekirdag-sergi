"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase, type Photo, type Vote } from "@/lib/supabase";
import {
  getDeviceId,
  getFingerprint,
  getClientIp,
  getMyVotes,
  addMyVote,
  removeMyVote,
  getVoterName,
  setVoterName,
  MAX_VOTES,
} from "@/lib/device";

type VoterInfo = Pick<Vote, "voter_name" | "created_at">;
type PhotoWithVotes = Photo & { vote_count: number; voters: VoterInfo[] };

export default function VotingPage() {
  const [rankings, setRankings] = useState<PhotoWithVotes[]>([]);
  const [myVotes, setMyVotes] = useState<string[]>([]);
  const [myVotedPhotos, setMyVotedPhotos] = useState<Photo[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    setNameInput(getVoterName());
  }, []);

  const fetchData = useCallback(async () => {
    // Fetch approved photos
    const { data: photos } = await supabase
      .from("photos")
      .select("*")
      .eq("status", "approved");

    // Fetch all votes
    const { data: votes } = await supabase
      .from("votes")
      .select("photo_id, voter_name, created_at");

    if (photos && votes) {
      const counts: Record<string, number> = {};
      const voterMap: Record<string, VoterInfo[]> = {};
      votes.forEach((v) => {
        counts[v.photo_id] = (counts[v.photo_id] || 0) + 1;
        if (!voterMap[v.photo_id]) voterMap[v.photo_id] = [];
        voterMap[v.photo_id].push({ voter_name: v.voter_name, created_at: v.created_at });
      });

      const ranked = photos
        .map((p) => ({ ...p, vote_count: counts[p.id] || 0, voters: voterMap[p.id] || [] }))
        .sort((a, b) => b.vote_count - a.vote_count);

      setRankings(ranked);
      setTotalVotes(votes.length);

      // Sync localStorage with DB: check which of our local votes still exist
      const deviceId = getDeviceId();
      const { data: myDbVotes } = await supabase
        .from("votes")
        .select("photo_id")
        .eq("device_id", deviceId);
      const dbVotedIds = myDbVotes ? myDbVotes.map((v) => v.photo_id) : [];
      // Update localStorage to match DB
      if (typeof window !== "undefined") {
        localStorage.setItem("sergi_my_votes", JSON.stringify(dbVotedIds));
      }
      setMyVotes(dbVotedIds);
      setMyVotedPhotos(photos.filter((p) => dbVotedIds.includes(p.id)));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVote = async (photoId: string) => {
    const deviceId = getDeviceId();
    const alreadyVoted = myVotes.includes(photoId);

    if (alreadyVoted) {
      await supabase
        .from("votes")
        .delete()
        .eq("photo_id", photoId)
        .eq("device_id", deviceId);
      setMyVotes(removeMyVote(photoId));
    } else {
      if (myVotes.length >= MAX_VOTES) return;
      const [fingerprint, ip] = await Promise.all([
        getFingerprint(),
        getClientIp(),
      ]);

      // Check if this fingerprint already voted for this photo
      const { data: existing } = await supabase
        .from("votes")
        .select("id")
        .eq("photo_id", photoId)
        .eq("fingerprint", fingerprint);

      if (existing && existing.length > 0) {
        setMyVotes(addMyVote(photoId));
        fetchData();
        return;
      }

      const currentName = nameInput.trim() || null;

      // Check if this name is already used by a different device
      if (currentName) {
        const { data: nameTaken } = await supabase
          .from("votes")
          .select("id")
          .eq("voter_name", currentName)
          .neq("fingerprint", fingerprint)
          .limit(1);
        if (nameTaken && nameTaken.length > 0) {
          setNameError("Bu isim başka bir cihazda kullanılıyor. Farklı bir isim dene.");
          return;
        }
        setVoterName(currentName);
      }
      setNameError("");

      await supabase.from("votes").insert({
        photo_id: photoId,
        device_id: deviceId,
        fingerprint,
        ip_address: ip,
        voter_name: currentName,
      });
      setMyVotes(addMyVote(photoId));
    }
    fetchData();
  };

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="min-h-screen px-5 md:px-16 py-12">
      <div className="max-w-360 mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-3">
            Halkın <span className="text-primary italic">Favorisi</span>
          </h1>
          <p
            className="text-base md:text-lg max-w-lg leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Halkın oyuyla öne çıkan eserler. Gerçek zamanlı oy durumu.
          </p>
          {/* Mobile name input */}
          <div className="mt-4 lg:hidden">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                setVoterName(e.target.value);
              }}
              placeholder="İsmin (isteğe bağlı)"
              className={`w-full max-w-xs px-3 py-2 rounded-lg text-sm border bg-transparent focus:outline-none transition-colors ${nameError ? "border-red-500" : "border-(--border) focus:border-primary"}`}
            />
            {nameError && <p className="text-red-400 text-xs mt-1">{nameError}</p>}
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Rankings List */}
          <div className="flex-1 space-y-4">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="shimmer h-28 rounded-xl" />
              ))
            ) : rankings.length === 0 ? (
              <div className="text-center py-20">
                <p style={{ color: "var(--text-secondary)" }}>Henüz oylama başlamadı.</p>
              </div>
            ) : (
              rankings.map((photo, i) => {
                const pct = totalVotes > 0 ? Math.round((photo.vote_count / totalVotes) * 100) : 0;
                const voted = myVotes.includes(photo.id);
                const canVote = myVotes.length < MAX_VOTES || voted;

                // Calculate rank based on vote count (same votes = same rank)
                const rank = i === 0 ? 0 : rankings[i - 1].vote_count === photo.vote_count
                  ? rankings.findIndex((r) => r.vote_count === photo.vote_count)
                  : i;

                return (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    className="luminous-border rounded-xl p-4 flex items-center gap-4"
                    style={{ background: "var(--card)" }}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-24 h-20 md:w-32 md:h-24 shrink-0 rounded-lg overflow-hidden">
                      <img
                        src={photo.image_url}
                        alt={photo.title}
                        className="w-full h-full object-cover"
                      />
                      {rank < 3 && (
                        <div className="absolute top-1 left-1 w-7 h-7 rounded-md glass flex items-center justify-center text-sm">
                          {medals[rank]}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg font-semibold truncate">
                        {photo.title}
                      </h3>
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {photo.author}
                      </p>

                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex-1">
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--elevated)" }}>
                            <motion.div
                              className="h-full bg-primary rounded-full progress-glow"
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 1, delay: i * 0.1 }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-semibold shrink-0">
                          {photo.vote_count} oy
                        </span>
                        <span className="text-primary text-sm font-bold shrink-0">
                          {pct}%
                        </span>
                      </div>

                      {/* Voters */}
                      {photo.voters.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {photo.voters.slice(0, 5).map((v, vi) => (
                            <span key={vi} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--elevated)", color: "var(--text-secondary)" }}>
                              {v.voter_name || "Anonim"}
                            </span>
                          ))}
                          {photo.voters.length > 5 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full text-primary" style={{ background: "var(--elevated)" }}>
                              +{photo.voters.length - 5}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Vote button */}
                    <button
                      onClick={() => canVote && handleVote(photo.id)}
                      disabled={!canVote && !voted}
                      className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        voted
                          ? "bg-primary text-black shadow-[0_0_12px_rgba(120,190,32,0.4)]"
                          : canVote
                          ? "border border-(--border) hover:border-primary"
                          : "border border-(--border) opacity-40 cursor-not-allowed"
                      }`}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={voted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Sidebar - My Votes */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:w-72 shrink-0"
          >
            <div className="glass rounded-xl p-5 sticky top-24">
              {/* Name input - desktop only */}
              <div className="mb-4 hidden lg:block">
                <label className="text-xs uppercase tracking-widest font-semibold block mb-2" style={{ color: "var(--text-secondary)" }}>
                  İsmin (isteğe bağlı)
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    setVoterName(e.target.value);
                  }}
                  placeholder="Anonim"
                  className={`w-full px-3 py-2 rounded-lg text-sm border bg-transparent focus:outline-none transition-colors ${nameError ? "border-red-500" : "border-(--border) focus:border-primary"}`}
                />
                {nameError && <p className="text-red-400 text-xs mt-1">{nameError}</p>}
              </div>

              <div className="flex items-center gap-2 mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#78BE20" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <h3 className="font-display text-lg font-bold">Oylarım</h3>
              </div>

              {myVotedPhotos.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Henüz oy vermedin.
                </p>
              ) : (
                <div className="space-y-3">
                  {myVotedPhotos.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-2 rounded-lg"
                      style={{ background: "var(--elevated)" }}
                    >
                      <img
                        src={p.image_url}
                        alt={p.title}
                        className="w-10 h-10 rounded-md object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{p.title}</p>
                        <p className="text-xs text-primary">{p.author}</p>
                      </div>
                      <button
                        onClick={() => handleVote(p.id)}
                        className="shrink-0 text-xs text-red-400 hover:text-red-300 transition-colors"
                        title="Oyu geri al"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-(--border)">
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--text-secondary)" }}>
                    Kullanılan: {myVotes.length}/{MAX_VOTES}
                  </span>
                  <span className="text-primary font-semibold">
                    {MAX_VOTES - myVotes.length} kaldı
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
