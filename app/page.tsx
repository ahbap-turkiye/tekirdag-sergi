"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  const [introGone, setIntroGone] = useState(false);
  const [skipIntro, setSkipIntro] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("intro_seen")) {
      setSkipIntro(true);
      setIntroGone(true);
      return;
    }
    const timer = setTimeout(() => {
      setIntroGone(true);
      sessionStorage.setItem("intro_seen", "1");
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Pure CSS Cinematic Intro - no JS needed to animate */}
      {!skipIntro && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black"
          style={{
            opacity: introGone ? 0 : 1,
            transition: "opacity 0.2s ease",
            pointerEvents: introGone ? "none" : "auto",
          }}
        >
          {/* Scan lines */}
          <div className="absolute inset-0 intro-scanlines" />

          <div className="text-center px-6 flex flex-col items-center">
            {/* Camera icon - CSS spin-in */}
            <div className="intro-icon mb-6 w-20 h-20 rounded-full border-2 border-primary/50 flex items-center justify-center">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#78BE20"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" />
                <path d="M14.31 8l5.74-1.5M9.69 16l-5.74 1.5M14.31 16l2.5 5.5M9.69 8l-2.5-5.5M2 12h4M18 12h4" />
              </svg>
            </div>

            {/* Title - CSS fade in */}
            <h1 className="intro-title font-display text-4xl md:text-6xl font-bold text-white mb-3">
              Tekirdağ&apos;ın{" "}
              <span className="text-primary italic glow-text">Gözünden</span>
            </h1>

            {/* Subtitle */}
            <p className="intro-subtitle text-on-surface-variant text-lg max-w-md">
              Dijital Fotoğraf Sergisi
            </p>

            {/* Loading bar */}
            <div
              className="mt-6 h-0.5 bg-primary/20 rounded-full overflow-hidden"
              style={{ width: 200 }}
            >
              <div className="intro-bar h-full bg-primary rounded-full progress-glow" />
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center -mt-16 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-(--bg)" />
          {/* Light effects - above the overlay */}
          <div className="hero-beams" />
          <motion.div
            className="absolute inset-0 opacity-30"
            animate={{
              background: [
                "radial-gradient(ellipse at 20% 50%, rgba(120,190,32,0.15) 0%, transparent 60%)",
                "radial-gradient(ellipse at 80% 50%, rgba(120,190,32,0.15) 0%, transparent 60%)",
                "radial-gradient(ellipse at 50% 20%, rgba(120,190,32,0.15) 0%, transparent 60%)",
                "radial-gradient(ellipse at 20% 50%, rgba(120,190,32,0.15) 0%, transparent 60%)",
              ],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
          {[
            { l: 12, t: 8 },
            { l: 85, t: 22 },
            { l: 45, t: 65 },
            { l: 72, t: 40 },
            { l: 28, t: 88 },
            { l: 93, t: 55 },
            { l: 60, t: 15 },
            { l: 5, t: 72 },
            { l: 38, t: 35 },
            { l: 78, t: 92 },
            { l: 15, t: 50 },
            { l: 55, t: 78 },
            { l: 90, t: 12 },
            { l: 32, t: 58 },
            { l: 68, t: 30 },
            { l: 8, t: 95 },
            { l: 48, t: 45 },
            { l: 82, t: 68 },
            { l: 22, t: 18 },
            { l: 62, t: 82 },
          ].map((pos, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary/30"
              style={{ left: `${pos.l}%`, top: `${pos.t}%` }}
              animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2] }}
              transition={{
                duration: 3 + (i % 5),
                repeat: Infinity,
                delay: (i % 7) * 0.5,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-5 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={
              introGone ? { opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 1] } : {}
            }
            transition={{
              duration: 3.7,
              times: [0, 0.1, 0.85, 1],
              delay: 0.15,
            }}
            className="flex justify-center -mb-6"
          >
            <img
              src="/eye-gif.gif"
              alt="Camera animation"
              className="w-32 h-32 md:w-44 md:h-44"
              style={{ imageRendering: "auto" }}
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={introGone ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6"
          >
            Tekirdağ&apos;ın{" "}
            <span className="text-primary italic glow-text">Gözünden</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={introGone ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            Ahbap Tekirdağ gönüllüleri tarafından hazırlanan bu dijital sergi,
            şehrimizin gizli kalmış güzelliklerini, doğasını ve kültürel
            zenginliğini yerel fotoğrafçıların objektifinden sizlere sunuyor.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={introGone ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/gallery"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary text-black font-semibold text-base transition-all duration-300 hover:bg-primary-light hover:shadow-[0_0_30px_rgba(120,190,32,0.4)] hover:scale-105"
            >
              Sergiye Giriş Yap
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="transition-transform group-hover:translate-x-1"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/submissions"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-(--border) text-(--text) font-semibold text-base transition-all duration-300 hover:border-primary hover:shadow-[0_0_20px_rgba(120,190,32,0.2)]"
            >
              Fotoğraf Gönder
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={introGone ? { opacity: 1 } : {}}
            transition={{ delay: 1.2 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-6 h-10 rounded-full border-2 border-(--border) flex items-start justify-center p-1.5"
            >
              <motion.div
                animate={{ opacity: [1, 0], y: [0, 12] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-primary"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 px-5 md:px-16">
        <div className="max-w-360 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
              Projenin <span className="text-primary italic">Amacı</span>
            </h2>
            <p
              className="text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Bir şehrin ruhunu belirleyen şey yalnızca evleri, yapıları ve
              sokakları değildir. Ahbap Tekirdağ olarak, sanat ve dayanışmayı
              bir araya getirerek şehrimizin görsel hafızasını dijital bir
              tuvalde toplamaya çalışıyoruz.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#78BE20"
                    strokeWidth="1.5"
                  >
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                ),
                title: "Dayanışma",
                desc: "Yerel sanatçıları destekliyor, Tekirdağ’ın anlatılmayı bekleyen hikâyelerini birlikte görünür kılıyoruz. Fotoğraflarınızla bu hikâyeyi birlikte yazalım.",
              },
              {
                icon: (
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#78BE20"
                    strokeWidth="1.5"
                  >
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ),
                title: "Görsel Hafıza",
                desc: "Şehrin anılarını, mekânlarını ve doğasını yüksek çözünürlüklü fotoğraflarla kayıt altına alarak kalıcı bir “Görsel Hafıza” oluşturuyoruz.",
              },
              {
                icon: (
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#78BE20"
                    strokeWidth="1.5"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                ),
                title: "Halkın Sesi",
                desc: "En beğenilen fotoğrafları birlikte seçiyoruz. Oylayarak favori karelerin öne çıkmasına katkıda bulunabilirsiniz.",
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="luminous-border rounded-xl p-8 transition-all duration-300"
                style={{ background: "var(--card)" }}
              >
                <div className="w-14 h-14 rounded-lg flex items-center justify-center mb-5 bg-primary/10">
                  {card.icon}
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">
                  {card.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {card.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-5 md:px-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-primary/5 via-transparent to-primary/5" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative max-w-2xl mx-auto text-center"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
            Sergiye <span className="text-primary italic">Katıl</span>
          </h2>
          <p
            className="text-base mb-8"
            style={{ color: "var(--text-secondary)" }}
          >
            Tekirdağ&apos;ı senin gözünden de görmek istiyoruz. Fotoğrafını
            yükle, serginin bir parçası ol.
          </p>
          <Link
            href="/submissions"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-black font-semibold hover:bg-primary-light transition-all duration-300 hover:shadow-[0_0_30px_rgba(120,190,32,0.4)] hover:scale-105"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            Fotoğraf Gönder
          </Link>
        </motion.div>
      </section>
    </>
  );
}
