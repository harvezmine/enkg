"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { aboutVideos } from "@/content/about";

import { Icon } from "./icons";

const FRAME =
  "relative flex-1 overflow-hidden rounded-[1.25rem] bg-navy-100 shadow-lit ring-1 ring-ink/5 sm:rounded-[1.5rem]";

/**
 * Dua klip berdampingan, yang kanan digeser turun. Sejajar rata akan terbaca
 * seperti dua kotak yang kebetulan bersebelahan; selisih tinggi itulah yang
 * membuat pasangan ini terbaca sebagai satu susunan yang memang dirancang.
 *
 * Lebarnya dari flex, tingginya dari rasio asli klip, jadi tidak ada sisi yang
 * terpotong dan keduanya selalu sama besar.
 *
 * ⚠️ Komponen ini tidak boleh dibungkus <Reveal>. Animasi masuk AOS memasang
 * opacity:0 dan clip-path pada pembungkusnya, dan Safari menolak memutar video
 * yang elemennya belum terlihat. Chrome tidak peduli, jadi kerusakannya hanya
 * muncul di Safari. Lihat sections/about.tsx.
 */
export function AboutClips({ className = "" }: { className?: string }) {
  const refs = useRef<(HTMLVideoElement | null)[]>([]);
  const pausedByUser = useRef(false);
  const [playing, setPlaying] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const anyVideo = aboutVideos.some((clip) => clip.src);

  /**
   * Klip tetap berjalan sendiri meski sistem minta reduced motion: syarat WCAG
   * 2.2.2 adalah *tersedianya* cara menghentikan, bukan tidak boleh berjalan.
   * Yang berubah cuma tombol jedanya, dari muncul saat disentuh jadi selalu
   * terlihat, supaya yang terganggu gerakan bisa langsung mematikannya.
   */
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  /**
   * Penolakan play() tidak boleh ditelan diam-diam: Safari menolaknya saat hemat
   * daya menyala atau saat autoplay dimatikan per situs, dan yang tersisa cuma
   * poster membeku yang terlihat seperti situs rusak.
   *
   * Tapi jenis errornya harus dibedakan. `pause()` membatalkan play() yang masih
   * berjalan, dan pembatalan itu muncul sebagai AbortError — kejadian biasa saat
   * orang menggulir cepat melewati video, bukan tanda autoplay diblokir. Hanya
   * NotAllowedError yang benar-benar berarti browser menolak.
   */
  const tryPlay = useCallback((video: HTMLVideoElement) => {
    video.muted = true;
    const started = video.play();
    if (!started) return;
    started
      .then(() => setBlocked(false))
      .catch((error: DOMException) => {
        if (error?.name === "NotAllowedError") setBlocked(true);
      });
  }, []);

  /**
   * Atribut `autoplay` saja tidak cukup diandalkan, dan penghemat daya
   * menghentikan video di luar layar. Jadi begitu klip masuk layar, play()
   * dipanggil sendiri; begitu keluar, dijeda supaya tidak ada dua video jalan
   * percuma di latar. `pausedByUser` menjaga keputusan pengguna: kalau dia
   * menekan jeda, scroll tidak boleh menyalakannya lagi.
   */
  useEffect(() => {
    const videos = refs.current.filter((video): video is HTMLVideoElement => Boolean(video));
    if (!videos.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            if (!pausedByUser.current) tryPlay(video);
          } else if (!video.paused) {
            video.pause();
          }
        }
      },
      // Tanpa margin, dan menunggu sebagian klip benar-benar terlihat: Safari
      // menolak memutar video yang masih di luar layar.
      { threshold: 0.15 },
    );
    videos.forEach((video) => observer.observe(video));
    return () => observer.disconnect();
  }, [tryPlay]);

  /**
   * Kalau browser sempat menolak, sentuhan pertama di mana pun pada halaman
   * dipakai untuk mencoba lagi. Setelah ada gestur pengguna, Safari selalu
   * mengizinkan play(), jadi klipnya menyala tanpa perlu menemukan tombolnya.
   */
  useEffect(() => {
    if (!blocked) return;
    const retry = () => {
      if (pausedByUser.current) return;
      refs.current.forEach((video) => video && tryPlay(video));
    };
    const events = ["pointerdown", "keydown", "touchstart"] as const;
    events.forEach((event) => window.addEventListener(event, retry, { once: true, passive: true }));
    return () => events.forEach((event) => window.removeEventListener(event, retry));
  }, [blocked, tryPlay]);

  // Satu tombol untuk dua klip. Dua tombol di dua sudut yang berbeda tinggi
  // hanya menambah ramai, padahal yang dimau pengguna cuma "hentikan geraknya".
  const toggle = () => {
    const next = !playing;
    pausedByUser.current = !next;
    refs.current.forEach((video) => {
      if (!video) return;
      if (next) tryPlay(video);
      else video.pause();
    });
    setPlaying(next);
  };

  const start = () => {
    pausedByUser.current = false;
    refs.current.forEach((video) => video && tryPlay(video));
    setPlaying(true);
  };

  return (
    <div className={className}>
      <div className="group relative flex items-start gap-3 sm:gap-4">
        {aboutVideos.map((clip, index) => (
          <div
            key={clip.poster}
            className={`${FRAME} ${index === 1 ? "mt-8 sm:mt-12 lg:mt-14" : ""}`}
            style={{ aspectRatio: `${clip.width} / ${clip.height}` }}
          >
            {clip.src ? (
              <video
                ref={(node) => {
                  refs.current[index] = node;
                  if (node) node.muted = true;
                }}
                src={clip.src}
                poster={clip.poster}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-label={clip.alt}
                {...(index === 0 ? { onPlay: () => setPlaying(true) } : {})}
                className="h-full w-full object-cover"
              />
            ) : (
              <Image
                src={clip.poster}
                alt={clip.alt}
                fill
                sizes="(min-width: 1280px) 300px, (min-width: 1024px) 220px, 45vw"
                className="object-cover"
              />
            )}
          </div>
        ))}

        {anyVideo && blocked && (
          <button
            type="button"
            onClick={start}
            aria-label="Putar video"
            className="absolute inset-0 grid place-items-center rounded-[1.25rem] bg-navy-950/35 backdrop-blur-[2px] transition sm:rounded-[1.5rem]"
          >
            <span className="grid h-16 w-16 place-items-center rounded-full bg-cream-50 text-navy-700 shadow-deep transition group-hover:scale-105">
              <Icon.play className="ml-0.5 h-6 w-6" />
            </span>
          </button>
        )}

        {anyVideo && !blocked && (
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Jeda video" : "Putar video"}
            className={`absolute right-2.5 bottom-2.5 grid h-10 w-10 place-items-center rounded-full bg-navy-950/60 text-cream-100 ring-1 ring-white/15 backdrop-blur transition duration-300 ease-out-soft hover:bg-navy-950/85 ${
              reduceMotion ? "" : "lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
            }`}
          >
            {playing ? <Icon.pause className="h-4 w-4" /> : <Icon.play className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
