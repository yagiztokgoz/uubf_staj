"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import Link from "next/link";

type ApplicationRow = {
  id: string;
  company_name: string;
  department: string | null;
  result: string;
  interview_note: string | null;
  experience_note: string | null;
  salary: number | null;
  rating: number | null;
  profiles: {
    gpa: number | null;
    interests: string[] | null;
    thesis_topic: string | null;
    department: string | null;
    class_year: string | null;
    minor_department: string | null;
    gender: string | null;
  } | null;
};

const NEON: Record<string, string> = {
  olumlu: "#4ade80", ret: "#f87171",
  mulakat_bekleniyor: "#22d3ee", beklemede: "#fbbf24",
  total: "#a78bfa", salary: "#fb923c", rating: "#facc15",
  erkek: "#60a5fa", kadın: "#f472b6", belirtmek: "#94a3b8",
};

const RESULT_LABELS: Record<string, string> = {
  olumlu: "Olumlu", ret: "Ret",
  mulakat_bekleniyor: "Mülakat Bekleniyor", beklemede: "Beklemede",
};

const TT = {
  contentStyle: { backgroundColor: "#0d1627", border: "1px solid rgba(34,211,238,0.15)", borderRadius: "10px", color: "#e2e8f0", fontSize: "12px" },
  labelStyle: { color: "#94a3b8" },
  cursor: { fill: "rgba(34,211,238,0.04)" },
};

const SC = "bg-slate-800/50 border border-slate-700/50 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all appearance-none";
const CARD = "bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6";

function StatCard({ label, value, sub, color = "text-slate-100" }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [companyFilter, setCompanyFilter] = useState("tümü");
  const [departmentFilter, setDepartmentFilter] = useState("tümü");
  const [resultFilter, setResultFilter] = useState("tümü");

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setLoggedIn(!!user);
      const { data } = await supabase
        .from("applications")
        .select("id, company_name, department, result, interview_note, experience_note, salary, rating, profiles(gpa, interests, thesis_topic, department, class_year, minor_department, gender)");
      setApplications((data as unknown as ApplicationRow[]) ?? []);
      setLoading(false);
    }
    loadData();
  }, []);

  const uniqueCompanies = useMemo(() => [...new Set(applications.map((a) => a.company_name))].sort(), [applications]);
  const uniqueDepts = useMemo(() =>
    [...new Set(applications.filter((a) => companyFilter === "tümü" || a.company_name === companyFilter).map((a) => a.department).filter((d): d is string => !!d))].sort(),
    [applications, companyFilter]);

  const filtered = useMemo(() => applications.filter((a) => {
    const mc = companyFilter === "tümü" || a.company_name === companyFilter;
    const md = departmentFilter === "tümü" || a.department === departmentFilter;
    const mr = resultFilter === "tümü" || a.result === resultFilter;
    return mc && md && mr;
  }), [applications, companyFilter, departmentFilter, resultFilter]);

  // — Özet —
  const total = filtered.length;
  const accepted = filtered.filter((a) => a.result === "olumlu").length;
  const acceptRate = total > 0 ? ((accepted / total) * 100).toFixed(1) : "0";
  const acceptedGPAs = filtered.filter((a) => a.result === "olumlu" && a.profiles?.gpa != null).map((a) => a.profiles!.gpa!);
  const avgGPA = acceptedGPAs.length > 0 ? (acceptedGPAs.reduce((s, g) => s + g, 0) / acceptedGPAs.length).toFixed(2) : "—";
  const salaries = filtered.filter((a) => a.salary != null && a.salary > 0).map((a) => a.salary!);
  const avgSalary = salaries.length > 0 ? Math.round(salaries.reduce((s, v) => s + v, 0) / salaries.length).toLocaleString("tr-TR") : "—";
  const ratings = filtered.filter((a) => a.rating != null).map((a) => a.rating!);
  const avgRating = ratings.length > 0 ? (ratings.reduce((s, v) => s + v, 0) / ratings.length).toFixed(1) : "—";

  // — Şirketler —
  const companyStats = Object.values(
    filtered.reduce((acc, a) => {
      const k = a.company_name;
      if (!acc[k]) acc[k] = { company: k, total: 0, olumlu: 0, ret: 0 };
      acc[k].total++; if (a.result === "olumlu") acc[k].olumlu++; if (a.result === "ret") acc[k].ret++;
      return acc;
    }, {} as Record<string, { company: string; total: number; olumlu: number; ret: number }>)
  ).sort((a, b) => b.total - a.total).slice(0, 15);

  // — Sonuç dağılımı —
  const resultDist = Object.entries(
    filtered.reduce((acc, a) => { acc[a.result] = (acc[a.result] ?? 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([result, value]) => ({ name: RESULT_LABELS[result] ?? result, value, result }));

  // — Maaş: şirket bazında ort. —
  const salaryByCompany = Object.entries(
    filtered.filter((a) => a.salary != null && a.salary > 0).reduce((acc, a) => {
      const k = a.company_name;
      if (!acc[k]) acc[k] = { sum: 0, count: 0 };
      acc[k].sum += a.salary!; acc[k].count++;
      return acc;
    }, {} as Record<string, { sum: number; count: number }>)
  ).map(([company, { sum, count }]) => ({ company, avg: Math.round(sum / count) }))
    .sort((a, b) => b.avg - a.avg).slice(0, 12);

  // — Puan: şirket bazında ort. —
  const ratingByCompany = Object.entries(
    filtered.filter((a) => a.rating != null).reduce((acc, a) => {
      const k = a.company_name;
      if (!acc[k]) acc[k] = { sum: 0, count: 0 };
      acc[k].sum += a.rating!; acc[k].count++;
      return acc;
    }, {} as Record<string, { sum: number; count: number }>)
  ).map(([company, { sum, count }]) => ({ company, avg: parseFloat((sum / count).toFixed(1)) }))
    .sort((a, b) => b.avg - a.avg).slice(0, 12);

  // — Puan dağılımı —
  const ratingDist = [1, 2, 3, 4, 5].map((r) => ({ puan: `${r} ★`, count: filtered.filter((a) => a.rating === r).length }));

  // — Maaşlı/maaşsız —
  const paidCount = filtered.filter((a) => a.salary != null && a.salary > 0).length;
  const unpaidCount = total - paidCount;
  const paidDist = [
    { name: "Ücretli", value: paidCount, key: "paid" },
    { name: "Ücretsiz / Bilinmiyor", value: unpaidCount, key: "unpaid" },
  ].filter((d) => d.value > 0);

  // — Demografik —
  const genderCounts = filtered.reduce((acc, a) => {
    const g = a.profiles?.gender ?? "belirtilmemiş";
    acc[g] = (acc[g] ?? 0) + 1; return acc;
  }, {} as Record<string, number>);
  const genderDist = Object.entries(genderCounts).map(([g, v]) => ({ name: g === "erkek" ? "Erkek" : g === "kadın" ? "Kadın" : g === "belirtmek istemiyorum" ? "Belirtmek İstemiyorum" : "Belirtilmemiş", value: v, key: g }));

  // Cinsiyet bazında kabul oranı
  const genderAccept = ["erkek", "kadın"].map((g) => {
    const apps = filtered.filter((a) => a.profiles?.gender === g);
    const acc = apps.filter((a) => a.result === "olumlu").length;
    return { gender: g === "erkek" ? "Erkek" : "Kadın", total: apps.length, accepted: acc, rate: apps.length > 0 ? parseFloat(((acc / apps.length) * 100).toFixed(1)) : 0 };
  }).filter((d) => d.total > 0);

  // Bölüm bazında
  const deptStats = ["Uçak Mühendisliği", "Uzay Mühendisliği"].map((dept) => {
    const apps = filtered.filter((a) => a.profiles?.department === dept);
    const acc = apps.filter((a) => a.result === "olumlu").length;
    return { dept: dept.replace(" Mühendisliği", ""), total: apps.length, accepted: acc, rate: apps.length > 0 ? parseFloat(((acc / apps.length) * 100).toFixed(1)) : 0 };
  }).filter((d) => d.total > 0);

  // Sınıf bazında
  const classStats = Object.entries(
    filtered.reduce((acc, a) => {
      const c = a.profiles?.class_year ?? "Belirtilmemiş";
      if (!acc[c]) acc[c] = { total: 0, accepted: 0 };
      acc[c].total++; if (a.result === "olumlu") acc[c].accepted++;
      return acc;
    }, {} as Record<string, { total: number; accepted: number }>)
  ).map(([year, { total, accepted }]) => ({ year, total, accepted, rate: parseFloat(((accepted / total) * 100).toFixed(1)) }))
    .sort((a, b) => a.year.localeCompare(b.year));

  // GPA aralığı bazında kabul oranı
  const gpaBuckets = [
    { label: "< 2.50", min: 0, max: 2.5 },
    { label: "2.50–3.00", min: 2.5, max: 3.0 },
    { label: "3.00–3.25", min: 3.0, max: 3.25 },
    { label: "3.25–3.50", min: 3.25, max: 3.5 },
    { label: "3.50–3.75", min: 3.5, max: 3.75 },
    { label: "3.75–4.00", min: 3.75, max: 4.01 },
  ].map(({ label, min, max }) => {
    const apps = filtered.filter((a) => a.profiles?.gpa != null && a.profiles.gpa >= min && a.profiles.gpa < max);
    const acc = apps.filter((a) => a.result === "olumlu").length;
    return { label, total: apps.length, accepted: acc, rate: apps.length > 0 ? parseFloat(((acc / apps.length) * 100).toFixed(1)) : 0 };
  }).filter((b) => b.total > 0);

  // İlgi alanları
  const interestCounts: Record<string, number> = {};
  filtered.forEach((a) => a.profiles?.interests?.forEach((i) => { interestCounts[i] = (interestCounts[i] ?? 0) + 1; }));
  const interestData = Object.entries(interestCounts).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([interest, count]) => ({ interest, count }));

  const acceptedInterestCounts: Record<string, number> = {};
  filtered.filter((a) => a.result === "olumlu").forEach((a) => a.profiles?.interests?.forEach((i) => { acceptedInterestCounts[i] = (acceptedInterestCounts[i] ?? 0) + 1; }));
  const acceptedInterestData = Object.entries(acceptedInterestCounts).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([interest, count]) => ({ interest, count }));

  // Çap / Yandal
  const minorCounts: Record<string, number> = {};
  filtered.forEach((a) => { const m = a.profiles?.minor_department; if (m) minorCounts[m] = (minorCounts[m] ?? 0) + 1; });
  const minorData = Object.entries(minorCounts).sort((a, b) => b[1] - a[1]).map(([minor, count]) => ({ minor, count }));
  const withMinor = filtered.filter((a) => a.profiles?.minor_department).length;

  // Yorumlar
  const comments = filtered.filter((a) => a.experience_note || a.interview_note);

  return (
    <div className="min-h-screen bg-[#020917] space-grid">
      <header className="border-b border-slate-800/50 bg-[#020917]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-bold text-slate-100">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">UUBF</span>{" "}Staj Takip
          </span>
          <nav className="flex items-center gap-5">
            {loggedIn ? (<><Link href="/profile" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">Profilim</Link><Link href="/applications" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">Başvurularım</Link></>) : (<Link href="/" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">Giriş Yap</Link>)}
            <Link href="/analytics" className="text-cyan-400 text-sm font-medium">Analitik</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Staj Analitikleri</h2>
          <p className="text-slate-500 mt-1 text-sm">Tüm öğrencilerin anonim staj verileri</p>
        </div>

        {/* Filtreler */}
        <div className={CARD}>
          <div className="flex gap-4 flex-wrap items-end">
            <div>
              <p className="text-xs text-slate-400 mb-1.5 font-medium">Şirket</p>
              <select value={companyFilter} onChange={(e) => { setCompanyFilter(e.target.value); setDepartmentFilter("tümü"); }} className={`${SC} min-w-[180px]`}>
                <option value="tümü">Tüm Şirketler</option>
                {uniqueCompanies.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {uniqueDepts.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 mb-1.5 font-medium">Birim</p>
                <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className={`${SC} min-w-[160px]`}>
                  <option value="tümü">Tüm Birimler</option>
                  {uniqueDepts.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-400 mb-1.5 font-medium">Sonuç</p>
              <div className="flex gap-2 flex-wrap">
                {["tümü", "olumlu", "ret", "mulakat_bekleniyor", "beklemede"].map((r) => (
                  <button key={r} onClick={() => setResultFilter(r)}
                    className={`px-3 py-2 rounded-lg text-xs border transition-all ${resultFilter === r ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" : "bg-slate-800/50 text-slate-400 border-slate-700/50 hover:border-slate-600/50"}`}>
                    {r === "tümü" ? "Tümü" : RESULT_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Özet kartlar */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard label="Toplam Başvuru" value={total} />
              <StatCard label="Kabul Oranı" value={`%${acceptRate}`} color="text-green-400" />
              <StatCard label="Kabul Edilen" value={accepted} color="text-green-400" />
              <StatCard label="Kabul Ort. GPA" value={avgGPA} color="text-cyan-400" />
              <StatCard label="Ort. Maaş" value={avgSalary === "—" ? "—" : `${avgSalary} ₺`} color="text-orange-400" sub={`${salaries.length} veri`} />
              <StatCard label="Ort. Puan" value={avgRating === "—" ? "—" : `${avgRating} / 5`} color="text-yellow-400" sub={`${ratings.length} değerlendirme`} />
            </div>

            <Tabs defaultValue="companies">
              <TabsList className="bg-slate-800/50 border border-slate-700/50 p-1 rounded-xl flex-wrap h-auto gap-1">
                {[["companies","Şirketler"],["salary","Maaş & Puan"],["demographic","Demografik"],["interests","İlgi Alanları"],["minor","Çap/Yandal"],["results","Sonuç Dağılımı"]].map(([v,l]) => (
                  <TabsTrigger key={v} value={v} className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400 rounded-lg text-slate-400 text-xs px-3 py-1.5">{l}</TabsTrigger>
                ))}
              </TabsList>

              {/* ── Şirketler ── */}
              <TabsContent value="companies" className="mt-4">
                <div className={CARD}>
                  <h3 className="text-base font-semibold text-slate-100 mb-5">Şirket Bazında Başvurular</h3>
                  {companyStats.length === 0 ? <p className="text-slate-500 text-center py-12">Veri yok</p> : (
                    <ResponsiveContainer width="100%" height={Math.max(300, companyStats.length * 32)}>
                      <BarChart data={companyStats} layout="vertical" margin={{ left: 10, right: 40 }}>
                        <XAxis type="number" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <YAxis type="category" dataKey="company" width={150} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <Tooltip {...TT} />
                        <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }} />
                        <Bar dataKey="total" name="Toplam" fill={NEON.total} radius={[0,4,4,0]} />
                        <Bar dataKey="olumlu" name="Kabul" fill={NEON.olumlu} radius={[0,4,4,0]} />
                        <Bar dataKey="ret" name="Ret" fill={NEON.ret} radius={[0,4,4,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </TabsContent>

              {/* ── Maaş & Puan ── */}
              <TabsContent value="salary" className="mt-4 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className={`${CARD} text-center`}>
                    <p className="text-xs text-slate-500 mb-1">Maaşlı Staj</p>
                    <p className="text-2xl font-bold text-orange-400">{total > 0 ? `%${((paidCount / total) * 100).toFixed(0)}` : "—"}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{paidCount} / {total} başvuru</p>
                  </div>
                  <div className={`${CARD} text-center`}>
                    <p className="text-xs text-slate-500 mb-1">En Yüksek Maaş</p>
                    <p className="text-2xl font-bold text-orange-400">{salaries.length > 0 ? `${Math.max(...salaries).toLocaleString("tr-TR")} ₺` : "—"}</p>
                  </div>
                  <div className={`${CARD} text-center`}>
                    <p className="text-xs text-slate-500 mb-1">En Düşük Maaş</p>
                    <p className="text-2xl font-bold text-orange-400">{salaries.length > 0 ? `${Math.min(...salaries).toLocaleString("tr-TR")} ₺` : "—"}</p>
                  </div>
                </div>

                {salaryByCompany.length > 0 && (
                  <div className={CARD}>
                    <h3 className="text-base font-semibold text-slate-100 mb-5">Şirket Bazında Ortalama Maaş (₺/ay)</h3>
                    <ResponsiveContainer width="100%" height={Math.max(280, salaryByCompany.length * 36)}>
                      <BarChart data={salaryByCompany} layout="vertical" margin={{ left: 10, right: 60 }}>
                        <XAxis type="number" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                        <YAxis type="category" dataKey="company" width={150} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <Tooltip {...TT} formatter={(v) => [typeof v === "number" ? `${v.toLocaleString("tr-TR")} ₺` : "—", "Ort. Maaş"]} />
                        <Bar dataKey="avg" name="Ort. Maaş" fill={NEON.salary} radius={[0,4,4,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={CARD}>
                    <h3 className="text-base font-semibold text-slate-100 mb-5">Puan Dağılımı</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={ratingDist}>
                        <XAxis dataKey="puan" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                        <YAxis stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <Tooltip {...TT} />
                        <Bar dataKey="count" name="Değerlendirme" radius={[4,4,0,0]}>
                          {ratingDist.map((_, i) => <Cell key={i} fill={`hsl(${40 + i * 18}, 90%, 60%)`} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {ratingByCompany.length > 0 && (
                    <div className={CARD}>
                      <h3 className="text-base font-semibold text-slate-100 mb-5">Şirket Bazında Ort. Puan</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={ratingByCompany.slice(0,8)} layout="vertical">
                          <XAxis type="number" domain={[0,5]} stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                          <YAxis type="category" dataKey="company" width={120} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                          <Tooltip {...TT} />
                          <Bar dataKey="avg" name="Ort. Puan" fill={NEON.rating} radius={[0,4,4,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ── Demografik ── */}
              <TabsContent value="demographic" className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cinsiyet dağılımı */}
                  <div className={CARD}>
                    <h3 className="text-base font-semibold text-slate-100 mb-4">Cinsiyet Dağılımı</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={genderDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}
                          label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} %${((percent ?? 0) * 100).toFixed(0)}`}>
                          {genderDist.map((e) => <Cell key={e.key} fill={NEON[e.key] ?? NEON.belirtmek} />)}
                        </Pie>
                        <Tooltip contentStyle={TT.contentStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Cinsiyet bazında kabul */}
                  {genderAccept.length > 0 && (
                    <div className={CARD}>
                      <h3 className="text-base font-semibold text-slate-100 mb-4">Cinsiyet Bazında Kabul Oranı (%)</h3>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={genderAccept}>
                          <XAxis dataKey="gender" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                          <YAxis domain={[0, 100]} stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                          <Tooltip {...TT} formatter={(v) => [`%${typeof v === "number" ? v : 0}`, "Kabul Oranı"]} />
                          <Bar dataKey="rate" name="Kabul Oranı" radius={[4,4,0,0]}>
                            {genderAccept.map((e) => <Cell key={e.gender} fill={e.gender === "Erkek" ? NEON.erkek : NEON.kadın} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Bölüm bazında */}
                {deptStats.length > 0 && (
                  <div className={CARD}>
                    <h3 className="text-base font-semibold text-slate-100 mb-4">Bölüm Bazında Başvuru & Kabul</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={deptStats}>
                        <XAxis dataKey="dept" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                        <YAxis stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <Tooltip {...TT} />
                        <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }} />
                        <Bar dataKey="total" name="Toplam" fill={NEON.total} radius={[4,4,0,0]} />
                        <Bar dataKey="accepted" name="Kabul" fill={NEON.olumlu} radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sınıf bazında */}
                  {classStats.length > 0 && (
                    <div className={CARD}>
                      <h3 className="text-base font-semibold text-slate-100 mb-4">Sınıf Bazında Başvurular</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={classStats}>
                          <XAxis dataKey="year" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                          <YAxis stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                          <Tooltip {...TT} />
                          <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }} />
                          <Bar dataKey="total" name="Toplam" fill={NEON.mulakat_bekleniyor} radius={[4,4,0,0]} />
                          <Bar dataKey="accepted" name="Kabul" fill={NEON.olumlu} radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* GPA bazında kabul */}
                  {gpaBuckets.length > 0 && (
                    <div className={CARD}>
                      <h3 className="text-base font-semibold text-slate-100 mb-4">GPA Aralığına Göre Kabul Oranı (%)</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={gpaBuckets}>
                          <XAxis dataKey="label" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 9 }} />
                          <YAxis domain={[0, 100]} stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                          <Tooltip {...TT} formatter={(v) => [`%${typeof v === "number" ? v : 0}`, "Kabul Oranı"]} />
                          <Bar dataKey="rate" name="Kabul Oranı" radius={[4,4,0,0]}>
                            {gpaBuckets.map((b, i) => <Cell key={i} fill={`hsl(${120 * (b.rate / 100)}, 80%, 55%)`} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ── İlgi Alanları ── */}
              <TabsContent value="interests" className="mt-4 space-y-4">
                {[
                  { title: "Tüm Başvuranlarda İlgi Alanları", data: interestData, color: NEON.mulakat_bekleniyor },
                  { title: "Kabul Edilenlerde İlgi Alanları", data: acceptedInterestData, color: NEON.olumlu },
                ].map(({ title, data, color }) => (
                  <div key={title} className={CARD}>
                    <h3 className="text-base font-semibold text-slate-100 mb-5">{title}</h3>
                    {data.length === 0 ? <p className="text-slate-500 text-center py-8">Veri yok</p> : (
                      <ResponsiveContainer width="100%" height={Math.max(250, data.length * 28)}>
                        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
                          <XAxis type="number" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                          <YAxis type="category" dataKey="interest" width={220} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                          <Tooltip {...TT} />
                          <Bar dataKey="count" name="Kişi" fill={color} radius={[0,4,4,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                ))}
              </TabsContent>

              {/* ── Çap/Yandal ── */}
              <TabsContent value="minor" className="mt-4">
                <div className={CARD}>
                  <div className="flex items-center gap-4 mb-5">
                    <h3 className="text-base font-semibold text-slate-100">Çap / Yandal Dağılımı</h3>
                    <span className="text-xs text-slate-500 bg-slate-800/50 border border-slate-700/50 rounded-full px-3 py-1">{withMinor} kişi çap/yandal yapıyor</span>
                  </div>
                  {minorData.length === 0 ? <p className="text-slate-500 text-center py-12">Veri yok</p> : (
                    <div className="space-y-2.5">
                      {minorData.map(({ minor, count }) => (
                        <div key={minor} className="flex items-center gap-3">
                          <span className="text-sm text-slate-300 w-72 shrink-0">{minor}</span>
                          <div className="flex-1 bg-slate-800/50 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: `${(count / withMinor) * 100}%` }} />
                          </div>
                          <span className="text-sm text-slate-400 w-6 text-right">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ── Sonuç Dağılımı ── */}
              <TabsContent value="results" className="mt-4">
                <div className={CARD}>
                  <h3 className="text-base font-semibold text-slate-100 mb-5">Sonuç Dağılımı</h3>
                  {resultDist.length === 0 ? <p className="text-slate-500 text-center py-12">Veri yok</p> : (
                    <ResponsiveContainer width="100%" height={340}>
                      <PieChart>
                        <Pie dataKey="value" nameKey="name" data={resultDist} cx="50%" cy="50%" outerRadius={130} innerRadius={60}
                          label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} %${((percent ?? 0) * 100).toFixed(0)}`}
                          labelLine={{ stroke: "#475569" }}>
                          {resultDist.map((e) => <Cell key={e.result} fill={NEON[e.result] ?? "#94a3b8"} />)}
                        </Pie>
                        <Tooltip contentStyle={TT.contentStyle} />
                        <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Yorumlar */}
            {comments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
                  Staj Yorumları
                  <span className="text-sm font-normal text-slate-500">({comments.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {comments.slice(0, 20).map((a) => {
                    const rc = { olumlu: "text-green-400 border-green-500/30 bg-green-500/10", ret: "text-red-400 border-red-500/30 bg-red-500/10", mulakat_bekleniyor: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10", beklemede: "text-amber-400 border-amber-500/30 bg-amber-500/10" }[a.result] ?? "";
                    return (
                      <div key={a.id} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-2 justify-between">
                          <div>
                            <span className="font-semibold text-slate-100 text-sm">{a.company_name}</span>
                            {a.department && <span className="text-slate-500 text-xs ml-2">— {a.department}</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            {a.rating && <span className="text-amber-400 text-xs">{"★".repeat(a.rating)}</span>}
                            {a.salary && <span className="text-orange-400/70 text-xs">{a.salary.toLocaleString("tr-TR")} ₺</span>}
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${rc}`}>{RESULT_LABELS[a.result]}</span>
                          </div>
                        </div>
                        {a.interview_note && <div><p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">Mülakat</p><p className="text-sm text-slate-300 leading-relaxed">{a.interview_note}</p></div>}
                        {a.experience_note && <div><p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">Deneyim</p><p className="text-sm text-slate-300 leading-relaxed">{a.experience_note}</p></div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
