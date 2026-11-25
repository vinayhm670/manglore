"use client";

import React from "react";
import Link from "next/link";

interface LogoProps {
  variant?: "horizontal" | "icon" | "white" | "emerald" | "mobile";
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
}

export const PulseoraIcon: React.FC<{ size?: number; color?: string; ringColor?: string }> = ({
  size = 40,
  color = "#16B8A6",
  ringColor = "#087F70"
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="transition-transform duration-300 hover:scale-105"
    >
      <defs>
        <linearGradient id="pulseoraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#16B8A6" />
          <stop offset="50%" stopColor="#087F70" />
          <stop offset="100%" stopColor="#102D35" />
        </linearGradient>
        <linearGradient id="outerRingGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#16B8A6" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#D8F1E9" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#087F70" stopOpacity="0.9" />
        </linearGradient>
        <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Protective Indian-inspired 8-petaled subtle sacred mandala ring */}
      <circle
        cx="50"
        cy="50"
        r="44"
        stroke="url(#outerRingGrad)"
        strokeWidth="2.5"
        strokeDasharray="4 3"
        opacity="0.85"
      />
      <circle
        cx="50"
        cy="50"
        r="40"
        stroke="#16B8A6"
        strokeWidth="1.2"
        opacity="0.4"
      />

      {/* Biometric Vital Shield Body */}
      <circle
        cx="50"
        cy="50"
        r="34"
        fill="url(#pulseoraGrad)"
      />

      {/* Subtle mandala geometric corner nodes */}
      <circle cx="50" cy="8" r="2" fill="#16B8A6" />
      <circle cx="50" cy="92" r="2" fill="#16B8A6" />
      <circle cx="8" cy="50" r="2" fill="#16B8A6" />
      <circle cx="92" cy="50" r="2" fill="#16B8A6" />

      {/* Luminous ECG Heartbeat Waveform inside Biometric Circle */}
      <path
        d="M24 50 H36 L41 38 L46 62 L52 26 L58 70 L63 45 L67 53 L76 50"
        stroke="#FFFFFF"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glowEffect)"
      />
      
      {/* Living pulse beacon dot */}
      <circle cx="76" cy="50" r="3" fill="#16B8A6">
        <animate
          attributeName="opacity"
          values="0.4;1;0.4"
          dur="1.8s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="r"
          values="2.5;4;2.5"
          dur="1.8s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
};

export const Logo: React.FC<LogoProps> = ({
  variant = "horizontal",
  className = "",
  size = "md",
  showTagline = false,
}) => {
  const iconSizes = {
    sm: 30,
    md: 40,
    lg: 48,
    xl: 60,
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
  };

  const isWhite = variant === "white";
  const isEmerald = variant === "emerald";

  if (variant === "icon" || variant === "mobile") {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <PulseoraIcon size={iconSizes[size]} />
      </div>
    );
  }

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-3 transition-opacity hover:opacity-95 ${className}`}
    >
      <PulseoraIcon size={iconSizes[size]} />
      <div className="flex flex-col">
        <div className="flex items-center tracking-tight">
          <span
            className={`font-heading font-extrabold ${textSizes[size]} ${
              isWhite ? "text-white" : isEmerald ? "text-emerald-deep" : "text-emerald-deep"
            }`}
          >
            PULSE
          </span>
          <span
            className={`font-heading font-extrabold ${textSizes[size]} text-emerald-aurora`}
          >
            ORA
          </span>
        </div>
        {showTagline && (
          <span
            className={`text-[10px] uppercase tracking-wider font-semibold ${
              isWhite ? "text-emerald-mint" : "text-brandtext-secondary"
            }`}
          >
            Every Beat. Every Signal. Every Life.
          </span>
        )}
      </div>
    </Link>
  );
};
