"use client";

import React, { useState, useEffect } from "react";
import { 
  User, 
  ShieldCheck, 
  Globe, 
  Bell, 
  Lock, 
  Download, 
  Trash2, 
  CheckCircle2, 
  Smartphone,
  Users
} from "lucide-react";
import { Header } from "@/components/navigation/Header";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { AICompanionModal } from "@/components/companion/AICompanionModal";

export default function SettingsPage() {
  const [isCompanionOpen, setIsCompanionOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("account");
  const [lang, setLang] = useState<string>("en");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Consents state
  const [consents, setConsents] = useState({
    telemetry: true,
    aiChatHistory: true,
    caregiverSharing: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem("pulseora_lang");
    if (saved) setLang(saved);
  }, []);

  const handleSave = () => {
    localStorage.setItem("pulseora_lang", lang);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const tabs = [
    { id: "account", label: "Account & Profile", icon: User },
    { id: "health", label: "Health Baselines", icon: ShieldCheck },
    { id: "language", label: "Language & Voice", icon: Globe },
    { id: "caregivers", label: "Caregiver Links", icon: Users },
    { id: "notifications", label: "Alert Notifications", icon: Bell },
    { id: "privacy", label: "Privacy & Consents", icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-surface-ivory pb-20 lg:pb-12 text-brandtext-primary">
      <Header onOpenCompanion={() => setIsCompanionOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-emerald-deep">
            System & Personal Settings
          </h1>
          <p className="text-xs sm:text-sm text-brandtext-secondary mt-1">
            Manage your account, biometric threshold preferences, language, caregiver access, and clinical privacy consents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Tabs Menu (4 cols) */}
          <div className="md:col-span-4 space-y-2">
            <div className="bg-white p-3 rounded-2xl border border-surface-border shadow-sm space-y-1">
              {tabs.map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-emerald-deep text-white shadow-sm"
                        : "text-brandtext-primary hover:bg-surface-ivory"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Device Info Card */}
            <div className="bg-emerald-mint/20 p-4 rounded-2xl border border-emerald-aurora/30 text-xs text-brandtext-secondary space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-deep">
                <Smartphone className="w-4 h-4 text-emerald-primary" />
                <span>Connected Wearable Hardware</span>
              </div>
              <p>Model: PULSEORA CareBand Elite V2.4</p>
              <p>Firmware: v2.10.8 (Ambulatory ECG + PPG Sensor Array)</p>
              <div className="pt-2 flex items-center gap-2 text-health-normal font-semibold">
                <span className="w-2 h-2 rounded-full bg-health-normal" />
                <span>Firmware up to date</span>
              </div>
            </div>
          </div>

          {/* Tab Content Panel (8 cols) */}
          <div className="md:col-span-8 bg-white p-6 rounded-2xl border border-surface-border shadow-sm">
            
            {activeTab === "account" && (
              <div className="space-y-4">
                <h3 className="font-heading font-bold text-lg text-emerald-deep">Account Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-brandtext-secondary mb-1">Full Name</label>
                    <input type="text" readOnly value="Ramesh Kumar" className="w-full p-2.5 rounded-xl border bg-surface-ivory border-surface-border" />
                  </div>
                  <div>
                    <label className="block text-brandtext-secondary mb-1">Email Address</label>
                    <input type="email" readOnly value="ramesh@pulseora.health" className="w-full p-2.5 rounded-xl border bg-surface-ivory border-surface-border" />
                  </div>
                  <div>
                    <label className="block text-brandtext-secondary mb-1">Phone Number</label>
                    <input type="tel" readOnly value="+91 98450 12345" className="w-full p-2.5 rounded-xl border bg-surface-ivory border-surface-border" />
                  </div>
                  <div>
                    <label className="block text-brandtext-secondary mb-1">Role</label>
                    <input type="text" readOnly value="Patient (Active Remote Monitoring)" className="w-full p-2.5 rounded-xl border bg-surface-ivory border-surface-border" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "language" && (
              <div className="space-y-4">
                <h3 className="font-heading font-bold text-lg text-emerald-deep">Language & Voice Preferences</h3>
                <p className="text-xs text-brandtext-secondary">
                  Choose your default language for both the interface and the PULSEORA AI Health Companion.
                </p>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  {[
                    { id: "en", label: "English", desc: "Global English (en-IN)" },
                    { id: "kn", label: "ಕನ್ನಡ", desc: "Kannada (kn-IN)" },
                    { id: "tcy", label: "ತುಳು", desc: "Tulu (Coastal Dialect)" }
                  ].map(l => (
                    <button
                      key={l.id}
                      onClick={() => setLang(l.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        lang === l.id
                          ? "border-emerald-primary bg-emerald-mint/20 ring-2 ring-emerald-aurora/30"
                          : "border-surface-border hover:bg-surface-ivory"
                      }`}
                    >
                      <div className="font-bold text-sm text-emerald-deep">{l.label}</div>
                      <div className="text-[11px] text-brandtext-secondary mt-1">{l.desc}</div>
                    </button>
                  ))}
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleSave}
                    className="px-5 py-2.5 rounded-xl bg-emerald-primary text-white font-semibold text-xs hover:bg-emerald-aurora hover:text-emerald-deep transition-all shadow-sm"
                  >
                    Save Preferences
                  </button>
                  {savedSuccess && (
                    <span className="ml-3 text-xs text-health-normal font-bold">✓ Saved successfully!</span>
                  )}
                </div>
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="space-y-4">
                <h3 className="font-heading font-bold text-lg text-emerald-deep">Privacy & Patient Consent Management</h3>
                <p className="text-xs text-brandtext-secondary leading-relaxed">
                  PULSEORA operates strictly on explicit user consent. You have complete autonomy over your health telemetry and AI chat data.
                </p>

                <div className="space-y-3 pt-2 text-xs">
                  <label className="flex items-center justify-between p-3.5 rounded-xl border border-surface-border bg-surface-ivory">
                    <div>
                      <span className="font-bold text-brandtext-primary block">Continuous Telemetry Ingestion Consent</span>
                      <span className="text-brandtext-secondary">Allow PULSEORA backend to ingest wearable PPG, ECG, and accelerometer data.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={consents.telemetry}
                      onChange={(e) => setConsents({ ...consents, telemetry: e.target.checked })}
                      className="w-4 h-4 text-emerald-primary rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl border border-surface-border bg-surface-ivory">
                    <div>
                      <span className="font-bold text-brandtext-primary block">AI Health Companion Conversational Journal</span>
                      <span className="text-brandtext-secondary">Retain up to 20 recent messages with your explicit consent for symptom memory.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={consents.aiChatHistory}
                      onChange={(e) => setConsents({ ...consents, aiChatHistory: e.target.checked })}
                      className="w-4 h-4 text-emerald-primary rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl border border-surface-border bg-surface-ivory">
                    <div>
                      <span className="font-bold text-brandtext-primary block">Caregiver Alert Sharing Permission</span>
                      <span className="text-brandtext-secondary">Permit authorized primary caregiver (Kavitha Kumar) to receive urgent alerts.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={consents.caregiverSharing}
                      onChange={(e) => setConsents({ ...consents, caregiverSharing: e.target.checked })}
                      className="w-4 h-4 text-emerald-primary rounded"
                    />
                  </label>
                </div>

                <div className="pt-4 flex flex-wrap gap-3 border-t border-surface-border">
                  <button
                    onClick={() => alert("Personal biometric telemetry dataset exported as JSON.")}
                    className="px-4 py-2 rounded-xl bg-surface-muted hover:bg-surface-border text-brandtext-primary font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-primary" />
                    <span>Export My Health Data</span>
                  </button>

                  <button
                    onClick={() => alert("All conversational chat logs deleted.")}
                    className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Chat Logs</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === "health" && (
              <div className="space-y-4">
                <h3 className="font-heading font-bold text-lg text-emerald-deep">Personalized Baseline Configuration</h3>
                <p className="text-xs text-brandtext-secondary">
                  PULSEORA automatically calculates rolling 14-day diurnal distributions.
                </p>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-surface-ivory rounded-xl border border-surface-border">
                    <span className="text-brandtext-secondary block">Rolling Baseline Window</span>
                    <span className="font-bold text-emerald-deep">14 Consecutive Days</span>
                  </div>
                  <div className="p-3 bg-surface-ivory rounded-xl border border-surface-border">
                    <span className="text-brandtext-secondary block">Diurnal Partitioning</span>
                    <span className="font-bold text-emerald-deep">Hourly Circadian Buckets</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "caregivers" && (
              <div className="space-y-4">
                <h3 className="font-heading font-bold text-lg text-emerald-deep">Authorized Family & Caregivers</h3>
                <div className="p-4 rounded-xl border border-surface-border bg-surface-ivory flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-emerald-deep text-sm block">Kavitha Kumar</span>
                    <span className="text-brandtext-secondary">Daughter • Primary Emergency Contact (+91 98450 67890)</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-mint text-emerald-deep font-bold">
                    Active
                  </span>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-4">
                <h3 className="font-heading font-bold text-lg text-emerald-deep">Notification Channels</h3>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-surface-ivory rounded-xl border border-surface-border flex items-center justify-between">
                    <span>Web Push Notifications</span>
                    <span className="text-health-normal font-bold">Enabled</span>
                  </div>
                  <div className="p-3 bg-surface-ivory rounded-xl border border-surface-border flex items-center justify-between">
                    <span>Caregiver Emergency Escalations</span>
                    <span className="text-health-normal font-bold">WhatsApp & Call Ready</span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </main>

      <AICompanionModal
        isOpen={isCompanionOpen}
        onClose={() => setIsCompanionOpen(false)}
      />

      <MobileBottomNav onOpenCompanion={() => setIsCompanionOpen(true)} />
    </div>
  );
}
