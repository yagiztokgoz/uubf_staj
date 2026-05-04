import { NextResponse } from "next/server";

// Implicit flow'da token URL hash'inde gelir, client-side page handle eder.
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/auth/confirm`);
}
