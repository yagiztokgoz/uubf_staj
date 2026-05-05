"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const OTP_COOLDOWN_SECONDS = 60;
const OTP_COOLDOWN_STORAGE_PREFIX = "uubf:otp-cooldown";

function isItuEmail(value: string) {
  return /^[^\s@]+@itu\.edu\.tr$/i.test(value.trim());
}

function getCooldownStorageKey(email: string) {
  return `${OTP_COOLDOWN_STORAGE_PREFIX}:${encodeURIComponent(email)}`;
}

function getCooldownRemainingSeconds(email: string, currentTime = Date.now()) {
  if (!email || typeof window === "undefined") return 0;

  const raw = window.localStorage.getItem(getCooldownStorageKey(email));
  const until = raw ? Number(raw) : 0;
  if (!Number.isFinite(until) || until <= currentTime) {
    window.localStorage.removeItem(getCooldownStorageKey(email));
    return 0;
  }

  return Math.ceil((until - currentTime) / 1000);
}

function setCooldown(email: string, seconds: number) {
  if (!email || typeof window === "undefined") return;

  window.localStorage.setItem(
    getCooldownStorageKey(email),
    String(Date.now() + seconds * 1000)
  );
}

function formatCooldown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes} dk ${remainingSeconds.toString().padStart(2, "0")} sn`;
  }

  return `${remainingSeconds} sn`;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const normalizedEmail = email.trim().toLowerCase();
  const cooldownRemaining = getCooldownRemainingSeconds(normalizedEmail, currentTime);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    if (!isItuEmail(normalizedEmail)) {
      setError("Sadece @itu.edu.tr uzantılı e-posta adresleriyle giriş yapabilirsin.");
      return;
    }

    const remaining = getCooldownRemainingSeconds(normalizedEmail);
    if (remaining > 0) {
      setError(`Bu adrese tekrar giriş linki istemek için ${formatCooldown(remaining)} beklemelisin.`);
      return;
    }

    setLoading(true);
    setEmail(normalizedEmail);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      const msg = error.message?.toLowerCase() ?? "";
      if (msg.includes("rate limit") || msg.includes("too many") || msg.includes("exceeded") || error.status === 429) {
        setCooldown(normalizedEmail, OTP_COOLDOWN_SECONDS);
        setCurrentTime((time) => time + 1);
        setError(`Bu adrese kısa süre önce link gönderildi. ${formatCooldown(OTP_COOLDOWN_SECONDS)} sonra tekrar deneyebilir veya önceki maildeki linki kullanabilirsin.`);
      } else {
        setError(error.message);
      }
    }
    else {
      setCooldown(normalizedEmail, OTP_COOLDOWN_SECONDS);
      setCurrentTime((time) => time + 1);
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#020917] space-grid flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo / Title */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent glow-text">
              UUBF
            </span>
            <span className="text-slate-100"> Staj Takip</span>
          </h1>
          <p className="text-slate-400 text-base">
            Staj deneyimlerini paylaş, veriden ilham al
          </p>
          <p className="text-sm text-amber-400/90 bg-amber-500/10 border border-amber-500/25 rounded-lg px-4 py-2 mt-1">
            Yalnızca <span className="font-semibold">İTÜ öğrencilerine</span> açıktır — <span className="font-mono">@itu.edu.tr</span> mail adresi gereklidir
          </p>
        </div>

        {/* Bilgilendirme */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl px-5 py-4 space-y-2.5 text-sm text-slate-400">
          <div className="flex items-start gap-2.5">
            <span className="text-cyan-400 shrink-0 mt-0.5">→</span>
            <span>İTÜ mail adresinizi yazın, mailinize giriş linki gönderelim. Hesap oluşturmanıza gerek yok.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="text-cyan-400 shrink-0 mt-0.5">→</span>
            <span>Yalnızca <span className="text-slate-300 font-medium">@itu.edu.tr</span> uzantılı adreslerle giriş yapılabilir.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="text-cyan-400 shrink-0 mt-0.5">→</span>
            <span>Sistemde yalnızca girdiğiniz İTÜ mail adresi tutulmaktadır. Tüm staj verileri anonimleştirilmiş olarak saklanır ve gösterilir.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="text-cyan-400 shrink-0 mt-0.5">→</span>
            <span>Hiçbir kullanıcı hangi değerlendirmeyi kimin yaptığını ve diğer profillerin kişisel bilgilerini (GPA, bölüm vb.) <span className="text-slate-300 font-medium">kesinlikle göremez</span>. Tüm bilgiler anonim olarak sergilenir.</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 glow-cyan">
          {sent ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center justify-center mx-auto text-2xl">
                ✉️
              </div>
              <p className="font-semibold text-slate-100 text-lg">Link gönderildi!</p>
              <p className="text-sm text-slate-400">
                <span className="text-cyan-400">{email}</span> adresine giriş linki gönderdik.
              </p>
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-left text-sm text-amber-100 space-y-1">
                <p className="font-medium text-amber-300">Maili gelen kutusunda göremezsen spam / gereksiz / tanıtımlar klasörünü kontrol et.</p>
                <p className="text-amber-100/80">Link genelde birkaç dakika içinde gelir. Bazen İTÜ mailinde doğrudan spam klasörüne düşebiliyor.</p>
              </div>
              {cooldownRemaining > 0 && (
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-left text-sm text-cyan-100 space-y-1">
                  <p className="font-medium text-cyan-300">Aynı adrese yeniden link istemek için {formatCooldown(cooldownRemaining)} beklemelisin.</p>
                  <p className="text-cyan-100/80">Bu sürenin sonunda istersen aynı mail adresine yeni link alabilirsin.</p>
                </div>
              )}
              <button
                onClick={() => setSent(false)}
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-4 mt-2"
              >
                Farklı e-posta dene
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-slate-300">
                  E-posta Adresi
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="cemilhoca@itu.edu.tr"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  pattern=".+@itu\.edu\.tr"
                  title="Lütfen @itu.edu.tr uzantılı bir e-posta adresi gir."
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-slate-100 placeholder:text-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all"
                />
              </div>
              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading || (cooldownRemaining > 0 && isItuEmail(normalizedEmail))}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-all shadow-lg shadow-cyan-500/20"
              >
                {loading
                  ? "Gönderiliyor..."
                  : cooldownRemaining > 0 && isItuEmail(normalizedEmail)
                    ? `${formatCooldown(cooldownRemaining)} sonra tekrar dene`
                    : "Giriş Linki Gönder"}
              </button>
            </form>
          )}
        </div>

        <div className="text-center">
          <Link
            href="/analytics"
            className="inline-block text-xs font-medium px-4 py-2 rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)] hover:bg-red-500/20 hover:shadow-[0_0_16px_rgba(239,68,68,0.35)] transition-all"
          >
            Giriş yapmadan analitikleri görüntüle →
          </Link>
        </div>
      </div>
    </div>
  );
}
