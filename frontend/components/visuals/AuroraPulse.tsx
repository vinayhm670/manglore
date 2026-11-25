"use client";

import React, { useEffect, useState } from "react";

interface AuroraPulseProps {
  variant?: "hero" | "subtle" | "dashboard";
  className?: string;
  showWaveform?: boolean;
}

export const AuroraPulse: React.FC<AuroraPulseProps> = ({
  variant = "hero",
  className = "",
  showWaveform = true,
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const isHero = variant === "hero";
  const isDashboard = variant === "dashboard";

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none z-0 ${className}`}
      aria-hidden="true"
    >
      {/* Background Gradient Mesh */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${
          isHero
            ? "bg-gradient-to-br from-[#0c232a] via-[#102D35] to-[#0d3d3a]"
            : isDashboard
            ? "bg-[#F7F8F4]"
            : "bg-gradient-to-b from-[#102D35]/10 to-transparent"
        }`}
      />

      {/* Aurora Flowing Ribbons */}
      {!prefersReducedMotion && (
        <>
          <div
            className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[90px] opacity-40 transition-all ${
              isHero ? "bg-[#16B8A6]" : "bg-[#16B8A6]/20"
            } animate-aurora-flow`}
          />
          <div
            className={`absolute top-1/4 -right-24 w-80 h-80 rounded-full blur-[100px] opacity-35 ${
              isHero ? "bg-[#087F70]" : "bg-[#087F70]/15"
            } animate-aurora-flow`}
            style={{ animationDelay: "-5s" }}
          />
          <div
            className={`absolute -bottom-24 left-1/3 w-[32rem] h-[32rem] rounded-full blur-[120px] opacity-25 ${
              isHero ? "bg-[#164B49]" : "bg-[#D8F1E9]/40"
            } animate-aurora-flow`}
            style={{ animationDelay: "-9s" }}
          />
        </>
      )}

      {/* Translucent Biometric Concentric Circles with Scanning Animation */}
      <div className="absolute right-6 top-12 opacity-20 hidden md:block">
        <svg width="340" height="340" viewBox="0 0 340 340" fill="none">
          <circle cx="170" cy="170" r="150" stroke="#16B8A6" strokeWidth="1" strokeDasharray="6 8" />
          <circle cx="170" cy="170" r="110" stroke="#087F70" strokeWidth="1" strokeDasharray="3 4" />
          <circle cx="170" cy="170" r="70" stroke="#16B8A6" strokeWidth="1.5" />
          <line x1="170" y1="20" x2="170" y2="320" stroke="#16B8A6" strokeWidth="0.8" strokeDasharray="4 4" />
          <line x1="20" y1="170" x2="320" y2="170" stroke="#16B8A6" strokeWidth="0.8" strokeDasharray="4 4" />
          {!prefersReducedMotion && (
            <circle cx="170" cy="170" r="110" stroke="#16B8A6" strokeWidth="2.5" strokeDasharray="30 180">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 170 170"
                to="360 170 170"
                dur="12s"
                repeatCount="indefinite"
              />
            </circle>
          )}
        </svg>
      </div>

      {/* Luminous ECG Heartbeat Waveform Strip */}
      {showWaveform && isHero && (
        <div className="absolute bottom-6 left-0 right-0 h-28 opacity-30 overflow-hidden">
          <svg
            className="w-full h-full"
            preserveAspectRatio="none"
            viewBox="0 0 1200 120"
            fill="none"
          >
            <path
              d="M0 60 L180 60 L200 60 L210 35 L220 90 L235 15 L250 105 L265 48 L275 68 L285 60 L500 60 L515 60 L525 35 L535 90 L550 15 L565 105 L580 48 L590 68 L600 60 L850 60 L865 35 L875 90 L890 15 L905 105 L920 48 L930 68 L940 60 L1200 60"
              stroke="#16B8A6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {!prefersReducedMotion && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#16B8A6]/30 to-transparent w-48 h-full animate-ecg-scan" />
          )}
        </div>
      )}

      {/* Fine Medical Data Grid Lines */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(#16B8A6 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
};
