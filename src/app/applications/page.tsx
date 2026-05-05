"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Application = {
  id: string;
  company_name: string;
  department: string | null;
  result: string;
  rejection_stage: string | null;
  found_with_referral: boolean | null;
  interview_note: string | null;
  experience_note: string | null;
  period: string | null;
  salary: number | null;
  rating: number | null;
};

type FormState = {
  company_name: string;
  department: string;
  result: string;
  rejection_stage: string;
  interview_note: string;
  experience_note: string;
  period: string;
  salary: string;
  rating: number | null;
  found_with_referral: boolean;
};

type AuthIdentity = {
  id: string;
  email?: string | null;
};

type ProfileGate = {
  gender: string | null;
  department: string | null;
  class_year: string | null;
  gpa: number | null;
  interests: string[] | null;
};

const RESULT_STYLE: Record<string, { label: string; cls: string }> = {
  beklemede:           { label: "Beklemede",         cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  mulakat_bekleniyor:  { label: "Mülakat Bekleniyor", cls: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  olumlu:              { label: "Olumlu",             cls: "bg-green-500/15 text-green-400 border-green-500/30" },
  staji_bitirdim:      { label: "Stajı Bitirdim",     cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  ret:                 { label: "Ret",                cls: "bg-red-500/15 text-red-400 border-red-500/30" },
};

const RESULT_OPTIONS = [
  { value: "beklemede", label: "Beklemede" },
  { value: "mulakat_bekleniyor", label: "Mülakat Bekleniyor" },
  { value: "olumlu", label: "Olumlu" },
  { value: "staji_bitirdim", label: "Stajı Bitirdim" },
  { value: "ret", label: "Ret" },
];

const SEASON_ORDER: Record<string, number> = { Bahar: 0, Yaz: 1, Güz: 2 };

function currentPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const season = month <= 5 ? "Bahar" : month <= 8 ? "Yaz" : "Güz";
  return `${year} ${season}`;
}

function generatePeriods(): string[] {
  const currentYear = new Date().getFullYear();
  const periods: string[] = [];
  for (let year = currentYear; year >= 2024; year--) {
    for (const season of ["Güz", "Yaz", "Bahar"]) {
      periods.push(`${year} ${season}`);
    }
  }
  return periods;
}

function sortByPeriod(a: Application, b: Application): number {
  const parse = (p: string | null): [number, number] => {
    if (!p) return [0, 0];
    const [year, season] = p.split(" ");
    return [parseInt(year) || 0, SEASON_ORDER[season] ?? 0];
  };
  const [ya, sa] = parse(a.period);
  const [yb, sb] = parse(b.period);
  return yb !== ya ? yb - ya : sb - sa;
}

const EMPTY_FORM: FormState = {
  company_name: "", department: "", result: "beklemede",
  rejection_stage: "",
  interview_note: "", experience_note: "",
  period: currentPeriod(),
  salary: "", rating: null, found_with_referral: false,
};

const INPUT_CLASS = "w-full bg-slate-800/50 border border-slate-700/50 text-slate-100 placeholder:text-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all";
const SELECT_CLASS = "w-full bg-slate-800/50 border border-slate-700/50 text-slate-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all appearance-none";
const TEXTAREA_CLASS = "w-full bg-slate-800/50 border border-slate-700/50 text-slate-100 placeholder:text-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all resize-none";
const LABEL_CLASS = "block text-sm font-medium text-slate-300 mb-1.5";
const NAV_LINK = "text-slate-400 hover:text-cyan-400 transition-colors text-sm";
const NAV_ACTIVE = "text-cyan-400 text-sm font-medium";

function normalizeUppercase(value: string) {
  return value.toLocaleUpperCase("tr-TR");
}

async function ensureProfileExists(
  user: AuthIdentity
) {
  const supabase = createClient();
  const email = user.email?.trim();

  if (!email) {
    return { error: new Error("Kullanıcı e-postası bulunamadı.") };
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email,
    },
    { onConflict: "id" }
  );

  return { error };
}

function getIncompleteProfileMessage(profile: ProfileGate | null) {
  if (!profile) {
    return "Başvuru yapmadan önce profilini doldurmalısın.";
  }

  if (!profile.gender) return "Başvuru yapmadan önce profilindeki cinsiyet alanını doldurmalısın.";
  if (!profile.department) return "Başvuru yapmadan önce profilindeki bölüm alanını doldurmalısın.";
  if (!profile.class_year) return "Başvuru yapmadan önce profilindeki sınıf alanını doldurmalısın.";
  if (profile.gpa == null) return "Başvuru yapmadan önce profilindeki GPA alanını doldurmalısın.";
  if (!profile.interests || profile.interests.length === 0) {
    return "Başvuru yapmadan önce en az bir ilgi alanı seçmelisin.";
  }

  return null;
}

async function requireCompletedProfile(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("gender, department, class_year, gpa, interests")
    .eq("id", userId)
    .single();

  if (error) {
    return {
      error,
      message: "Profil bilgileri kontrol edilemedi.",
    };
  }

  return {
    error: null,
    message: getIncompleteProfileMessage(data as ProfileGate | null),
  };
}

export default function ApplicationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [allPairs, setAllPairs] = useState<{ company: string; dept: string | null }[]>([]);

  const companySuggestions = useMemo(
    () => [...new Set(allPairs.map((p) => p.company))].sort(),
    [allPairs]
  );
  const deptSuggestions = useMemo(() => {
    const base = form.company_name.trim()
      ? allPairs.filter((p) => p.company === form.company_name.trim()).map((p) => p.dept)
      : allPairs.map((p) => p.dept);
    return [...new Set(base.filter((d): d is string => !!d))].sort();
  }, [allPairs, form.company_name]);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/"); return; }
      const { error: profileBootstrapError } = await ensureProfileExists({ id: user.id, email: user.email });
      if (profileBootstrapError) {
        toast.error(profileBootstrapError.message);
        router.replace("/profile");
        return;
      }

      const { message: profileMessage } = await requireCompletedProfile(user.id);
      if (profileMessage) {
        toast.error(profileMessage);
        router.replace("/profile");
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email ?? null);
      const [{ data: appsData }, { data: analyticsData }] = await Promise.all([
        supabase.from("applications").select("*").eq("user_id", user.id),
        supabase.from("analytics_applications_anonymous").select("company_name, application_department"),
      ]);
      setApplications((appsData ?? []).sort(sortByPeriod));
      setAllPairs((analyticsData ?? []).map((r) => ({ company: r.company_name, dept: r.application_department })));
      setLoading(false);
    }
    loadData();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);

    const { error: profileError } = await ensureProfileExists({
      id: userId,
      email: userEmail,
    });

    if (profileError) {
      toast.error(profileError.message);
      setSaving(false);
      return;
    }

    const { message: profileMessage } = await requireCompletedProfile(userId);
    if (profileMessage) {
      toast.error(profileMessage);
      setSaving(false);
      router.replace("/profile");
      return;
    }

    const supabase = createClient();
    const payload = {
      company_name: normalizeUppercase(form.company_name.trim()),
      department: form.department.trim() ? normalizeUppercase(form.department.trim()) : null,
      result: form.result,
      rejection_stage: form.result === "ret" && form.rejection_stage ? form.rejection_stage : null,
      found_with_referral: form.found_with_referral,
      interview_note: form.interview_note.trim() || null,
      experience_note: form.experience_note.trim() || null,
      period: form.period,
      ...(form.salary.trim() ? { salary: parseInt(form.salary, 10) } : {}),
      ...(form.rating !== null ? { rating: form.rating } : {}),
    };

    if (editingId) {
      const { error } = await supabase.from("applications").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", editingId);
      if (error) {
        console.error("Application update failed", error);
        toast.error(error.message || "Güncellenemedi.");
        setSaving(false);
        return;
      }

      toast.success("Başvuru güncellendi!");
      setApplications((p) =>
        p.map((a) =>
          a.id === editingId
            ? {
                ...a,
                ...payload,
                salary: "salary" in payload ? payload.salary ?? null : a.salary,
                rating: "rating" in payload ? payload.rating ?? null : a.rating,
              }
            : a
        ).sort(sortByPeriod)
      );
    } else {
      const { data, error } = await supabase.from("applications").insert({ ...payload, user_id: userId }).select().single();
      if (error) {
        console.error("Application insert failed", error);
        toast.error(error.message || "Eklenemedi.");
        setSaving(false);
        return;
      }

      toast.success("Başvuru eklendi!");
      setApplications((p) => [data, ...p].sort(sortByPeriod));
    }

    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
    setSaving(false);
  }

  function handleEdit(app: Application) {
    setForm({
      company_name: normalizeUppercase(app.company_name),
      department: app.department ? normalizeUppercase(app.department) : "",
      result: app.result,
      found_with_referral: Boolean(app.found_with_referral),
      interview_note: app.interview_note ?? "",
      experience_note: app.experience_note ?? "",
      period: app.period ?? currentPeriod(),
      salary: app.salary?.toString() ?? "",
      rating: app.rating,
      rejection_stage: app.rejection_stage ?? "",
    });
    setEditingId(app.id); setShowForm(true);
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("applications").delete().eq("id", id);
    if (error) toast.error("Silinemedi.");
    else { setApplications((p) => p.filter((a) => a.id !== id)); toast.success("Silindi."); }
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
            <Link href="/profile" className={NAV_LINK}>Profilim</Link>
            <Link href="/applications" className={NAV_ACTIVE}>Stajlarım</Link>
            <Link href="/analytics" className={NAV_LINK}>Analitik</Link>
            <button onClick={handleSignOut} className="text-sm text-slate-500 hover:text-red-400 transition-colors">Çıkış</button>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Stajlarım</h2>
            <p className="text-slate-500 mt-0.5 text-sm">{applications.length} başvuru</p>
          </div>
          <button
            onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); }}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium rounded-lg px-5 py-2.5 text-sm transition-all shadow-lg shadow-cyan-500/20"
          >
            + Staj Ekle
          </button>
        </div>

        {showForm && (
          <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3 text-sm text-amber-200 flex items-start gap-2 mb-5">
              <span className="shrink-0 font-bold">!</span>
              <span>
                <strong>Birim / departman adını tutarlı yazmaya özen gösterin.</strong>{" "}
                Büyük harf otomatik uygulanır. Örn: UÇUŞ BİLİMLERİ, YAPISAL TEKNOLOJİLER, GÖMÜLÜ YAZILIM
              </span>
            </div>
            <h3 className="text-base font-semibold text-slate-100 mb-5 flex items-center gap-2">
              <span className="w-1 h-4 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full" />
              {editingId ? "Stajı Düzenle" : "Yeni Staj"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS}>Şirket Adı *</label>
                  <input list="company-list" placeholder="BAYKAR, TAI, TUSAŞ..." value={form.company_name} onChange={(e) => setForm({ ...form, company_name: normalizeUppercase(e.target.value) })} required className={INPUT_CLASS} />
                  <datalist id="company-list">
                    {companySuggestions.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Birim / Departman</label>
                  <input list="dept-list" placeholder="UÇUŞ BİLİMLERİ, YAPISAL..." value={form.department} onChange={(e) => setForm({ ...form, department: normalizeUppercase(e.target.value) })} className={INPUT_CLASS} />
                  <datalist id="dept-list">
                    {deptSuggestions.map((d) => <option key={d} value={d} />)}
                  </datalist>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS}>Sonuç</label>
                  <select value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value, rejection_stage: "" })} className={SELECT_CLASS}>
                    {RESULT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Dönem</label>
                  <select value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} className={SELECT_CLASS}>
                    {generatePeriods().map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
              {form.result === "ret" && (
                <div>
                  <label className={LABEL_CLASS}>Ret Aşaması <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400 ml-1">opsiyonel</span></label>
                  <div className="flex gap-2 flex-wrap">
                    {["Genel Yetenek", "İK Mülakatı", "Teknik Mülakat"].map((stage) => (
                      <button key={stage} type="button"
                        onClick={() => setForm({ ...form, rejection_stage: form.rejection_stage === stage ? "" : stage })}
                        className={`px-3 py-2 rounded-lg text-xs border transition-all ${
                          form.rejection_stage === stage
                            ? "bg-red-500/20 text-red-300 border-red-500/40"
                            : "bg-slate-800/50 text-slate-400 border-slate-700/50 hover:border-slate-600/50"
                        }`}
                      >{stage}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS}>Günlük Ücret <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400 ml-1">opsiyonel</span></label>
                  <input type="number" min="0" placeholder="600" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className={INPUT_CLASS} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Genel Değerlendirme <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400 ml-1">opsiyonel</span></label>
                  <div className="flex gap-2 mt-1">
                    {[1,2,3,4,5].map((n) => (
                      <button key={n} type="button" onClick={() => setForm({ ...form, rating: form.rating === n ? null : n })}
                        className={`w-9 h-9 rounded-lg text-sm font-bold border transition-all ${
                          form.rating !== null && n <= form.rating
                            ? "bg-amber-500/30 text-amber-300 border-amber-500/50"
                            : "bg-slate-800/50 text-slate-500 border-slate-700/50 hover:border-slate-500/50"
                        }`}
                      >{n}</button>
                    ))}
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-800/30 px-4 py-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.found_with_referral}
                  onChange={(e) => setForm({ ...form, found_with_referral: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500/40"
                />
                Stajı torpille buldum
              </label>
              <div>
                <label className={LABEL_CLASS}>Mülakat Notu <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400 ml-1">opsiyonel</span></label>
                <textarea placeholder="Mülakat süreci, sorulan sorular..." rows={2} value={form.interview_note} onChange={(e) => setForm({ ...form, interview_note: e.target.value })} className={TEXTAREA_CLASS} />
              </div>
              <div>
                <label className={LABEL_CLASS}>Staj Deneyimi <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400 ml-1">opsiyonel</span></label>
                <textarea placeholder="Staj boyunca neler yaptın, neler öğrendin..." rows={3} value={form.experience_note} onChange={(e) => setForm({ ...form, experience_note: e.target.value })} className={TEXTAREA_CLASS} />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-medium rounded-lg px-5 py-2 text-sm transition-all">
                  {saving ? "Kaydediliyor..." : editingId ? "Güncelle" : "Ekle"}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }} className="px-5 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 text-slate-300 rounded-lg text-sm transition-all">
                  İptal
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-3">
          {applications.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl py-16 text-center text-slate-500">
              Henüz başvuru eklemedin. Yukarıdan ekleyebilirsin.
            </div>
          ) : (
            applications.map((app) => {
              const r = RESULT_STYLE[app.result] ?? RESULT_STYLE.beklemede;
              return (
                <div key={app.id} className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/50 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-100">{app.company_name}</span>
                        {app.department && <span className="text-slate-500 text-sm">— {app.department}</span>}
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${r.cls}`}>{r.label}</span>
                        {app.result === "ret" && app.rejection_stage && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium border border-red-500/20 bg-red-500/10 text-red-400">
                            {app.rejection_stage}
                          </span>
                        )}
                        {app.found_with_referral ? (
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium border border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300">
                            Torpille Bulundu
                          </span>
                        ) : null}
                      </div>
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                          {app.period && <span>{app.period}</span>}
                          {app.salary && <span className="text-amber-400/70">{app.salary.toLocaleString("tr-TR")} ₺/gün</span>}
                          {app.rating && <span className="text-amber-400">{"★".repeat(app.rating)}{"☆".repeat(5 - app.rating)}</span>}
                        </div>
                      {app.interview_note && (
                        <p className="text-sm text-slate-400"><span className="text-slate-300 font-medium">Mülakat:</span> {app.interview_note}</p>
                      )}
                      {app.experience_note && (
                        <p className="text-sm text-slate-400"><span className="text-slate-300 font-medium">Deneyim:</span> {app.experience_note}</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleEdit(app)} className="px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 text-slate-300 rounded-lg text-xs transition-all">Düzenle</button>
                      <button onClick={() => handleDelete(app.id)} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-xs transition-all">Sil</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
