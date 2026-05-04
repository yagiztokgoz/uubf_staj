import { useId } from "react";
import { cn } from "@/lib/utils";

type SiteLogoProps = {
  variant?: "hero" | "nav";
  className?: string;
};

function RocketMark({ className }: { className?: string }) {
  const rawId = useId().replace(/:/g, "");
  const skyId = `sky-${rawId}`;
  const frameId = `frame-${rawId}`;
  const grassId = `grass-${rawId}`;
  const rocketId = `rocket-${rawId}`;

  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden="true" role="img">
      <defs>
        <linearGradient id={skyId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#d7ecff" />
          <stop offset="58%" stopColor="#b4d0e9" />
          <stop offset="100%" stopColor="#93afc6" />
        </linearGradient>
        <linearGradient id={frameId} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id={grassId} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#67c96d" />
          <stop offset="100%" stopColor="#285e31" />
        </linearGradient>
        <linearGradient id={rocketId} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="55%" stopColor="#aebbc8" />
          <stop offset="100%" stopColor="#586675" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="160" height="120" rx="24" fill={`url(#${skyId})`} />
      <path d="M0 0h160v34l-26 12-19-8-18 8-15-6-17 10-20-10-20 8L0 42Z" fill="#f4f8fc" opacity="0.78" />
      <path d="M0 78c17-11 36-14 57-11 17 2 31 3 47 0 20-3 37 1 56 14v39H0Z" fill={`url(#${grassId})`} />
      <path d="M0 92c22-9 41-11 57-8 19 3 32 3 49 0 16-3 34 0 54 10v26H0Z" fill="#173d22" opacity="0.9" />

      <g opacity="0.95">
        <path d="M16 56h110l18 18H10Z" fill="#c7d1db" />
        <path d="M22 50h99l9 6H16Z" fill="#e8edf2" />
        <rect x="31" y="60" width="12" height="11" rx="1.5" fill="#8ea0b3" />
        <rect x="47" y="60" width="12" height="11" rx="1.5" fill="#8ea0b3" />
        <rect x="63" y="60" width="12" height="11" rx="1.5" fill="#8ea0b3" />
        <rect x="79" y="60" width="12" height="11" rx="1.5" fill="#8ea0b3" />
        <rect x="95" y="60" width="12" height="11" rx="1.5" fill="#8ea0b3" />
      </g>

      <g transform="translate(38 7)">
        <ellipse cx="42" cy="101" rx="30" ry="6" fill="#0f172a" opacity="0.38" />
        <path d="M41 0c6 7 11 17 15 29l-29-1C31 17 35 7 41 0Z" fill={`url(#${frameId})`} />
        <path d="M28 28c-3 19-4 44 0 73h26c4-29 4-53 1-73Z" fill={`url(#${rocketId})`} />
        <path d="M31 28h21l-2 31-17 1Z" fill="#708396" opacity="0.75" />
        <path d="M15 48 0 63l19 7 10-14Z" fill="#7d271f" />
        <path d="M69 48 84 62l-19 8-10-14Z" fill="#7d271f" />
        <path d="M20 48 6 62l17 7 9-13Z" fill="#d45544" />
        <path d="M64 48 78 61l-18 8-8-13Z" fill="#d45544" />
        <path d="M39 44c1-2 4-3 7-3 2 0 4 0 6 1l-3 9-10 1Z" fill="#111827" opacity="0.5" />
        <circle cx="42" cy="33" r="6" fill="#111827" opacity="0.82" />
        <circle cx="42" cy="33" r="3" fill="#8ed7ff" opacity="0.9" />
        <path d="M29 100 21 116" stroke="#202f42" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M55 100 63 116" stroke="#202f42" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M42 99v17" stroke="#202f42" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M18 115h8" stroke="#0f172a" strokeWidth="3.4" strokeLinecap="round" />
        <path d="M58 115h8" stroke="#0f172a" strokeWidth="3.4" strokeLinecap="round" />
        <path d="M39 116h7" stroke="#0f172a" strokeWidth="3.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function SiteLogo({ variant = "nav", className }: SiteLogoProps) {
  const isHero = variant === "hero";

  return (
    <div
      className={cn(
        "flex items-center gap-3 text-slate-100",
        isHero && "flex-col gap-4 text-center",
        className
      )}
      aria-label="ITU UUBF Staj Takip"
    >
      <div
        className={cn(
          "overflow-hidden rounded-[1.4rem] border border-cyan-400/20 bg-slate-950/80 shadow-[0_18px_40px_rgba(8,145,178,0.18)]",
          isHero ? "w-44" : "w-14 shrink-0"
        )}
      >
        <RocketMark className="block w-full h-auto" />
      </div>

      <div className={cn("leading-none", isHero && "space-y-1")}>
        <p
          className={cn(
            "font-medium uppercase tracking-[0.28em] text-cyan-300/80",
            isHero ? "text-xs" : "text-[0.58rem]"
          )}
        >
          ITU UUBF
        </p>
        <p className={cn("font-bold tracking-tight text-slate-50", isHero ? "text-4xl" : "text-lg")}>
          Staj Takip
        </p>
      </div>
    </div>
  );
}
