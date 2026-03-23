"use client";

import { useState, useEffect } from "react";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";

type Entity = {
  sector: string;
  subsector: string;
  name: string;
  organization: string;
  website: string;
  description: string;
  entity_type: string;
  status: string;
  hedera_dependency_level: string;
  hedera_services_used: string;
  hts_integration: string;
  hcs_usage: string;
  hscs_usage: string;
  hbar_utility: string;
  production_readiness: string;
  practitioner_note: string;
};

type Sector = {
  sector: string;
  count: number;
  subsectors: string[];
};

const sectorColors: Record<string, string> = {
  DeFi: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  Gaming: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  "Supply Chain": "bg-green-500/10 text-green-400 border-green-500/30",
  Identity: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  Payments: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  Infrastructure: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  Enterprise: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  "Data & AI": "bg-pink-500/10 text-pink-400 border-pink-500/30",
  NFT: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  Sustainability: "bg-lime-500/10 text-lime-400 border-lime-500/30",
};

function getSectorColor(sector: string) {
  return sectorColors[sector] || "bg-muted text-muted-foreground border-border";
}

export default function MarketMapPage() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [expandedEntity, setExpandedEntity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(60);
  const PAGE_SIZE = 30;

  useEffect(() => {
    Promise.all([
      fetch("/api/market-map/sectors").then((r) => r.json()),
      fetch("/api/market-map").then((r) => r.json()),
    ]).then(([sectorData, entityData]) => {
      setSectors(sectorData.sectors || []);
      setEntities(entityData.entities || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setVisibleCount(60);
  }, [search, selectedSector]);

  const filtered = entities.filter((e) => {
    if (selectedSector && e.sector !== selectedSector) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        e.name?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.organization?.toLowerCase().includes(q) ||
        e.subsector?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  return (
    <div className="min-h-screen">
      <NavHeader />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mb-10">
          <Badge variant="secondary" className="mb-4">
            Data Pool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Hedera Market Map
          </h1>
          <p className="text-lg text-muted-foreground">
            Institutional-grade ecosystem intelligence. {entities.length}{" "}
            entities across {sectors.length} sectors — all queryable by AI
            agents.
          </p>
        </div>

        {/* Sector Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          <button
            onClick={() => setSelectedSector(null)}
            className={`p-3 rounded-lg border text-left transition-all ${
              selectedSector === null
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
          >
            <p className="text-2xl font-bold">{entities.length}</p>
            <p className="text-xs text-muted-foreground">All Entities</p>
          </button>
          {sectors.map((s) => (
            <button
              key={s.sector}
              onClick={() =>
                setSelectedSector(selectedSector === s.sector ? null : s.sector)
              }
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedSector === s.sector
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <p className="text-2xl font-bold">{s.count}</p>
              <p className="text-xs text-muted-foreground truncate">
                {s.sector}
              </p>
            </button>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search entities, organizations..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {selectedSector && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedSector(null)}
            >
              <Filter className="h-3.5 w-3.5 mr-1" />
              {selectedSector} ({filtered.length})
              <span className="ml-2 text-xs">×</span>
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-muted rounded w-full mb-2" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Showing {filtered.length} of {entities.length} entities
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visible.map((e, idx) => {
                const key = `${e.name}-${idx}`;
                const isExpanded = expandedEntity === key;

                return (
                  <Card
                    key={key}
                    className="hover:border-primary/30 transition-colors"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">
                            {e.name}
                          </CardTitle>
                          <CardDescription className="text-xs truncate">
                            {e.organization}
                          </CardDescription>
                        </div>
                        {e.website && (
                          <a
                            href={e.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <Badge
                          className={`text-xs ${getSectorColor(e.sector)}`}
                          variant="outline"
                        >
                          {e.sector}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {e.subsector}
                        </Badge>
                        {e.status && (
                          <Badge variant="secondary" className="text-xs">
                            {e.status}
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {e.description}
                      </p>

                      <button
                        onClick={() =>
                          setExpandedEntity(isExpanded ? null : key)
                        }
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        {isExpanded ? (
                          <>
                            Less <ChevronUp className="h-3 w-3" />
                          </>
                        ) : (
                          <>
                            More details <ChevronDown className="h-3 w-3" />
                          </>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t space-y-2 text-xs">
                          {e.entity_type && (
                            <div>
                              <span className="text-muted-foreground">
                                Type:{" "}
                              </span>
                              {e.entity_type}
                            </div>
                          )}
                          {e.hedera_dependency_level && (
                            <div>
                              <span className="text-muted-foreground">
                                Hedera Dependency:{" "}
                              </span>
                              {e.hedera_dependency_level}
                            </div>
                          )}
                          {e.hedera_services_used && (
                            <div>
                              <span className="text-muted-foreground">
                                Services:{" "}
                              </span>
                              {e.hedera_services_used}
                            </div>
                          )}
                          {e.hbar_utility && (
                            <div>
                              <span className="text-muted-foreground">
                                HBAR Utility:{" "}
                              </span>
                              {e.hbar_utility}
                            </div>
                          )}
                          {e.production_readiness && (
                            <div>
                              <span className="text-muted-foreground">
                                Production:{" "}
                              </span>
                              {e.production_readiness}
                            </div>
                          )}
                          {e.practitioner_note && (
                            <div className="p-2 rounded bg-muted/50 mt-2">
                              <span className="text-muted-foreground">
                                Practitioner Note:{" "}
                              </span>
                              {e.practitioner_note}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {hasMore && (
              <div className="col-span-full flex flex-col items-center gap-2 mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {visibleCount} of {filtered.length} entities
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                >
                  Load {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more
                </Button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
