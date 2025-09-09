CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" integer NOT NULL,
	"details" json,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bugs" (
	"id" serial PRIMARY KEY NOT NULL,
	"bug_id" text NOT NULL,
	"title" text NOT NULL,
	"reported_by_id" integer NOT NULL,
	"date_reported" timestamp DEFAULT now(),
	"severity" text NOT NULL,
	"priority" text NOT NULL,
	"environment" text,
	"status" text DEFAULT 'Open' NOT NULL,
	"pre_conditions" text,
	"steps_to_reproduce" text NOT NULL,
	"expected_result" text NOT NULL,
	"actual_result" text NOT NULL,
	"attachments" json DEFAULT '[]'::json,
	"screenshot_required" boolean DEFAULT false,
	"comments" text,
	"project_id" integer NOT NULL,
	"module_id" integer,
	"test_case_id" integer,
	"assigned_to_id" integer,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "custom_markers" (
	"id" serial PRIMARY KEY NOT NULL,
	"marker_id" text NOT NULL,
	"label" text NOT NULL,
	"color" text NOT NULL,
	"type" text NOT NULL,
	"project_id" integer NOT NULL,
	"created_by_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "customer_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"contact_person" text,
	"email" text,
	"phone" text,
	"address" text,
	"status" text DEFAULT 'Active' NOT NULL,
	"created_by_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "department_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "department_options_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "document_folders" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"project_id" integer NOT NULL,
	"parent_folder_id" integer,
	"created_by_id" integer NOT NULL,
	"view_type" text DEFAULT 'List',
	"icon" text,
	"path" text,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"file_url" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"icon" text,
	"folder_id" integer,
	"project_id" integer NOT NULL,
	"path" text,
	"is_deleted" boolean DEFAULT false,
	"uploaded_by_id" integer NOT NULL,
	"uploaded_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "employee_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"project_type" text DEFAULT 'regular',
	"role" text,
	"allocation" integer DEFAULT 100,
	"start_date" date,
	"end_date" date,
	"status" text DEFAULT 'active',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone_number" text,
	"profile_picture" text,
	"locality" text,
	"technologies" json DEFAULT '[]'::json,
	"department" text,
	"status" text DEFAULT 'Active' NOT NULL,
	"created_by_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "employees_employee_id_unique" UNIQUE("employee_id"),
	CONSTRAINT "employees_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "kanban_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"column_id" integer NOT NULL,
	"sprint_id" integer,
	"project_id" integer NOT NULL,
	"priority" text DEFAULT 'Medium' NOT NULL,
	"order" integer NOT NULL,
	"estimated_hours" integer,
	"actual_hours" integer,
	"assignee_id" integer,
	"assignee_name" text,
	"parent_id" integer,
	"test_case_id" integer,
	"bug_id" integer,
	"start_date" date,
	"end_date" date,
	"due_date" date,
	"labels" json DEFAULT '[]'::json,
	"attachments" json DEFAULT '[]'::json,
	"created_by_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "kanban_columns" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"project_id" integer NOT NULL,
	"sprint_id" integer,
	"order" integer NOT NULL,
	"color" text DEFAULT '#4F46E5',
	"is_default" boolean DEFAULT false,
	"start_date" date,
	"end_date" date,
	"created_by_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "matrix_cells" (
	"id" serial PRIMARY KEY NOT NULL,
	"row_module_id" integer NOT NULL,
	"col_module_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"value" text NOT NULL,
	"created_by_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"module_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"project_id" integer NOT NULL,
	"status" text DEFAULT 'Active' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "navadhiti_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_name" text NOT NULL,
	"overall_project_activity" text,
	"current_sprint" text,
	"current_issues" text,
	"weekly_comms" text,
	"immediate_action_items" text,
	"support_required" text,
	"additional_remarks" text,
	"activity_status" integer DEFAULT 0,
	"sprint_status" integer DEFAULT 0,
	"communication_status" integer DEFAULT 0,
	"created_by_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notebooks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"color" text DEFAULT '#4F46E5',
	"is_pinned" boolean DEFAULT false,
	"is_archived" boolean DEFAULT false,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"prefix" text NOT NULL,
	"status" text DEFAULT 'Active' NOT NULL,
	"customer_id" integer,
	"created_by_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "request_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"comment" text NOT NULL,
	"comment_type" text DEFAULT 'General' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "request_extension_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"original_end_date" date NOT NULL,
	"new_end_date" date NOT NULL,
	"extension_reason" text NOT NULL,
	"approved_by_id" integer,
	"requested_by_id" integer NOT NULL,
	"status" text DEFAULT 'Pending' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "request_form_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"form_type_id" integer NOT NULL,
	"field_name" text NOT NULL,
	"option_value" text NOT NULL,
	"option_label" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "request_form_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"department" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "request_form_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "resource_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"request_type" text NOT NULL,
	"department" text NOT NULL,
	"project_id" integer NOT NULL,
	"requested_by_id" integer NOT NULL,
	"assigned_to_id" integer,
	"priority" text DEFAULT 'Medium' NOT NULL,
	"status" text DEFAULT 'Draft' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"actual_start_date" date,
	"actual_end_date" date,
	"estimated_hours" integer,
	"actual_hours" integer,
	"testing_type" text,
	"development_type" text,
	"devops_type" text,
	"resource_type" text,
	"skills_required" json DEFAULT '[]'::json,
	"technologies" json DEFAULT '[]'::json,
	"deliverables" text,
	"acceptance_criteria" text,
	"additional_notes" text,
	"attachments" json DEFAULT '[]'::json,
	"approved_by_id" integer,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "resource_requests_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE "sprints" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"project_id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" text DEFAULT 'Planning' NOT NULL,
	"created_by_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"project_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "technology_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "technology_options_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "test_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_case_id" text NOT NULL,
	"module_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"feature" text NOT NULL,
	"test_objective" text NOT NULL,
	"pre_conditions" text,
	"test_steps" text NOT NULL,
	"expected_result" text NOT NULL,
	"actual_result" text,
	"status" text DEFAULT 'Not Executed' NOT NULL,
	"priority" text DEFAULT 'Medium' NOT NULL,
	"comments" text,
	"tags" json DEFAULT '[]'::json,
	"created_by_id" integer NOT NULL,
	"assigned_to_id" integer,
	"is_deleted" boolean DEFAULT false,
	"deleted_at" timestamp,
	"deleted_by_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "testing_type_fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"testing_type_id" integer NOT NULL,
	"name" text NOT NULL,
	"label" text NOT NULL,
	"type" text NOT NULL,
	"options" json DEFAULT '[]'::json,
	"default_value" text,
	"placeholder" text,
	"required" boolean DEFAULT false,
	"order" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "testing_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_by_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "timesheet_folders" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"user_id" integer NOT NULL,
	"parent_id" integer,
	"path" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "time_sheets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"customer_id" integer,
	"project_id" text NOT NULL,
	"folder_id" integer,
	"module_id" integer,
	"test_case_id" integer,
	"bug_id" integer,
	"description" text NOT NULL,
	"work_date" timestamp NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"tags" json DEFAULT '[]'::json,
	"hours" integer NOT NULL,
	"status" text DEFAULT 'Pending' NOT NULL,
	"approved_by_id" integer,
	"approval_date" timestamp,
	"comments" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "todo_lists" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#4F46E5',
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "todos" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"completed" boolean DEFAULT false,
	"priority" text DEFAULT 'Medium',
	"due_date" timestamp,
	"list_id" integer,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "traceability_markers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#007bff' NOT NULL,
	"icon" text,
	"description" text,
	"project_id" integer NOT NULL,
	"created_by_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "traceability_matrix" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"project_id" integer NOT NULL,
	"created_by_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "traceability_matrix_cells" (
	"id" serial PRIMARY KEY NOT NULL,
	"matrix_id" integer NOT NULL,
	"source_module_id" integer NOT NULL,
	"target_module_id" integer NOT NULL,
	"marker_id" integer NOT NULL,
	"notes" text,
	"created_by_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "traceability_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"matrix_id" integer NOT NULL,
	"module_id" integer NOT NULL,
	"display_order" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"phone_number" text,
	"role" text DEFAULT 'Tester' NOT NULL,
	"status" text DEFAULT 'Active' NOT NULL,
	"profile_picture" text,
	"avatar_type" text DEFAULT 'image',
	"avatar_data" text,
	"theme" text DEFAULT 'default',
	"color_theme" text DEFAULT 'blue',
	"temp_password" text,
	"temp_password_used" boolean DEFAULT false,
	"verification_token" text,
	"verified" boolean DEFAULT false,
	"reset_token" text,
	"reset_token_expires" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "notebooks" ADD CONSTRAINT "notebooks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo_lists" ADD CONSTRAINT "todo_lists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_list_id_todo_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."todo_lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;