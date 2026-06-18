CREATE TYPE "public"."agent_status" AS ENUM('active', 'inactive', 'pending');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('pending_fund', 'funded', 'in_progress', 'delivered', 'completed', 'rated', 'disputed');--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"capabilities" jsonb NOT NULL,
	"pricing_usd" numeric(10, 2) DEFAULT '1.00' NOT NULL,
	"on_chain_agent_id" integer,
	"wallet_address" text,
	"intake_schema" jsonb,
	"capability" text NOT NULL,
	"status" "agent_status" DEFAULT 'active' NOT NULL,
	"owner_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_agents" (
	"id" text NOT NULL,
	"session_id" text NOT NULL,
	"spec" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "custom_agents_id_session_id_pk" PRIMARY KEY("id","session_id")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hiring_agent_id" text,
	"worker_agent_id" uuid,
	"on_chain_job_id" integer,
	"task_description" text,
	"amount_usd" numeric(10, 2),
	"amount_hbar" numeric(18, 8),
	"status" "job_status" DEFAULT 'pending_fund' NOT NULL,
	"result" text,
	"escrow_tx_hash" text,
	"hcs_topic_id" text,
	"rating" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"wallet_address" text,
	"magic_issuer" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_magic_issuer_unique" UNIQUE("magic_issuer")
);
--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_worker_agent_id_agents_id_fk" FOREIGN KEY ("worker_agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;