import {
  pgTable,
  text,
  timestamp,
  integer,
  numeric,
  jsonb,
  uuid,
  pgEnum,
  primaryKey,
} from "drizzle-orm/pg-core";
import type { CustomAgentSpec } from "@hbar/lib/custom-agent";
import type { PolicySessionSnapshot } from "@hbar/lib/policy-state";
import type { StrategyConfig } from "@/lib/bonzo/strategy-config.schema";

export const jobStatusEnum = pgEnum("job_status", [
  "pending_fund",
  "funded",
  "in_progress",
  "delivered",
  "completed",
  "rated",
  "disputed",
]);

export const agentStatusEnum = pgEnum("agent_status", [
  "active",
  "inactive",
  "pending",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").unique(),
  walletAddress: text("wallet_address"),
  magicIssuer: text("magic_issuer").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const agents = pgTable("agents", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  capabilities: jsonb("capabilities").$type<string[]>().notNull(),
  pricingUsd: numeric("pricing_usd", { precision: 10, scale: 2 })
    .notNull()
    .default("1.00"),
  onChainAgentId: integer("on_chain_agent_id"),
  walletAddress: text("wallet_address"),
  intakeSchema: jsonb("intake_schema").$type<IntakeSchema | null>(),
  capability: text("capability").notNull(),
  status: agentStatusEnum("status").default("active").notNull(),
  ownerId: uuid("owner_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jobs = pgTable("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  hiringAgentId: text("hiring_agent_id"),
  workerAgentId: uuid("worker_agent_id").references(() => agents.id),
  onChainJobId: integer("on_chain_job_id"),
  taskDescription: text("task_description"),
  amountUsd: numeric("amount_usd", { precision: 10, scale: 2 }),
  amountHbar: numeric("amount_hbar", { precision: 18, scale: 8 }),
  status: jobStatusEnum("status").default("pending_fund").notNull(),
  result: text("result"),
  escrowTxHash: text("escrow_tx_hash"),
  hcsTopicId: text("hcs_topic_id"),
  rating: integer("rating"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export type IntakeSchema = {
  fields: {
    name: string;
    type: "string" | "number" | "boolean" | "text";
    required: boolean;
    description?: string;
    placeholder?: string;
  }[];
};

export type User = typeof users.$inferSelect;
export type Agent = typeof agents.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type NewJob = typeof jobs.$inferInsert;

export const policySessionState = pgTable("policy_session_state", {
  sessionId: text("session_id").primaryKey(),
  state: jsonb("state").$type<PolicySessionSnapshot>().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customAgents = pgTable(
  "custom_agents",
  {
    id: text("id").notNull(),
    sessionId: text("session_id").notNull(),
    spec: jsonb("spec").$type<CustomAgentSpec>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.id, table.sessionId] })]
);

export const strategyStatusEnum = pgEnum("strategy_status", [
  "draft",
  "active",
  "paused",
  "exited",
]);

export const strategies = pgTable("strategies", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  vaultType: text("vault_type").notNull(),
  vaultAddress: text("vault_address"),
  config: jsonb("config").$type<StrategyConfig>().notNull(),
  hcsTopicId: text("hcs_topic_id"),
  status: strategyStatusEnum("status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vaultPolicyState = pgTable("vault_policy_state", {
  strategyId: uuid("strategy_id")
    .references(() => strategies.id)
    .primaryKey(),
  deployedAmount: numeric("deployed_amount", { precision: 30, scale: 8 })
    .default("0")
    .notNull(),
  lastHarvestAt: timestamp("last_harvest_at"),
  isPaused: text("is_paused").default("false").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const strategyRuns = pgTable("strategy_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  strategyId: uuid("strategy_id").references(() => strategies.id),
  decision: text("decision").notNull(),
  policyResult: jsonb("policy_result"),
  txId: text("tx_id"),
  hcsSequence: text("hcs_sequence"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
