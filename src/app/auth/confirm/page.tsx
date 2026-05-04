"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type AuthConfirmPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    next?: string | string[];
    redirect_to?: string | string[];
    token_hash?: string | string[];
    type?: string | string[];
  }>;
};

function resolveRedirectPath(rawTarget: string | null | undefined, origin: string) {
  if (!rawTarget) {
    return "/profile";
  }

  try {
    const url = new URL(rawTarget, origin);

    if (url.origin !== origin) {
      return "/profile";
    }

    if (
      url.pathname.startsWith("/auth/callback") ||
      url.pathname.startsWith("/auth/confirm")
    ) {
      return "/profile";
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/profile";
  }
}

export default function AuthConfirmPage({ searchParams }: AuthConfirmPageProps) {
  const router = useRouter();
  const resolvedSearchParams = use(searchParams);
  const error = Array.isArray(resolvedSearchParams.error)
    ? resolvedSearchParams.error[0]
    : resolvedSearchParams.error;
  const next = Array.isArray(resolvedSearchParams.next)
    ? resolvedSearchParams.next[0]
    : resolvedSearchParams.next;
  const redirectTo = Array.isArray(resolvedSearchParams.redirect_to)
    ? resolvedSearchParams.redirect_to[0]
    : resolvedSearchParams.redirect_to;
  const tokenHash = Array.isArray(resolvedSearchParams.token_hash)
    ? resolvedSearchParams.token_hash[0]
    : resolvedSearchParams.token_hash;
  const otpType = Array.isArray(resolvedSearchParams.type)
    ? resolvedSearchParams.type[0]
    : resolvedSearchParams.type;
  const [failed, setFailed] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const hasTokenLink = Boolean(tokenHash);
  const nextPath = resolveRedirectPath(
    next ?? redirectTo,
    typeof window === "undefined" ? "http://localhost" : window.location.origin
  );

  async function handleVerify() {
    if (!tokenHash || verifying) {
      return;
    }

    setVerifying(true);
    setVerificationError(null);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: (otpType ?? "email") as EmailOtpType,
    });

    if (verifyError) {
      setVerificationError(verifyError.message);
      setFailed(true);
      setVerifying(false);
      return;
    }

    router.replace(nextPath);
  }

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    if (error) {
      return () => {
        active = false;
      };
    }

    if (hasTokenLink) {
      return () => {
        active = false;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace(nextPath);
    });

    // Zaten oturum varsa direkt yönlendir
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) {
        return;
      }

      if (session) {
        router.replace(nextPath);
        return;
      }

      setFailed(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [error, hasTokenLink, nextPath, router]);

  const message = error
    ? error
    : verificationError
      ? verificationError
    : hasTokenLink
      ? "Giriş linkin hazır. Güvenlik için aşağıdaki butona tıklayarak girişi tamamla."
    : failed
      ? "Giriş bağlantısı bulunamadı. Lütfen yeni bir magic link iste."
      : "Giriş yapılıyor...";

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <p className="text-slate-500">{message}</p>
        {hasTokenLink && !verificationError ? (
          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying}
            className="inline-flex rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 transition-colors hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {verifying ? "Doğrulanıyor..." : "Girişi tamamla"}
          </button>
        ) : null}
        {error || failed ? (
          <Link
            href="/"
            className="inline-flex rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition-colors hover:bg-slate-900"
          >
            Tekrar giriş linki iste
          </Link>
        ) : null}
      </div>
    </div>
  );
}
