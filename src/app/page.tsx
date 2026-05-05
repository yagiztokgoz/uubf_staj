"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

function isItuEmail(value: string) {
  return /^[^\s@]+@itu\.edu\.tr$/i.test(value.trim());
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    setError("");
    if (!isItuEmail(normalizedEmail)) {
      setError("Sadece @itu.edu.tr uzantılı e-posta adresleriyle giriş yapabilirsin.");
      return;
    }

    setLoading(true);
    setEmail(normalizedEmail);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
    else setSent(true);
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
        </div>

        {/* Bilgilendirme */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl px-5 py-4 space-y-2.5 text-sm text-slate-400">
          <div className="flex items-start gap-2.5">
            <span className="text-cyan-400 shrink-0 mt-0.5">→</span>
            <span>İTÜ mail adresinizi yazın, gelen kutuya giriş linki gönderelim. Hesap oluşturmanıza gerek yok.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="text-cyan-400 shrink-0 mt-0.5">→</span>
            <span>Yalnızca <span className="text-slate-300 font-medium">@itu.edu.tr</span> uzantılı adreslerle giriş yapılabilir.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="text-cyan-400 shrink-0 mt-0.5">→</span>
            <span>Sistemde yalnızca girdiğiniz İTÜ mail adresi tutulmaktadır. Tüm staj verileri anonimleştirilmiş olarak saklanır.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="text-cyan-400 shrink-0 mt-0.5">→</span>
            <span>Hiçbir kullanıcı hangi değerlendirmeyi kimin yaptığını <span className="text-slate-300 font-medium">kesinlikle göremez</span>. Tüm bilgiler anonim olarak sergilenir.</span>
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
              <p className="text-sm text-slate-400">
                Mail 5 dakika içinde gelecektir. Spam kutuna bakmayı unutma.
              </p>
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
                  onChange={(e) => setEmail(e.target.value)}
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
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-all shadow-lg shadow-cyan-500/20"
              >
                {loading ? "Gönderiliyor..." : "Giriş Linki Gönder"}
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
