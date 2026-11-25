"use client";

import React, { useState } from "react";
import { Header } from "@/components/navigation/Header";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { AICompanionModal } from "@/components/companion/AICompanionModal";
import { DemoControlPanel } from "@/components/demo/DemoControlPanel";
import { NetworkFailureBanner } from "@/components/network/NetworkFailureBanner";

export default function DemoPage() {
  const [isCompanionOpen, setIsCompanionOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-ivory pb-20 lg:pb-12 text-brandtext-primary">
      <Header onOpenCompanion={() => setIsCompanionOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        <NetworkFailureBanner />
        <DemoControlPanel onOpenCompanion={() => setIsCompanionOpen(true)} />
      </main>

      <AICompanionModal
        isOpen={isCompanionOpen}
        onClose={() => setIsCompanionOpen(false)}
      />

      <MobileBottomNav onOpenCompanion={() => setIsCompanionOpen(true)} />
    </div>
  );
}
