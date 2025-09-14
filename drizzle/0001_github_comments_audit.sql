
CREATE TABLE IF NOT EXISTS "github_comments_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"bug_id" integer NOT NULL,
	"github_issue_number" integer NOT NULL,
	"github_comment_id" text NOT NULL,
	"github_comment_url" text NOT NULL,
	"comment_body" text NOT NULL,
	"comment_author" text NOT NULL,
	"comment_author_id" integer,
	"github_created_at" timestamp NOT NULL,
	"github_updated_at" timestamp,
	"sync_direction" text NOT NULL,
	"sync_status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_github_comments_audit_bug_id" ON "github_comments_audit" ("bug_id");
CREATE INDEX IF NOT EXISTS "idx_github_comments_audit_github_issue" ON "github_comments_audit" ("github_issue_number");
CREATE INDEX IF NOT EXISTS "idx_github_comments_audit_comment_id" ON "github_comments_audit" ("github_comment_id");
CREATE INDEX IF NOT EXISTS "idx_github_comments_audit_sync_status" ON "github_comments_audit" ("sync_status");
