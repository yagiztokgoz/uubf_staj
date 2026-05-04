import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function resolveRedirectPath(rawTarget: string | null, origin: string) {
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

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") ?? "email";
  const redirectTarget =
    requestUrl.searchParams.get("next") ??
    requestUrl.searchParams.get("redirect_to");
  const nextPath = resolveRedirectPath(redirectTarget, requestUrl.origin);
  let authErrorMessage: string | null = null;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
    }

    authErrorMessage = error.message;
  }

  if (tokenHash) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });

    if (!error) {
      return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
    }

    authErrorMessage = error.message;
  }

  const errorMessage =
    requestUrl.searchParams.get("error_description") ??
    requestUrl.searchParams.get("error") ??
    authErrorMessage ??
    "Magic link dogrulanamadi.";
  const confirmUrl = new URL("/auth/confirm", requestUrl.origin);
  confirmUrl.searchParams.set("error", errorMessage);

  return NextResponse.redirect(confirmUrl);
}
