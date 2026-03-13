import {
  pgTable,
  text,
  timestamp,
  integer,
  numeric,
  jsonb,
  uuid,
  pgEnum,
} from "drizzle-orm/pg-core";

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
