import { useState } from 'react';
import { Header } from '@/pages/landing/Header';
import { Hero } from '@/pages/landing/Hero';
import { OperatorCheck } from '@/pages/landing/OperatorCheck';
import { SetupSteps } from '@/pages/landing/SetupSteps';
import { Tariffs } from '@/pages/landing/Tariffs';
import { Whitelist } from '@/pages/landing/Whitelist';
import { Channels } from '@/pages/landing/Channels';
import { Apps } from '@/pages/landing/Apps';
import { Faq } from '@/pages/landing/Faq';
import { FinalCta } from '@/pages/landing/FinalCta';
import { Footer } from '@/pages/landing/Footer';
import { StickyCta } from '@/pages/landing/StickyCta';
import type { NetworkNode } from '@/data/networkSnapshot';

export default function LandingPage() {
  const [selectedNode, setSelectedNode] = useState<NetworkNode | undefined>();

  return (
    <div
      data-testid="landing-page"
      className="min-h-screen bg-bg text-ink selection:bg-mint selection:text-bg"
    >
      {/* Sticky Top Header */}
      <Header />

      <main>
        {/* 1. Hero with Live Network Console */}
        <Hero selectedNodeId={selectedNode?.id} onSelectNode={setSelectedNode} />

        {/* 2. Interactive Operator Check («Заработает у меня?») */}
        <OperatorCheck />

        {/* 3. Setup in 3 steps + Device Picker + Synced Mockup */}
        <SetupSteps selectedNode={selectedNode} />

        {/* 4. Tariffs with Trial Banner & Period Switcher */}
        <Tariffs />

        {/* 5. Whitelist / LTE Contour Explanation */}
        <Whitelist />

        {/* 6. Channels: Telegram Bot vs Cabinet */}
        <Channels />

        {/* 7. Apps & Supported Platforms */}
        <Apps />

        {/* 8. Frequently Asked Questions */}
        <Faq />

        {/* 9. Final High-Converting CTA */}
        <FinalCta />
      </main>

      {/* 10. Footer with Legal and Support Links */}
      <Footer />

      {/* 11. Mobile Sticky Bottom CTA */}
      <StickyCta />
    </div>
  );
}
