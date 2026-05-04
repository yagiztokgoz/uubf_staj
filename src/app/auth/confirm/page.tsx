"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type AuthConfirmPageProps = {
  searchParams: Promise<{
    error?: string | string[];
  }>;
};

export default function AuthConfirmPage({ searchParams }: AuthConfirmPageProps) {
  const router = useRouter();
  const resolvedSearchParams = use(searchParams);
  const error = Array.isArray(resolvedSearchParams.error)
    ? resolvedSearchParams.error[0]
    : resolvedSearchParams.error;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    if (error) {
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace("/profile");
    });

    // Zaten oturum varsa direkt yönlendir
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/profile");
        return;
      }

      setFailed(true);
    });

    return () => subscription.unsubscribe();
  }, [error, router]);

  const message = error
    ? error
    : failed
      ? "Giris baglantisi bulunamadi. Lutfen yeni bir magic link iste."
      : "Giris yapiliyor...";

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <p className="text-slate-500">{message}</p>
        {error || failed ? (
          <Link
            href="/"
            className="inline-flex rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition-colors hover:bg-slate-900"
          >
            Tekrar giris linki iste
          </Link>
        ) : null}
      </div>
    </div>
  );
}
