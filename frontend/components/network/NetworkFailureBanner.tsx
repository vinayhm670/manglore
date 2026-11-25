"use client";

import React, { useState, useEffect } from "react";
import { 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Clock 
} from "lucide-react";
import { soundManager } from "@/lib/soundAlerts";

interface NetworkFailureBannerProps {
  patientId?: string;
  onStatusChange?: (status: string) => void;
}

export const NetworkFailureBanner: React.FC<NetworkFailureBannerProps> = ({
  patientId,
  onStatusChange
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [networkStatus, setNetworkStatus] = useState<string>("CONNECTED");
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [soundActive, setSoundActive] = useState<boolean>(true);

  useEffect(() => {
    setSoundActive(soundManager.isSoundEnabled());
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    // Browser online / offline listeners
    const handleOffline = () => {
      setIsOnline(false);
      setNetworkStatus("DEVICE DISCONNECTED");
      soundManager.playNetworkDisconnectedSound();
      if (onStatusChange) onStatusChange("DEVICE DISCONNECTED");
    };

    const handleOnline = () => {
      setIsOnline(true);
      setNetworkStatus("CONNECTED");
      soundManager.playNetworkRestoredSound();
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      if (onStatusChange) onStatusChange("CONNECTED");
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    // Periodic heartbeat check to backend
    const interval = setInterval(async () => {
      if (!patientId) return;
      try {
        const res = await fetch(`http://localhost:8000/api/v1/connectivity/status/${patientId}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const prevStatus = networkStatus;
          setNetworkStatus(data.status);
          setDetails(data.details);
          
          if (data.status === "DEVICE DISCONNECTED" && prevStatus !== "DEVICE DISCONNECTED") {
            soundManager.playNetworkDisconnectedSound();
          } else if (data.status === "CONNECTED" && prevStatus === "DEVICE DISCONNECTED") {
            soundManager.playNetworkRestoredSound();
          }
          if (onStatusChange) onStatusChange(data.status);
        } else {
          setNetworkStatus("SERVER UNAVAILABLE");
        }
      } catch (err) {
        // Network or server unreachable
        if (networkStatus !== "DEVICE DISCONNECTED" && networkStatus !== "SERVER UNAVAILABLE") {
          soundManager.playNetworkDisconnectedSound();
        }
        setNetworkStatus("SERVER UNAVAILABLE");
        setDetails("Failed to reach PULSEORA telemetry server. Check local WiFi.");
        if (onStatusChange) onStatusChange("SERVER UNAVAILABLE");
      }
    }, 6000);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      clearInterval(interval);
    };
  }, [patientId, networkStatus]);

  const toggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    soundManager.setSoundEnabled(next);
  };

  const handleManualRetry = async () => {
    try {
      if (patientId) {
        await fetch(`http://localhost:8000/api/v1/connectivity/restore/${patientId}`, { method: "POST" });
      }
      setNetworkStatus("CONNECTED");
      setIsOnline(true);
      soundManager.playNetworkRestoredSound();
    } catch {
      soundManager.playNetworkDisconnectedSound();
    }
  };

  if (networkStatus === "CONNECTED" && isOnline) {
    return null; // Silent when fully connected
  }

  return (
    <div
      role="alert"
      className="sticky top-16 z-40 bg-amber-500 text-white px-4 py-3 shadow-lg border-b border-amber-600 transition-all animate-bounce-subtle"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <WifiOff className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded text-[10px]">
                {networkStatus}
              </span>
              <span className="font-bold">Telemetry Connection Failure</span>
            </div>
            <p className="text-white/90 text-[11px] mt-0.5">
              {details || "Wearable or gateway connection is offline. Telemetry is queued locally. Live alerts paused."}
              {lastSyncTime && ` • Last Synced: ${lastSyncTime}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
            title={soundActive ? "Mute network warning sound" : "Unmute network sound"}
          >
            {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={handleManualRetry}
            className="px-3 py-1.5 rounded-lg bg-white text-amber-900 font-bold hover:bg-amber-100 transition-colors flex items-center gap-1.5 shadow-sm text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reconnect</span>
          </button>
        </div>
      </div>
    </div>
  );
};
