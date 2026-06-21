CREATE TABLE "policy_session_state" (
	"session_id" text PRIMARY KEY NOT NULL,
	"state" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
