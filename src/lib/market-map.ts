import fs from "fs";
import path from "path";

function loadMarketMapData(): MarketMapEntity[] {
  const filePath = path.join(process.cwd(), "data", "hedera_market_map_v3.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

let _cache: MarketMapEntity[] | null = null;
function getMarketMapData(): MarketMapEntity[] {
  if (!_cache) _cache = loadMarketMapData();
  return _cache;
}

export type MarketMapEntity = {
  sector: string;
  subsector: string;
  name: string;
  organization: string;
  website: string;
  description: string;
  reason_for_inclusion: string;
  entity_type: string;
  year_founded: string;
  status: string;
  license: string;
  hedera_dependency_level: string;
  hedera_services_used: string;
  hts_integration: string;
  hcs_usage: string;
  hscs_usage: string;
  hbar_utility: string;
  governing_council_relationship: string;
  production_readiness: string;
  practitioner_note: string;
  practitioner_validation_check: string;
};

export function getAllEntities(): MarketMapEntity[] {
  return getMarketMapData();
}

export function getSectors(): { sector: string; count: number; subsectors: string[] }[] {
  const entities = getAllEntities();
  const sectorMap = new Map<string, Set<string>>();

  for (const e of entities) {
    if (!sectorMap.has(e.sector)) {
      sectorMap.set(e.sector, new Set());
    }
    sectorMap.get(e.sector)!.add(e.subsector);
  }

  return Array.from(sectorMap.entries()).map(([sector, subsectors]) => ({
    sector,
    count: entities.filter((e) => e.sector === sector).length,
    subsectors: Array.from(subsectors),
  }));
}

export function getEntitiesBySector(sector: string): MarketMapEntity[] {
  return getAllEntities().filter(
    (e) => e.sector.toLowerCase() === sector.toLowerCase()
  );
}

export function searchEntities(query: string): MarketMapEntity[] {
  const q = query.toLowerCase();
  return getAllEntities().filter(
    (e) =>
      e.name?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      e.organization?.toLowerCase().includes(q) ||
      e.sector?.toLowerCase().includes(q) ||
      e.subsector?.toLowerCase().includes(q) ||
      e.hedera_services_used?.toLowerCase().includes(q)
  );
}
