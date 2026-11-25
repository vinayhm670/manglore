import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(dateStr?: string | Date): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(dateStr?: string | Date): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getRiskColor(statusOrScore: string | number): {
  badge: string;
  bg: string;
  text: string;
  border: string;
} {
  let level = "Normal";
  if (typeof statusOrScore === "number") {
    if (statusOrScore >= 75) level = "Critical";
    else if (statusOrScore >= 50) level = "Warning";
    else if (statusOrScore >= 25) level = "Watch";
    else level = "Normal";
  } else {
    level = statusOrScore || "Normal";
  }

  switch (level.toLowerCase()) {
    case "critical":
      return {
        badge: "bg-health-critical text-white",
        bg: "bg-health-criticalBg",
        text: "text-health-critical",
        border: "border-health-critical/40",
      };
    case "warning":
      return {
        badge: "bg-health-warning text-white",
        bg: "bg-health-warningBg",
        text: "text-health-warning",
        border: "border-health-warning/40",
      };
    case "watch":
      return {
        badge: "bg-health-watch text-white",
        bg: "bg-health-watchBg",
        text: "text-health-watch",
        border: "border-health-watch/40",
      };
    default:
      return {
        badge: "bg-health-normal text-white",
        bg: "bg-health-normalBg",
        text: "text-health-normal",
        border: "border-health-normal/40",
      };
  }
}
