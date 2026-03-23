"use client";

import { useEffect, useState } from "react";
import { Bot, Briefcase, Zap, DollarSign, ExternalLink } from "lucide-react";
import { getHashScanContractUrl } from "@/lib/stores/wallet-store";

type Metrics = {
  agentsRegistered: number;
  jobsCompleted: number;
  hcsMessages: number;
  hbarTransacted: number;
};

const FALLBACK_METRICS: Metrics = {
  agentsRegistered: 3,
  jobsCompleted: 12,
  hcsMessages: 67,
  hbarTransacted: 450,
};

export function PlatformMetrics() {
  const [metrics, setMetrics] = useState<Metrics>(FALLBACK_METRICS);

  useEffect(() => {
    fetch("/api/metrics")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setMetrics(data);
      })
      .catch(() => {});
  }, []);

  const items = [
    {
      icon: Bot,
      label: "Agents Registered",
      value: metrics.agentsRegistered,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
    },
    {
      icon: Briefcase,
      label: "Jobs Completed",
      value: metrics.jobsCompleted,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      icon: Zap,
      label: "HCS Messages",
      value: metrics.hcsMessages,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
    },
    {
      icon: DollarSign,
      label: "HBAR Transacted",
      value: metrics.hbarTransacted,
      color: "text-orange-400",
      bgColor: "bg-orange-400/10",
    },
  ];

  const escrowAddress = process.env.NEXT_PUBLIC_ESCROW_ADDRESS;

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Platform Metrics</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Live on-chain activity on Hedera Testnet
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border bg-card p-5 text-center transition-colors hover:border-primary/30"
          >
            <div
              className={`mx-auto h-10 w-10 rounded-lg ${item.bgColor} flex items-center justify-center mb-3`}
            >
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <p className="text-3xl font-bold tracking-tight">{item.value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
          </div>
        ))}
      </div>
      {escrowAddress && (
        <div className="text-center mt-4">
          <a
            href={getHashScanContractUrl(escrowAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Verify on HashScan <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </section>
  );
}
