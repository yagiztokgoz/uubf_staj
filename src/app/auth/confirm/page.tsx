"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AuthConfirmPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.replace("/profile");
      }
    });

    // Zaten oturum varsa direkt yönlendir
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/profile");
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-500">Giriş yapılıyor...</p>
    </div>
  );
}
