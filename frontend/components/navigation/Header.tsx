"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Bell, 
  Sparkles, 
  User, 
  Stethoscope, 
  Users, 
  Activity, 
  ShieldAlert, 
  SlidersHorizontal,
  ChevronDown
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";

interface HeaderProps {
  onOpenCompanion?: () => void;
  activeAlertCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCompanion,
  activeAlertCount = 1
}) => {
  const pathname = usePathname();
  const [role, setRole] = useState<string>("patient");
  const [lang, setLang] = useState<string>("en");

  useEffect(() => {
    const savedRole = localStorage.getItem("demo_role") || "patient";
    setRole(savedRole);
    const savedLang = localStorage.getItem("pulseora_lang") || "en";
    setLang(savedLang);
  }, []);

  const changeLanguage = (newLang: string) => {
    setLang(newLang);
    localStorage.setItem("pulseora_lang", newLang);
    window.dispatchEvent(new Event("language_changed"));
  };

  const navLinks = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Vitals & Trends", href: "/vitals" },
    { label: "Alerts", href: "/alerts", badge: activeAlertCount > 0 ? activeAlertCount : null },
    { label: "Analytics", href: "/analytics" },
    { label: "Caregiver", href: "/caregiver" },
    { label: "Clinical", href: "/doctor" },
    { label: "⚡ Judge Demo", href: "/demo", highlight: true },
  ];

  return (
    <header className="sticky top-0 z-40 bg-emerald-deep/95 backdrop-blur-md border-b border-emerald-aurora/20 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Logo variant="white" size="sm" showTagline={false} />

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative py-1.5 transition-colors ${
                  isActive
                    ? "text-emerald-aurora font-semibold"
                    : item.highlight
                    ? "text-emerald-mint font-semibold hover:text-white"
                    : "text-emerald-mint/80 hover:text-white"
                }`}
              >
                {item.label}
                {item.badge && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-health-warning text-white">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-aurora rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          {/* AI Health Companion Trigger */}
          <button
            onClick={onOpenCompanion}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-primary/90 hover:bg-emerald-aurora hover:text-emerald-deep text-white text-xs font-semibold shadow-sm transition-all border border-emerald-aurora/30 animate-pulse-subtle"
            title="Open PULSEORA AI Health Companion"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-aurora hover:text-emerald-deep" />
            <span className="hidden sm:inline">AI Companion</span>
          </button>

          {/* Language Switcher */}
          <div className="flex items-center bg-emerald-dark/80 rounded-full p-0.5 border border-emerald-aurora/30 text-xs">
            <button
              onClick={() => changeLanguage("en")}
              className={`px-2 py-0.5 rounded-full transition-all ${
                lang === "en" ? "bg-emerald-aurora text-emerald-deep font-bold" : "text-emerald-mint hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => changeLanguage("kn")}
              className={`px-2 py-0.5 rounded-full transition-all ${
                lang === "kn" ? "bg-emerald-aurora text-emerald-deep font-bold" : "text-emerald-mint hover:text-white"
              }`}
            >
              ಕನ್ನಡ
            </button>
            <button
              onClick={() => changeLanguage("tcy")}
              className={`px-2 py-0.5 rounded-full transition-all ${
                lang === "tcy" ? "bg-emerald-aurora text-emerald-deep font-bold" : "text-emerald-mint hover:text-white"
              }`}
            >
              ತುಳು
            </button>
          </div>

          {/* Alerts Bell */}
          <Link
            href="/alerts"
            className="relative p-2 rounded-full hover:bg-emerald-dark text-emerald-mint hover:text-white transition-colors"
          >
            <Bell className="w-4 h-4" />
            {activeAlertCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-health-warning animate-ping" />
            )}
          </Link>

          {/* Role Indicator / Settings */}
          <Link
            href="/settings"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-dark border border-emerald-aurora/20 text-xs font-medium text-emerald-mint hover:text-white"
          >
            <User className="w-3.5 h-3.5 text-emerald-aurora" />
            <span className="hidden md:inline capitalize">{role}</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
