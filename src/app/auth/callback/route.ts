import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const nextPath = next?.startsWith("/") ? next : "/profile";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
    }
  }

  const errorMessage =
    requestUrl.searchParams.get("error_description") ??
    requestUrl.searchParams.get("error") ??
    "Magic link dogrulanamadi.";
  const confirmUrl = new URL("/auth/confirm", requestUrl.origin);
  confirmUrl.searchParams.set("error", errorMessage);

  return NextResponse.redirect(confirmUrl);
}
