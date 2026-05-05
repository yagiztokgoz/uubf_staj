"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

const DEPARTMENTS = ["Uçak Mühendisliği", "Uzay Mühendisliği"];

const CLASS_YEARS = ["1. Sınıf", "2. Sınıf", "3. Sınıf", "4. Sınıf", "Yüksek Lisans", "Doktora"];

const PRESET_INTERESTS = [
  "Aerodinamik",
  "Yapısal",
  "Termal",
  "Uçuş Mekaniği",
  "Kontrol & GNC",
  "Yapay Zeka & Otonomi",
  "Robotik",
  "İtki Sistemleri",
  "Uzay Sistemleri",
  "Haberleşme & RF",
  "Sensör Sistemleri",
  "Aviyonik",
  "Simülasyon ve Modelleme",
  "Optimizasyon",
  "Üretim Teknolojileri",
];

type Profile = {
  gender: string;
  department: string;
  minor_department: string;
  class_year: string;
  gpa: string;
  interests: string[];
  thesis_topic: string;
  thesis_description: string;
  thesis_advisor: string;
  projects: string;
};

const NAV_LINK = "text-slate-400 hover:text-cyan-400 transition-colors text-sm";
const NAV_ACTIVE = "text-cyan-400 text-sm font-medium";
const INPUT_CLASS = "w-full bg-slate-800/50 border border-slate-700/50 text-slate-100 placeholder:text-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all";
const SELECT_CLASS = "w-full bg-slate-800/50 border border-slate-700/50 text-slate-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all appearance-none";
const TEXTAREA_CLASS = "w-full bg-slate-800/50 border border-slate-700/50 text-slate-100 placeholder:text-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all resize-none";
const CARD_CLASS = "bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6";
const LABEL_CLASS = "block text-sm font-medium text-slate-300 mb-1.5";
const REQUIRED_MARK = <span className="text-cyan-400">*</span>;

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [customInterest, setCustomInterest] = useState("");
  const [form, setForm] = useState<Profile>({
    gender: "", department: "", minor_department: "", class_year: "", gpa: "", interests: [],
    thesis_topic: "", thesis_description: "", thesis_advisor: "", projects: "",
  });

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/"); return; }
      setUserId(user.id);
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setForm({
          gender: data.gender ?? "",
          department: data.department ?? "",
          minor_department: data.minor_department ?? "",
          class_year: data.class_year ?? "",
          gpa: data.gpa?.toString() ?? "",
          interests: data.interests ?? [],
          thesis_topic: data.thesis_topic ?? "",
          thesis_description: data.thesis_description ?? "",
          thesis_advisor: data.thesis_advisor ?? "",
          projects: data.projects ?? "",
        });
      }
      setLoading(false);
    }
    loadProfile();
  }, [router]);

  function toggleInterest(interest: string) {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  }

  function addCustomInterest() {
    const trimmed = customInterest.trim();
    if (trimmed && !form.interests.includes(trimmed)) {
      setForm((prev) => ({ ...prev, interests: [...prev.interests, trimmed] }));
    }
    setCustomInterest("");
  }

  function getValidationError() {
    if (!form.gender) return "Cinsiyet zorunlu.";
    if (!form.department) return "Bölüm zorunlu.";
    if (!form.class_year) return "Sınıf zorunlu.";

    const gpa = form.gpa.trim();
    if (!gpa) return "GPA zorunlu.";

    const parsedGpa = parseFloat(gpa);
    if (Number.isNaN(parsedGpa) || parsedGpa < 0 || parsedGpa > 4) {
      return "GPA 0.00 ile 4.00 arasında olmalı.";
    }

    if (form.interests.length === 0) {
      return "En az bir ilgi alanı seçmelisin.";
    }

    return null;
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userId) return;

    const validationError = getValidationError();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({
      gender: form.gender,
      department: form.department,
      minor_department: form.minor_department || null,
      class_year: form.class_year,
      gpa: parseFloat(form.gpa),
      interests: form.interests,
      thesis_topic: form.thesis_topic || null,
      thesis_description: form.thesis_description || null,
      thesis_advisor: form.thesis_advisor || null,
      projects: form.projects || null,
      updated_at: new Date().toISOString(),
    }).eq("id", userId);
    if (error) toast.error("Kaydedilemedi.");
    else toast.success("Profil güncellendi!");
    setSaving(false);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020917] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020917] space-grid">
      <header className="border-b border-slate-800/50 bg-[#020917]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-bold text-slate-100">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">UUBF</span>{" "}Staj Takip
          </span>
          <nav className="flex items-center gap-5">
            <Link href="/profile" className={NAV_ACTIVE}>Profilim</Link>
            <Link href="/applications" className={NAV_LINK}>Stajlarım</Link>
            <Link href="/analytics" className={NAV_LINK}>Analitik</Link>
            <button onClick={handleSignOut} className="text-sm text-slate-500 hover:text-red-400 transition-colors">Çıkış</button>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Profilim</h2>
          <p className="text-slate-500 mt-1 text-sm">Bilgilerini doldur, staj istatistiklerine katkıda bulun</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Akademik Bilgiler */}
          <div className={CARD_CLASS}>
            <h3 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full" />
              Akademik Bilgiler
            </h3>
            <div className="mb-4">
              <label className={LABEL_CLASS}>Cinsiyet {REQUIRED_MARK}</label>
              <div className="flex gap-2">
                {[["erkek", "Erkek"], ["kadın", "Kadın"], ["belirtmek istemiyorum", "Belirtmek İstemiyorum"]].map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setForm({ ...form, gender: val })}
                    className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                      form.gender === val
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                        : "bg-slate-800/50 text-slate-400 border-slate-700/50 hover:border-slate-500/50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Bölüm {REQUIRED_MARK}</label>
                <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className={SELECT_CLASS} required>
                  <option value="">Bölüm seç...</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Sınıf {REQUIRED_MARK}</label>
                <select value={form.class_year} onChange={(e) => setForm({ ...form, class_year: e.target.value })} className={SELECT_CLASS} required>
                  <option value="">Sınıf seç...</option>
                  {CLASS_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className={LABEL_CLASS}>
                  Çap / Yandal <span className="text-slate-500 text-xs">(opsiyonel)</span>
                </label>
                <input
                  placeholder="Örn: Bilgisayar Mühendisliği ÇAP"
                  value={form.minor_department}
                  onChange={(e) => setForm({ ...form, minor_department: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>GPA {REQUIRED_MARK} <span className="text-slate-500 text-xs">(4.00 üzerinden)</span></label>
                <input
                  type="number" step="0.01" min="0" max="4" placeholder="3.50"
                  value={form.gpa}
                  onChange={(e) => setForm({ ...form, gpa: e.target.value })}
                  required
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </div>

          {/* İlgi Alanları */}
          <div className={CARD_CLASS}>
            <h3 className="text-base font-semibold text-slate-100 mb-1 flex items-center gap-2">
              <span className="w-1 h-4 bg-gradient-to-b from-purple-400 to-indigo-500 rounded-full" />
              Akademik İlgi Alanları {REQUIRED_MARK}
            </h3>
            <p className="text-xs text-slate-500 mb-4">İlgilendiğin alanları seç, dilersen özel ekle. En az bir seçim zorunlu.</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_INTERESTS.map((interest) => {
                const selected = form.interests.includes(interest);
                return (
                  <button key={interest} type="button" onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                      selected
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/20"
                        : "bg-slate-800/50 text-slate-400 border-slate-700/50 hover:border-slate-500/50 hover:text-slate-300"
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                type="text" placeholder="Özel ilgi alanı ekle..."
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomInterest())}
                className={`${INPUT_CLASS} flex-1`}
              />
              <button type="button" onClick={addCustomInterest}
                className="px-4 py-2.5 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 text-slate-300 rounded-lg text-sm transition-all">
                + Ekle
              </button>
            </div>
            {form.interests.filter((i) => !PRESET_INTERESTS.includes(i)).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {form.interests.filter((i) => !PRESET_INTERESTS.includes(i)).map((i) => (
                  <span key={i} className="px-3 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                    {i}
                    <button type="button" onClick={() => toggleInterest(i)} className="hover:text-white">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Bitirme Tezi */}
          <div className={CARD_CLASS}>
            <h3 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-gradient-to-b from-blue-400 to-cyan-500 rounded-full" />
              Bitirme Tezi
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS}>Tez Konusu <span className="text-slate-500 text-xs">(opsiyonel)</span></label>
                  <input placeholder="Örn: CFD ile Kanat Profili Optimizasyonu"
                    value={form.thesis_topic}
                    onChange={(e) => setForm({ ...form, thesis_topic: e.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>
                    Tez Danışmanı <span className="text-slate-500 text-xs">(opsiyonel)</span>
                  </label>
                  <input placeholder="Prof. Dr. ..."
                    value={form.thesis_advisor}
                    onChange={(e) => setForm({ ...form, thesis_advisor: e.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
              <div>
                <label className={LABEL_CLASS}>Kısa Açıklama <span className="text-slate-500 text-xs">(opsiyonel)</span></label>
                <textarea placeholder="Tezinizin amacı, yöntemi ve sonuçları..." rows={3}
                  value={form.thesis_description}
                  onChange={(e) => setForm({ ...form, thesis_description: e.target.value })}
                  className={TEXTAREA_CLASS}
                />
              </div>
            </div>
          </div>

          {/* Projeler */}
          <div className={CARD_CLASS}>
            <h3 className="text-base font-semibold text-slate-100 mb-1 flex items-center gap-2">
              <span className="w-1 h-4 bg-gradient-to-b from-green-400 to-emerald-500 rounded-full" />
              Projeler
            </h3>
            <p className="text-xs text-slate-500 mb-4">Yaptığın projelerden kısaca bahset <span className="text-slate-600">(opsiyonel)</span></p>
            <textarea
              placeholder="Örn: TEKNOFEST yarışmaları (roket, İHA, savaşan İHA...), proje takımları (rocketry, satellite, formula...), kişisel AR-GE projeleri, açık kaynak katkılar..."
              rows={4} value={form.projects}
              onChange={(e) => setForm({ ...form, projects: e.target.value })}
              className={TEXTAREA_CLASS}
            />
          </div>

          <div className="flex items-center justify-between">
            <button type="submit" disabled={saving}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg px-6 py-2.5 text-sm transition-all shadow-lg shadow-cyan-500/20">
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <Link href="/applications">
              <button type="button" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">
                Stajlarıma Git →
              </button>
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
