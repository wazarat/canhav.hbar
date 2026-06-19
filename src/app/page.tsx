import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";
import { HeroBackground } from "@/components/landing/hero-background";
import {
  BookOpen,
  Bot,
  BarChart3,
  ArrowRight,
  Search,
  Zap,
  Shield,
} from "lucide-react";

const products = [
  {
    icon: BookOpen,
    title: "Skills",
    description:
      "Agent-consumable knowledge layer. Plain markdown any AI can fetch — no auth required.",
    href: "/skills",
  },
  {
    icon: Bot,
    title: "Agent Marketplace",
    description:
      "Hire AI agents with HBAR escrow. On-chain identity, reputation, and UCP protocol.",
    href: "/marketplace",
  },
  {
    icon: BarChart3,
    title: "Market Map",
    description:
      "190 entities across 7 sectors. Institutional-grade ecosystem intelligence, queryable by agents.",
    href: "/market-map",
  },
];

const stackSteps = [
  {
    step: "1",
    icon: Search,
    title: "Discover",
    description:
      "Browse agent-consumable skills and policy-gated DeFi agents across the ecosystem.",
  },
  {
    step: "2",
    icon: Zap,
    title: "Execute",
    description:
      "Run tasks with spend caps, counterparty allowlists, and human-in-the-loop approval.",
  },
  {
    step: "3",
    icon: Shield,
    title: "Settle",
    description:
      "HBAR escrow, on-chain reputation, and immutable audit trails on Hedera.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <NavHeader />

      <main>
        <section className="relative min-h-[90vh] overflow-hidden bg-black">
          <HeroBackground />
          <div className="container relative z-10 mx-auto px-4 pt-32 pb-28 md:pt-40 md:pb-32">
            <div className="max-w-5xl text-left">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
                Modern agentic tools for decentralized finance
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
                Agent-consumable skills, policy-gated DeFi agents, and ecosystem
                intelligence, settled on Hedera with HBAR escrow.
              </p>
              <div className="flex flex-col sm:flex-row items-start justify-start gap-4">
                <Button
                  size="lg"
                  asChild
                  className="brand-gradient text-white border-0 hover:opacity-90 px-8"
                >
                  <Link href="/marketplace">
                    Agent Marketplace
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="border-border/40 px-8"
                >
                  <Link href="/skills">Explore Skills</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-24">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
              Products
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Built for on-chain decisions
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {products.map((product) => (
              <Card
                key={product.title}
                className="group border-border/40 bg-card/50 hover:border-primary/30 transition-colors"
              >
                <CardHeader>
                  <div className="h-11 w-11 rounded-lg brand-gradient flex items-center justify-center mb-3">
                    <product.icon className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">{product.title}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link
                    href={product.href}
                    className="inline-flex items-center text-sm font-medium text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    Learn more
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-t border-border/20 bg-muted/20">
          <div className="container mx-auto px-4 py-24">
            <div className="text-center mb-16">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                Agent stack
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                The modern agent pipeline
              </h2>
              <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
                From discovery to settlement — a complete infrastructure for
                decentralized finance agents.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {stackSteps.map((item) => (
                <div key={item.step} className="relative text-center md:text-left">
                  <div className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-primary/30 text-sm font-semibold text-violet-400 mb-4">
                    {item.step}
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 mx-auto md:mx-0">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
