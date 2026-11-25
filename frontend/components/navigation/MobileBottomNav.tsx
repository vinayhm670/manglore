"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Activity, 
  Bell, 
  Sparkles, 
  User,
  Sliders
} from "lucide-react";

interface MobileBottomNavProps {
  onOpenCompanion: () => void;
  activeAlertCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenCompanion,
  activeAlertCount = 0
}) => {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/dashboard", icon: Home },
    { label: "Vitals", href: "/vitals", icon: Activity },
    { 
      label: "AI Companion", 
      isAction: true, 
      onClick: onOpenCompanion, 
      icon: Sparkles,
      highlight: true
    },
    { 
      label: "Alerts", 
      href: "/alerts", 
      icon: Bell,
      badge: activeAlertCount > 0 ? activeAlertCount : null
    },
    { label: "Profile", href: "/settings", icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-emerald-deep/95 backdrop-blur-lg border-t border-emerald-aurora/20 text-white safe-area-pb">
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {navItems.map((item, idx) => {
          if (item.isAction) {
            return (
              <button
                key={idx}
                onClick={item.onClick}
                className="flex flex-col items-center justify-center h-full group"
                aria-label="Open AI Assistant"
              >
                <div className="w-10 h-10 -mt-4 rounded-full bg-emerald-aurora text-emerald-deep flex items-center justify-center shadow-lg shadow-emerald-aurora/40 transition-transform active:scale-95 animate-pulse-subtle">
                  <Sparkles className="w-5 h-5 fill-current" />
                </div>
                <span className="text-[10px] font-semibold text-emerald-mint mt-1">
                  AI Companion
                </span>
              </button>
            );
          }

          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`flex flex-col items-center justify-center h-full transition-colors relative ${
                isActive ? "text-emerald-aurora font-bold" : "text-emerald-mint/70 hover:text-white"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-health-warning text-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1">{item.label}</span>
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 bg-emerald-aurora rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
