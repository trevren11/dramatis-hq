CREATE TYPE "public"."user_type" AS ENUM('talent', 'producer', 'admin');--> statement-breakpoint
CREATE TYPE "public"."ethnicity" AS ENUM('asian', 'black', 'caucasian', 'hispanic', 'middle_eastern', 'native_american', 'pacific_islander', 'south_asian', 'mixed', 'other', 'prefer_not_to_say');--> statement-breakpoint
CREATE TYPE "public"."eye_color" AS ENUM('brown', 'blue', 'green', 'hazel', 'gray', 'amber', 'other');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'non_binary', 'other', 'prefer_not_to_say');--> statement-breakpoint
CREATE TYPE "public"."hair_color" AS ENUM('black', 'brown', 'blonde', 'red', 'auburn', 'gray', 'white', 'bald', 'other');--> statement-breakpoint
CREATE TYPE "public"."vocal_range" AS ENUM('soprano', 'mezzo_soprano', 'alto', 'countertenor', 'tenor', 'baritone', 'bass', 'not_applicable');--> statement-breakpoint
CREATE TYPE "public"."willingness" AS ENUM('yes', 'no', 'negotiable');--> statement-breakpoint
CREATE TYPE "public"."union_status" AS ENUM('union', 'non_union', 'union_signatory', 'both');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('headshot', 'video', 'document');--> statement-breakpoint
CREATE TYPE "public"."work_category" AS ENUM('theater', 'film', 'television', 'commercial', 'web_series', 'music_video', 'voice_over', 'industrial', 'live_event', 'other');--> statement-breakpoint
CREATE TYPE "public"."skill_category" AS ENUM('dance', 'music', 'sports', 'languages', 'accents', 'combat', 'circus', 'special', 'other');--> statement-breakpoint
CREATE TYPE "public"."document_access_action" AS ENUM('upload', 'view', 'download', 'delete');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('W2', '1099', 'I9', 'Contract', 'CallSheet', 'Other');--> statement-breakpoint
CREATE TYPE "public"."availability_status" AS ENUM('available', 'unavailable', 'tentative');--> statement-breakpoint
CREATE TYPE "public"."recurrence_pattern" AS ENUM('none', 'daily', 'weekly', 'biweekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."show_schedule_status" AS ENUM('confirmed', 'tentative', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."conversation_type" AS ENUM('direct', 'group', 'show_cast');--> statement-breakpoint
CREATE TYPE "public"."show_status" AS ENUM('planning', 'auditions', 'rehearsal', 'running', 'closed');--> statement-breakpoint
CREATE TYPE "public"."show_type" AS ENUM('musical', 'play', 'opera', 'dance', 'concert', 'other');--> statement-breakpoint
CREATE TYPE "public"."role_type" AS ENUM('lead', 'supporting', 'ensemble', 'understudy', 'swing');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'open', 'paid', 'uncollectible', 'void');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('monthly', 'annual');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('submitted', 'reviewed', 'callback', 'rejected', 'cast');--> statement-breakpoint
CREATE TYPE "public"."audition_status" AS ENUM('draft', 'open', 'closed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."audition_visibility" AS ENUM('public', 'private', 'unlisted');--> statement-breakpoint
CREATE TYPE "public"."checkin_status" AS ENUM('checked_in', 'in_room', 'completed');--> statement-breakpoint
CREATE TYPE "public"."audition_decision" AS ENUM('callback', 'hold_for_role', 'cast_in_role', 'release');--> statement-breakpoint
CREATE TYPE "public"."callback_status" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."casting_status" AS ENUM('draft', 'tentative', 'confirmed', 'declined');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('draft', 'sent', 'delivered', 'opened', 'clicked', 'responded', 'bounced', 'failed');--> statement-breakpoint
CREATE TYPE "public"."response_type" AS ENUM('accepted', 'declined', 'pending');--> statement-breakpoint
CREATE TYPE "public"."template_type" AS ENUM('cast_notification', 'callback_notification', 'rejection', 'custom');--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('note_created', 'note_updated', 'note_deleted', 'file_uploaded', 'file_deleted', 'comment_added', 'comment_deleted', 'folder_created', 'folder_deleted', 'mention');--> statement-breakpoint
CREATE TYPE "public"."department_type" AS ENUM('lighting', 'director', 'makeup_hair', 'costuming', 'scenic', 'dramaturg', 'ad_notes', 'props', 'choreographer', 'sound', 'stage_management', 'custom');--> statement-breakpoint
CREATE TYPE "public"."note_access_level" AS ENUM('department_head', 'department_member', 'director', 'all_crew');--> statement-breakpoint
CREATE TYPE "public"."schedule_event_status" AS ENUM('scheduled', 'confirmed', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."schedule_event_type" AS ENUM('rehearsal', 'performance', 'tech_rehearsal', 'dress_rehearsal', 'photo_call', 'load_in', 'strike', 'custom');--> statement-breakpoint
CREATE TYPE "public"."schedule_notification_type" AS ENUM('event_created', 'event_updated', 'event_cancelled', 'event_reminder', 'daily_digest', 'weekly_digest');--> statement-breakpoint
CREATE TYPE "public"."budget_category" AS ENUM('scenic', 'costumes', 'props', 'lighting', 'sound', 'marketing', 'venue', 'royalties', 'miscellaneous', 'custom');--> statement-breakpoint
CREATE TYPE "public"."reimbursement_status" AS ENUM('pending', 'approved', 'denied', 'paid');--> statement-breakpoint
CREATE TYPE "public"."grant_type" AS ENUM('user', 'role', 'all_cast');--> statement-breakpoint
CREATE TYPE "public"."material_access_action_type" AS ENUM('view', 'download', 'stream');--> statement-breakpoint
CREATE TYPE "public"."material_type" AS ENUM('script', 'track');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'declined', 'expired');--> statement-breakpoint
CREATE TYPE "public"."invitation_type" AS ENUM('organization', 'show');--> statement-breakpoint
CREATE TYPE "public"."organization_role" AS ENUM('owner', 'admin', 'producer', 'associate_producer');--> statement-breakpoint
CREATE TYPE "public"."show_role" AS ENUM('director', 'music_director', 'choreographer', 'stage_manager', 'assistant_stage_manager', 'production_manager', 'technical_director', 'lighting_designer', 'sound_designer', 'costume_designer', 'scenic_designer', 'props_master', 'hair_makeup_designer', 'dramaturg', 'assistant_director', 'crew_member');--> statement-breakpoint
CREATE TYPE "public"."talent_search_sort_order" AS ENUM('relevance', 'name_asc', 'name_desc', 'recent_activity');--> statement-breakpoint
CREATE TYPE "public"."email_frequency" AS ENUM('immediate', 'daily', 'weekly', 'never');--> statement-breakpoint
CREATE TYPE "public"."email_status" AS ENUM('queued', 'sending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed');--> statement-breakpoint
CREATE TYPE "public"."email_type" AS ENUM('welcome', 'email_verification', 'password_reset', 'login_notification', 'audition_submission', 'callback_notification', 'cast_notification', 'rejection_notification', 'schedule_update', 'new_message', 'document_shared', 'rehearsal_reminder', 'subscription_confirmation', 'payment_receipt', 'payment_failed', 'subscription_ending');--> statement-breakpoint
CREATE TYPE "public"."in_app_notification_type" AS ENUM('new_message', 'schedule_change', 'rehearsal_reminder', 'callback_notification', 'cast_decision', 'document_shared', 'comment_mention', 'audition_submission', 'system_announcement');--> statement-breakpoint
CREATE TYPE "public"."video_category" AS ENUM('acting', 'singing', 'dance', 'instrument', 'monologue', 'scene', 'other');--> statement-breakpoint
CREATE TYPE "public"."video_source_type" AS ENUM('upload', 'youtube', 'vimeo');--> statement-breakpoint
CREATE TYPE "public"."video_status" AS ENUM('processing', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."video_visibility" AS ENUM('public', 'producers_only', 'private');--> statement-breakpoint
CREATE TYPE "public"."producer_document_status" AS ENUM('pending', 'delivered', 'viewed', 'downloaded');--> statement-breakpoint
CREATE TYPE "public"."theme_mode" AS ENUM('light', 'dark', 'system');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" timestamp,
	"password_hash" varchar(255),
	"user_type" "user_type" DEFAULT 'talent' NOT NULL,
	"name" varchar(255),
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification_tokens" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "talent_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"headshot" text,
	"contact_email" varchar(255),
	"phone" varchar(50),
	"height" varchar(20),
	"hair_color" varchar(50),
	"eye_color" varchar(50),
	"union_status" json DEFAULT '[]'::json,
	"skills" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "talent_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "producer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"logo_url" varchar(500),
	"description" text,
	"location" varchar(200),
	"website" varchar(255),
	"union_status" "union_status" DEFAULT 'both',
	"social_links" jsonb,
	"is_public" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "producer_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "producer_profiles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "production_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"producer_profile_id" uuid NOT NULL,
	"url" varchar(500) NOT NULL,
	"thumbnail_url" varchar(500),
	"original_filename" varchar(255),
	"mime_type" varchar(50),
	"file_size" integer,
	"width" integer,
	"height" integer,
	"title" varchar(255),
	"description" text,
	"production_name" varchar(255),
	"is_featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resume_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"selected_work_history" json DEFAULT '[]'::json,
	"selected_education" json DEFAULT '[]'::json,
	"selected_skills" json DEFAULT '[]'::json,
	"section_order" json DEFAULT '["header","theater","film_television","training","skills"]'::json,
	"include_headshot" boolean DEFAULT true,
	"include_contact" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "education" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"talent_profile_id" uuid NOT NULL,
	"program" varchar(255) NOT NULL,
	"degree" varchar(100),
	"institution" varchar(255) NOT NULL,
	"location" varchar(200),
	"start_year" integer,
	"end_year" integer,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "work_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"talent_profile_id" uuid NOT NULL,
	"show_name" varchar(255) NOT NULL,
	"role" varchar(255) NOT NULL,
	"category" "work_category" NOT NULL,
	"location" varchar(200),
	"director" varchar(200),
	"production_company" varchar(200),
	"start_date" timestamp,
	"end_date" timestamp,
	"is_union" boolean DEFAULT false,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "media_type" NOT NULL,
	"url" varchar(1024) NOT NULL,
	"key" varchar(512) NOT NULL,
	"bucket" varchar(255) NOT NULL,
	"filename" varchar(255) NOT NULL,
	"content_type" varchar(127) NOT NULL,
	"size" varchar(20) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" "skill_category" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "skills_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "talent_skills" (
	"talent_profile_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"proficiency_level" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "talent_skills_talent_profile_id_skill_id_pk" PRIMARY KEY("talent_profile_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "headshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"talent_profile_id" uuid NOT NULL,
	"url" varchar(500) NOT NULL,
	"thumbnail_url" varchar(500),
	"original_filename" varchar(255),
	"mime_type" varchar(50),
	"file_size" integer,
	"width" integer,
	"height" integer,
	"is_primary" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "document_access_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"user_id" uuid,
	"action" "document_access_action" NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"uploaded_by_id" uuid,
	"document_type" "document_type" NOT NULL,
	"name" varchar(255) NOT NULL,
	"original_filename" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size" integer NOT NULL,
	"s3_key" varchar(500) NOT NULL,
	"encryption_salt" varchar(64) NOT NULL,
	"encryption_iv" varchar(48) NOT NULL,
	"encryption_auth_tag" varchar(48) NOT NULL,
	"is_producer_uploaded" boolean DEFAULT false NOT NULL,
	"description" text,
	"tax_year" integer,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "documents_s3_key_unique" UNIQUE("s3_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"talent_profile_id" uuid NOT NULL,
	"title" varchar(255),
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"status" "availability_status" DEFAULT 'available' NOT NULL,
	"is_all_day" boolean DEFAULT true,
	"notes" text,
	"recurrence_pattern" "recurrence_pattern" DEFAULT 'none',
	"recurrence_end_date" timestamp,
	"ical_token" uuid DEFAULT gen_random_uuid(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "availability_ical_token_unique" UNIQUE("ical_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "show_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"talent_profile_id" uuid NOT NULL,
	"show_name" varchar(255) NOT NULL,
	"role" varchar(255),
	"venue" varchar(255),
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"show_schedule_status" "show_schedule_status" DEFAULT 'confirmed' NOT NULL,
	"is_public" boolean DEFAULT false,
	"show_metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversation_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"last_read_at" timestamp,
	"is_archived" boolean DEFAULT false,
	"is_muted" boolean DEFAULT false,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"left_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "conversation_type" DEFAULT 'direct' NOT NULL,
	"subject" varchar(255),
	"show_id" uuid,
	"created_by_id" uuid,
	"last_message_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "message_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"subject" varchar(255),
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid,
	"content" text NOT NULL,
	"parent_message_id" uuid,
	"attachments" text,
	"is_edited" boolean DEFAULT false,
	"edited_at" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"type" "show_type" DEFAULT 'play',
	"description" text,
	"venue" varchar(255),
	"rehearsal_start" timestamp,
	"performance_start" timestamp,
	"performance_end" timestamp,
	"union_status" "union_status" DEFAULT 'both',
	"status" "show_status" DEFAULT 'planning',
	"is_public" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"show_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" "role_type" DEFAULT 'supporting',
	"age_range_min" integer,
	"age_range_max" integer,
	"vocal_range" varchar(100),
	"notes" text,
	"position_count" integer DEFAULT 1,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"stripe_invoice_id" varchar(255) NOT NULL,
	"amount_due" integer NOT NULL,
	"amount_paid" integer DEFAULT 0 NOT NULL,
	"currency" varchar(3) DEFAULT 'usd' NOT NULL,
	"status" "invoice_status" NOT NULL,
	"invoice_url" text,
	"invoice_pdf" text,
	"paid_at" timestamp,
	"period_start" timestamp,
	"period_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_stripe_invoice_id_unique" UNIQUE("stripe_invoice_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"stripe_customer_id" varchar(255) NOT NULL,
	"stripe_subscription_id" varchar(255),
	"plan" "subscription_plan",
	"status" "subscription_status" DEFAULT 'trialing' NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"canceled_at" timestamp,
	"cancel_at_period_end" timestamp,
	"trial_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audition_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audition_id" uuid NOT NULL,
	"talent_profile_id" uuid NOT NULL,
	"status" "application_status" DEFAULT 'submitted',
	"materials" jsonb DEFAULT '{}'::jsonb,
	"notes" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audition_form_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audition_id" uuid NOT NULL,
	"talent_profile_id" uuid NOT NULL,
	"responses" jsonb DEFAULT '{}'::jsonb,
	"checked_in_at" timestamp,
	"queue_number" integer,
	"status" "checkin_status" DEFAULT 'checked_in',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audition_forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audition_id" uuid NOT NULL,
	"fields" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "audition_forms_audition_id_unique" UNIQUE("audition_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audition_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audition_id" uuid NOT NULL,
	"talent_profile_id" uuid NOT NULL,
	"note" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audition_roles" (
	"audition_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	CONSTRAINT "audition_roles_audition_id_role_id_pk" PRIMARY KEY("audition_id","role_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"show_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"slug" varchar(255) NOT NULL,
	"location" varchar(255),
	"is_virtual" boolean DEFAULT false,
	"audition_dates" jsonb DEFAULT '[]'::jsonb,
	"submission_deadline" timestamp,
	"requirements" jsonb DEFAULT '{}'::jsonb,
	"materials" jsonb DEFAULT '{}'::jsonb,
	"visibility" "audition_visibility" DEFAULT 'public',
	"publish_at" timestamp,
	"status" "audition_status" DEFAULT 'draft',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "auditions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audition_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audition_id" uuid NOT NULL,
	"talent_profile_id" uuid NOT NULL,
	"role_id" uuid,
	"round" integer DEFAULT 0 NOT NULL,
	"callback_session_id" uuid,
	"decision" "audition_decision" NOT NULL,
	"notes" text,
	"decided_by" uuid,
	"decided_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "callback_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"callback_session_id" uuid NOT NULL,
	"talent_profile_id" uuid NOT NULL,
	"role_id" uuid,
	"scheduled_date" timestamp,
	"scheduled_time" varchar(10),
	"time_slot_id" varchar(100),
	"checked_in_at" timestamp,
	"queue_number" integer,
	"email_sent_at" timestamp,
	"email_status" varchar(50) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "callback_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"callback_session_id" uuid NOT NULL,
	"talent_profile_id" uuid NOT NULL,
	"role_id" uuid,
	"content" text,
	"author_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "callback_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audition_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"round" integer DEFAULT 1 NOT NULL,
	"location" varchar(255),
	"is_virtual" boolean DEFAULT false,
	"notes" text,
	"schedule_dates" jsonb DEFAULT '[]'::jsonb,
	"slot_duration_minutes" integer DEFAULT 15,
	"status" "callback_status" DEFAULT 'scheduled',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "casting_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"show_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"talent_profile_id" uuid NOT NULL,
	"slot_index" integer DEFAULT 0 NOT NULL,
	"status" "casting_status" DEFAULT 'draft' NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"notes" text,
	"assigned_by" uuid,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "casting_assignments_unique_talent_show" UNIQUE("show_id","talent_profile_id"),
	CONSTRAINT "casting_assignments_unique_role_slot" UNIQUE("role_id","slot_index")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "casting_deck" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"show_id" uuid NOT NULL,
	"talent_profile_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"added_by" uuid,
	"added_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "casting_deck_unique_talent_show" UNIQUE("show_id","talent_profile_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "casting_presence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"show_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"user_name" varchar(255) NOT NULL,
	"cursor_position" varchar(100),
	"selected_talent_id" uuid,
	"color" varchar(7),
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "casting_presence_unique_user_show" UNIQUE("show_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cast_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"show_id" uuid NOT NULL,
	"assignment_id" uuid NOT NULL,
	"talent_profile_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"template_id" uuid,
	"subject" varchar(500) NOT NULL,
	"body" text NOT NULL,
	"rendered_body" text,
	"status" "notification_status" DEFAULT 'draft' NOT NULL,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"response_type" "response_type" DEFAULT 'pending' NOT NULL,
	"responded_at" timestamp,
	"response_note" text,
	"response_deadline" timestamp,
	"reminder_count" varchar(10) DEFAULT '0',
	"last_reminder_at" timestamp,
	"sent_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cast_notifications_unique_assignment" UNIQUE("assignment_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "template_type" DEFAULT 'custom' NOT NULL,
	"subject" varchar(500) NOT NULL,
	"body" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"merge_fields" jsonb DEFAULT '["talent_name","talent_first_name","role_name","show_title","organization_name","response_deadline","rehearsal_start","performance_dates"]'::jsonb,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_id" uuid NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"event_data" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "department_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(100),
	"can_edit" boolean DEFAULT false NOT NULL,
	"can_delete" boolean DEFAULT false NOT NULL,
	"can_manage_files" boolean DEFAULT false NOT NULL,
	"added_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "department_members_unique_user_department" UNIQUE("department_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "note_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"show_id" uuid NOT NULL,
	"department_type" "department_type",
	"name" varchar(255) NOT NULL,
	"description" text,
	"content" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "production_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"show_id" uuid NOT NULL,
	"department_id" uuid,
	"activity_type" "activity_type" NOT NULL,
	"entity_id" uuid,
	"entity_type" varchar(50),
	"description" text NOT NULL,
	"metadata" jsonb,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "production_departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"show_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" "department_type" DEFAULT 'custom' NOT NULL,
	"description" text,
	"color" varchar(7),
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"head_user_id" uuid,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "production_departments_unique_show_type" UNIQUE("show_id","type")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "production_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid NOT NULL,
	"folder_id" uuid,
	"note_id" uuid,
	"name" varchar(255) NOT NULL,
	"original_filename" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size" integer NOT NULL,
	"s3_key" varchar(500) NOT NULL,
	"thumbnail_s3_key" varchar(500),
	"is_image" boolean DEFAULT false NOT NULL,
	"is_pdf" boolean DEFAULT false NOT NULL,
	"uploaded_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "production_files_s3_key_unique" UNIQUE("s3_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "production_folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"parent_folder_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "production_note_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"note_id" uuid NOT NULL,
	"parent_comment_id" uuid,
	"content" text NOT NULL,
	"mentions" jsonb DEFAULT '[]'::jsonb,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"resolved_by" uuid,
	"resolved_at" timestamp,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "production_note_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"note_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text,
	"changes_summary" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "production_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid NOT NULL,
	"folder_id" uuid,
	"title" varchar(255) NOT NULL,
	"content" text,
	"template_type" varchar(50),
	"version" integer DEFAULT 1 NOT NULL,
	"is_draft" boolean DEFAULT false NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"access_level" "note_access_level" DEFAULT 'department_member' NOT NULL,
	"last_edited_by" uuid,
	"last_edited_at" timestamp,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_cast" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"talent_profile_id" uuid NOT NULL,
	"role_id" uuid,
	"notified_at" timestamp,
	"acknowledged_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "event_cast_unique_talent_event" UNIQUE("event_id","talent_profile_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "schedule_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"show_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"event_type" "schedule_event_type" DEFAULT 'rehearsal' NOT NULL,
	"status" "schedule_event_status" DEFAULT 'scheduled' NOT NULL,
	"location" varchar(255),
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"is_all_cast" boolean DEFAULT false NOT NULL,
	"notes" text,
	"attachments" jsonb,
	"ical_uid" uuid DEFAULT gen_random_uuid(),
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "schedule_events_ical_uid_unique" UNIQUE("ical_uid")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "schedule_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "schedule_notification_type" NOT NULL,
	"subject" varchar(500),
	"body" text,
	"sent_at" timestamp,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "budget_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"budget_id" uuid NOT NULL,
	"category" "budget_category" DEFAULT 'miscellaneous' NOT NULL,
	"custom_category_name" varchar(100),
	"description" text,
	"budgeted_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"show_id" uuid NOT NULL,
	"name" varchar(255) DEFAULT 'Production Budget' NOT NULL,
	"description" text,
	"total_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"fiscal_year_start" timestamp,
	"fiscal_year_end" timestamp,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "budgets_show_id_unique" UNIQUE("show_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"show_id" uuid NOT NULL,
	"budget_line_id" uuid,
	"amount" numeric(12, 2) NOT NULL,
	"date" timestamp NOT NULL,
	"vendor" varchar(255),
	"description" text,
	"receipt_url" varchar(500),
	"receipt_s3_key" varchar(500),
	"receipt_filename" varchar(255),
	"receipt_mime_type" varchar(100),
	"is_paid" boolean DEFAULT false NOT NULL,
	"payment_method" varchar(100),
	"payment_reference" varchar(255),
	"submitted_by" uuid NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reimbursement_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expense_id" uuid NOT NULL,
	"status" "reimbursement_status" DEFAULT 'pending' NOT NULL,
	"amount_requested" numeric(12, 2) NOT NULL,
	"justification" text,
	"requested_by" uuid NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"review_note" text,
	"paid_at" timestamp,
	"paid_by" uuid,
	"payment_reference" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reimbursement_requests_expense_id_unique" UNIQUE("expense_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "material_access_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_type" "material_type" NOT NULL,
	"material_id" uuid NOT NULL,
	"user_id" uuid,
	"action" "material_access_action_type" NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "material_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_type" "material_type" NOT NULL,
	"material_id" uuid NOT NULL,
	"grant_type" "grant_type" NOT NULL,
	"granted_to_user_id" uuid,
	"granted_to_role_id" uuid,
	"show_id" uuid NOT NULL,
	"can_download" boolean DEFAULT false NOT NULL,
	"can_view" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"granted_by" uuid,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "material_permissions_unique_user" UNIQUE("material_type","material_id","granted_to_user_id"),
	CONSTRAINT "material_permissions_unique_role" UNIQUE("material_type","material_id","granted_to_role_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "minus_tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"show_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"act" varchar(50),
	"scene" varchar(50),
	"track_number" integer,
	"original_key" varchar(20),
	"tempo" integer,
	"notes" text,
	"filename" varchar(255) NOT NULL,
	"original_filename" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size" integer NOT NULL,
	"s3_key" varchar(500) NOT NULL,
	"duration" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"uploaded_by" uuid,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "minus_tracks_s3_key_unique" UNIQUE("s3_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scripts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"show_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"filename" varchar(255) NOT NULL,
	"original_filename" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size" integer NOT NULL,
	"s3_key" varchar(500) NOT NULL,
	"title" varchar(255),
	"revision_notes" text,
	"uploaded_by" uuid,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "scripts_s3_key_unique" UNIQUE("s3_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"type" "invitation_type" NOT NULL,
	"target_id" uuid NOT NULL,
	"role" varchar(50) NOT NULL,
	"token" varchar(255) NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"invited_by" uuid NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp,
	"responded_by" uuid,
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "organization_role" DEFAULT 'associate_producer' NOT NULL,
	"invited_by" uuid,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "org_members_org_user_unique" UNIQUE("organization_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "permission_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" varchar(50) NOT NULL,
	"target_type" varchar(20) NOT NULL,
	"target_id" uuid NOT NULL,
	"old_role" varchar(50),
	"new_role" varchar(50),
	"metadata" jsonb,
	"performed_by" uuid NOT NULL,
	"performed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "show_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"show_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "show_role" NOT NULL,
	"permissions" jsonb,
	"invited_by" uuid,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "show_members_show_user_unique" UNIQUE("show_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saved_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"filters" jsonb NOT NULL,
	"sort_order" "talent_search_sort_order" DEFAULT 'relevance',
	"notify_on_match" boolean DEFAULT false NOT NULL,
	"last_notified_at" timestamp,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "talent_list_members" (
	"list_id" uuid NOT NULL,
	"talent_profile_id" uuid NOT NULL,
	"notes" text,
	"added_by" uuid,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "talent_list_members_list_id_talent_profile_id_pk" PRIMARY KEY("list_id","talent_profile_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "talent_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(20) DEFAULT 'blue',
	"is_shared" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"type" "email_type" NOT NULL,
	"to_email" varchar(255) NOT NULL,
	"from_email" varchar(255) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"resend_id" varchar(255),
	"status" "email_status" DEFAULT 'queued' NOT NULL,
	"queued_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"bounced_at" timestamp,
	"failed_at" timestamp,
	"error" text,
	"error_code" varchar(50),
	"metadata" jsonb,
	"retry_count" varchar(10) DEFAULT '0',
	"last_retry_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email_type" "email_type" NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"frequency" "email_frequency" DEFAULT 'immediate' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_preferences_user_type_unique" UNIQUE("user_id","email_type")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_unsubscribe_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"email_type" "email_type",
	"used_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_unsubscribe_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "in_app_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "in_app_notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"data" jsonb,
	"read_at" timestamp,
	"clicked_at" timestamp,
	"push_sent_at" timestamp,
	"push_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"push_enabled" boolean DEFAULT true NOT NULL,
	"new_message" boolean DEFAULT true NOT NULL,
	"schedule_change" boolean DEFAULT true NOT NULL,
	"rehearsal_reminder" boolean DEFAULT true NOT NULL,
	"callback_notification" boolean DEFAULT true NOT NULL,
	"cast_decision" boolean DEFAULT true NOT NULL,
	"document_shared" boolean DEFAULT true NOT NULL,
	"comment_mention" boolean DEFAULT true NOT NULL,
	"audition_submission" boolean DEFAULT true NOT NULL,
	"system_announcement" boolean DEFAULT true NOT NULL,
	"dnd_enabled" boolean DEFAULT false NOT NULL,
	"dnd_start" varchar(5),
	"dnd_end" varchar(5),
	"timezone" varchar(100) DEFAULT 'UTC',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"keys" jsonb NOT NULL,
	"user_agent" text,
	"device_name" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "video_samples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"talent_profile_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"category" "video_category" NOT NULL,
	"tags" varchar(500),
	"visibility" "video_visibility" DEFAULT 'public' NOT NULL,
	"source_type" "video_source_type" DEFAULT 'upload' NOT NULL,
	"source_url" varchar(1024),
	"processed_url" varchar(1024),
	"thumbnail_url" varchar(1024),
	"original_filename" varchar(255),
	"mime_type" varchar(50),
	"file_size" integer,
	"duration" integer,
	"width" integer,
	"height" integer,
	"status" "video_status" DEFAULT 'processing' NOT NULL,
	"processing_error" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compliance_deadlines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"show_id" uuid,
	"document_type" "document_type" NOT NULL,
	"year" integer,
	"deadline" timestamp NOT NULL,
	"reminder_days" integer DEFAULT 7,
	"reminder_sent" timestamp,
	"description" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "compliance_deadlines_unique" UNIQUE("organization_id","show_id","document_type","year")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "producer_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"show_id" uuid,
	"talent_profile_id" uuid NOT NULL,
	"document_type" "document_type" NOT NULL,
	"year" integer,
	"status" "producer_document_status" DEFAULT 'pending' NOT NULL,
	"notification_sent_at" timestamp,
	"email_id" varchar(255),
	"viewed_at" timestamp,
	"viewed_by_user_id" uuid,
	"downloaded_at" timestamp,
	"uploaded_by" uuid NOT NULL,
	"deadline" timestamp,
	"notes" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "producer_docs_unique_doc_talent" UNIQUE("document_id","talent_profile_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "blocked_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"blocked_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "login_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"browser" varchar(255),
	"location" varchar(255),
	"ip_address" varchar(45),
	"successful" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"theme" "theme_mode" DEFAULT 'system',
	"language" varchar(10) DEFAULT 'en',
	"timezone" varchar(100) DEFAULT 'UTC',
	"activity_visible" boolean DEFAULT true,
	"two_factor_enabled" boolean DEFAULT false,
	"two_factor_secret" varchar(255),
	"security_notifications" boolean DEFAULT true,
	"blocked_user_ids" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "talent_profiles" ADD CONSTRAINT "talent_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "producer_profiles" ADD CONSTRAINT "producer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_photos" ADD CONSTRAINT "production_photos_producer_profile_id_producer_profiles_id_fk" FOREIGN KEY ("producer_profile_id") REFERENCES "public"."producer_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resume_configurations" ADD CONSTRAINT "resume_configurations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "education" ADD CONSTRAINT "education_talent_profile_id_talent_profiles_id_fk" FOREIGN KEY ("talent_profile_id") REFERENCES "public"."talent_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_history" ADD CONSTRAINT "work_history_talent_profile_id_talent_profiles_id_fk" FOREIGN KEY ("talent_profile_id") REFERENCES "public"."talent_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media" ADD CONSTRAINT "media_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "talent_skills" ADD CONSTRAINT "talent_skills_talent_profile_id_talent_profiles_id_fk" FOREIGN KEY ("talent_profile_id") REFERENCES "public"."talent_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "talent_skills" ADD CONSTRAINT "talent_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "headshots" ADD CONSTRAINT "headshots_talent_profile_id_talent_profiles_id_fk" FOREIGN KEY ("talent_profile_id") REFERENCES "public"."talent_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "availability" ADD CONSTRAINT "availability_talent_profile_id_talent_profiles_id_fk" FOREIGN KEY ("talent_profile_id") REFERENCES "public"."talent_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "show_schedules" ADD CONSTRAINT "show_schedules_talent_profile_id_talent_profiles_id_fk" FOREIGN KEY ("talent_profile_id") REFERENCES "public"."talent_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversations" ADD CONSTRAINT "conversations_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shows" ADD CONSTRAINT "shows_organization_id_producer_profiles_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."producer_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "roles" ADD CONSTRAINT "roles_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organization_id_producer_profiles_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."producer_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_producer_profiles_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."producer_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audition_applications" ADD CONSTRAINT "audition_applications_audition_id_auditions_id_fk" FOREIGN KEY ("audition_id") REFERENCES "public"."auditions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audition_applications" ADD CONSTRAINT "audition_applications_talent_profile_id_talent_profiles_id_fk" FOREIGN KEY ("talent_profile_id") REFERENCES "public"."talent_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audition_form_responses" ADD CONSTRAINT "audition_form_responses_audition_id_auditions_id_fk" FOREIGN KEY ("audition_id") REFERENCES "public"."auditions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audition_form_responses" ADD CONSTRAINT "audition_form_responses_talent_profile_id_talent_profiles_id_fk" FOREIGN KEY ("talent_profile_id") REFERENCES "public"."talent_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audition_forms" ADD CONSTRAINT "audition_forms_audition_id_auditions_id_fk" FOREIGN KEY ("audition_id") REFERENCES "public"."auditions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audition_notes" ADD CONSTRAINT "audition_notes_audition_id_auditions_id_fk" FOREIGN KEY ("audition_id") REFERENCES "public"."auditions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audition_notes" ADD CONSTRAINT "audition_notes_talent_profile_id_talent_profiles_id_fk" FOREIGN KEY ("talent_profile_id") REFERENCES "public"."talent_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audition_notes" ADD CONSTRAINT "audition_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audition_roles" ADD CONSTRAINT "audition_roles_audition_id_auditions_id_fk" FOREIGN KEY ("audition_id") REFERENCES "public"."auditions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audition_roles" ADD CONSTRAINT "audition_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "auditions" ADD CONSTRAINT "auditions_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "auditions" ADD CONSTRAINT "auditions_organization_id_producer_profiles_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."producer_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audition_decisions" ADD CONSTRAINT "audition_decisions_audition_id_auditions_id_fk" FOREIGN KEY ("audition_id") REFERENCES "public"."auditions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audition_decisions" ADD CONSTRAINT "audition_decisions_talent_profile_id_talent_profiles_id_fk" FOREIGN KEY ("talent_profile_id") REFERENCES "public"."talent_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audition_decisions" ADD CONSTRAINT "audition_decisions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audition_decisions" ADD CONSTRAINT "audition_decisions_callback_session_id_callback_sessions_id_fk" FOREIGN KEY ("callback_session_id") REFERENCES "public"."callback_sessions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "callback_invitations" ADD CONSTRAINT "callback_invitations_callback_session_id_callback_sessions_id_fk" FOREIGN KEY ("callback_session_id") REFERENCES "public"."callback_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "callback_invitations" ADD CONSTRAINT "callback_invitations_talent_profile_id_talent_profiles_id_fk" FOREIGN KEY ("talent_profile_id") REFERENCES "public"."talent_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "callback_invitations" ADD CONSTRAINT "callback_invitations_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "callback_notes" ADD CONSTRAINT "callback_notes_callback_session_id_callback_sessions_id_fk" FOREIGN KEY ("callback_session_id") REFERENCES "public"."callback_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "callback_notes" ADD CONSTRAINT "callback_notes_talent_profile_id_talent_profiles_id_fk" FOREIGN KEY ("talent_profile_id") REFERENCES "public"."talent_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "callback_notes" ADD CONSTRAINT "callback_notes_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "callback_sessions" ADD CONSTRAINT "callback_sessions_audition_id_auditions_id_fk" FOREIGN KEY ("audition_id") REFERENCES "public"."auditions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "casting_assignments" ADD CONSTRAINT "casting_assignments_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "casting_assignments" ADD CONSTRAINT "casting_assignments_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "casting_assignments" ADD CONSTRAINT "casting_assignments_talent_profile_id_talent_profiles_id_fk" FOREIGN KEY ("talent_profile_id") REFERENCES "public"."talent_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "casting_assignments" ADD CONSTRAINT "casting_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "casting_deck" ADD CONSTRAINT "casting_deck_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "casting_deck" ADD CONSTRAINT "casting_deck_talent_profile_id_talent_profiles_id_fk" FOREIGN KEY ("talent_profile_id") REFERENCES "public"."talent_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "casting_deck" ADD CONSTRAINT "casting_deck_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "casting_presence" ADD CONSTRAINT "casting_presence_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "casting_presence" ADD CONSTRAINT "casting_presence_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cast_notifications" ADD CONSTRAINT "cast_notifications_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cast_notifications" ADD CONSTRAINT "cast_notifications_assignment_id_casting_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."casting_assignments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cast_notifications" ADD CONSTRAINT "cast_notifications_talent_profile_id_talent_profiles_id_fk" FOREIGN KEY ("talent_profile_id") REFERENCES "public"."talent_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cast_notifications" ADD CONSTRAINT "cast_notifications_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cast_notifications" ADD CONSTRAINT "cast_notifications_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cast_notifications" ADD CONSTRAINT "cast_notifications_sent_by_users_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_organization_id_producer_profiles_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."producer_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_notification_id_cast_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."cast_notifications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "department_members" ADD CONSTRAINT "department_members_department_id_production_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."production_departments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "department_members" ADD CONSTRAINT "department_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "department_members" ADD CONSTRAINT "department_members_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "note_templates" ADD CONSTRAINT "note_templates_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "note_templates" ADD CONSTRAINT "note_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_activity" ADD CONSTRAINT "production_activity_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_activity" ADD CONSTRAINT "production_activity_department_id_production_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."production_departments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_activity" ADD CONSTRAINT "production_activity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_departments" ADD CONSTRAINT "production_departments_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_departments" ADD CONSTRAINT "production_departments_head_user_id_users_id_fk" FOREIGN KEY ("head_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_departments" ADD CONSTRAINT "production_departments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_files" ADD CONSTRAINT "production_files_department_id_production_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."production_departments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_files" ADD CONSTRAINT "production_files_folder_id_production_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."production_folders"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_files" ADD CONSTRAINT "production_files_note_id_production_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."production_notes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_files" ADD CONSTRAINT "production_files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_folders" ADD CONSTRAINT "production_folders_department_id_production_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."production_departments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_folders" ADD CONSTRAINT "production_folders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_note_comments" ADD CONSTRAINT "production_note_comments_note_id_production_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."production_notes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_note_comments" ADD CONSTRAINT "production_note_comments_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_note_comments" ADD CONSTRAINT "production_note_comments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_note_versions" ADD CONSTRAINT "production_note_versions_note_id_production_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."production_notes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_note_versions" ADD CONSTRAINT "production_note_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_notes" ADD CONSTRAINT "production_notes_department_id_production_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."production_departments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_notes" ADD CONSTRAINT "production_notes_folder_id_production_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."production_folders"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_notes" ADD CONSTRAINT "production_notes_last_edited_by_users_id_fk" FOREIGN KEY ("last_edited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_notes" ADD CONSTRAINT "production_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_cast" ADD CONSTRAINT "event_cast_event_id_schedule_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."schedule_events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_cast" ADD CONSTRAINT "event_cast_talent_profile_id_talent_profiles_id_fk" FOREIGN KEY ("talent_profile_id") REFERENCES "public"."talent_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_cast" ADD CONSTRAINT "event_cast_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedule_events" ADD CONSTRAINT "schedule_events_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedule_events" ADD CONSTRAINT "schedule_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedule_notifications" ADD CONSTRAINT "schedule_notifications_event_id_schedule_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."schedule_events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedule_notifications" ADD CONSTRAINT "schedule_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "budgets" ADD CONSTRAINT "budgets_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "budgets" ADD CONSTRAINT "budgets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expenses" ADD CONSTRAINT "expenses_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expenses" ADD CONSTRAINT "expenses_budget_line_id_budget_lines_id_fk" FOREIGN KEY ("budget_line_id") REFERENCES "public"."budget_lines"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expenses" ADD CONSTRAINT "expenses_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reimbursement_requests" ADD CONSTRAINT "reimbursement_requests_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reimbursement_requests" ADD CONSTRAINT "reimbursement_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reimbursement_requests" ADD CONSTRAINT "reimbursement_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reimbursement_requests" ADD CONSTRAINT "reimbursement_requests_paid_by_users_id_fk" FOREIGN KEY ("paid_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "material_access_logs" ADD CONSTRAINT "material_access_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "material_permissions" ADD CONSTRAINT "material_permissions_granted_to_user_id_users_id_fk" FOREIGN KEY ("granted_to_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "material_permissions" ADD CONSTRAINT "material_permissions_granted_to_role_id_roles_id_fk" FOREIGN KEY ("granted_to_role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "material_permissions" ADD CONSTRAINT "material_permissions_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "material_permissions" ADD CONSTRAINT "material_permissions_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "minus_tracks" ADD CONSTRAINT "minus_tracks_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "minus_tracks" ADD CONSTRAINT "minus_tracks_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scripts" ADD CONSTRAINT "scripts_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scripts" ADD CONSTRAINT "scripts_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invitations" ADD CONSTRAINT "invitations_responded_by_users_id_fk" FOREIGN KEY ("responded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_producer_profiles_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."producer_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "permission_audit_log" ADD CONSTRAINT "permission_audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "permission_audit_log" ADD CONSTRAINT "permission_audit_log_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "show_members" ADD CONSTRAINT "show_members_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "show_members" ADD CONSTRAINT "show_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "show_members" ADD CONSTRAINT "show_members_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_organization_id_producer_profiles_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."producer_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "talent_list_members" ADD CONSTRAINT "talent_list_members_list_id_talent_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."talent_lists"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "talent_list_members" ADD CONSTRAINT "talent_list_members_talent_profile_id_talent_profiles_id_fk" FOREIGN KEY ("talent_profile_id") REFERENCES "public"."talent_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "talent_list_members" ADD CONSTRAINT "talent_list_members_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "talent_lists" ADD CONSTRAINT "talent_lists_organization_id_producer_profiles_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."producer_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "talent_lists" ADD CONSTRAINT "talent_lists_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_preferences" ADD CONSTRAINT "email_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_unsubscribe_tokens" ADD CONSTRAINT "email_unsubscribe_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "video_samples" ADD CONSTRAINT "video_samples_talent_profile_id_talent_profiles_id_fk" FOREIGN KEY ("talent_profile_id") REFERENCES "public"."talent_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "compliance_deadlines" ADD CONSTRAINT "compliance_deadlines_organization_id_producer_profiles_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."producer_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "compliance_deadlines" ADD CONSTRAINT "compliance_deadlines_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "compliance_deadlines" ADD CONSTRAINT "compliance_deadlines_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "producer_documents" ADD CONSTRAINT "producer_documents_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "producer_documents" ADD CONSTRAINT "producer_documents_organization_id_producer_profiles_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."producer_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "producer_documents" ADD CONSTRAINT "producer_documents_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "producer_documents" ADD CONSTRAINT "producer_documents_talent_profile_id_talent_profiles_id_fk" FOREIGN KEY ("talent_profile_id") REFERENCES "public"."talent_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "producer_documents" ADD CONSTRAINT "producer_documents_viewed_by_user_id_users_id_fk" FOREIGN KEY ("viewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "producer_documents" ADD CONSTRAINT "producer_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blocked_user_id_users_id_fk" FOREIGN KEY ("blocked_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "login_history" ADD CONSTRAINT "login_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_id_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_user_type_idx" ON "users" USING btree ("user_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "resume_talent_profiles_user_id_idx" ON "talent_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "producer_profiles_user_id_idx" ON "producer_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "producer_profiles_slug_idx" ON "producer_profiles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "producer_profiles_is_public_idx" ON "producer_profiles" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "producer_profiles_location_idx" ON "producer_profiles" USING btree ("location");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_photos_producer_profile_id_idx" ON "production_photos" USING btree ("producer_profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_photos_is_featured_idx" ON "production_photos" USING btree ("producer_profile_id","is_featured");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_photos_sort_order_idx" ON "production_photos" USING btree ("producer_profile_id","sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "resume_configurations_user_id_idx" ON "resume_configurations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "education_talent_profile_id_idx" ON "education" USING btree ("talent_profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "education_sort_order_idx" ON "education" USING btree ("talent_profile_id","sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_history_talent_profile_id_idx" ON "work_history" USING btree ("talent_profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_history_sort_order_idx" ON "work_history" USING btree ("talent_profile_id","sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_user_id_idx" ON "media" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_type_idx" ON "media" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_key_idx" ON "media" USING btree ("key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "skills_name_idx" ON "skills" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "skills_category_idx" ON "skills" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "talent_skills_talent_profile_id_idx" ON "talent_skills" USING btree ("talent_profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "talent_skills_skill_id_idx" ON "talent_skills" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "headshots_talent_profile_id_idx" ON "headshots" USING btree ("talent_profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "headshots_is_primary_idx" ON "headshots" USING btree ("talent_profile_id","is_primary");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "headshots_sort_order_idx" ON "headshots" USING btree ("talent_profile_id","sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "document_access_logs_document_id_idx" ON "document_access_logs" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "document_access_logs_user_id_idx" ON "document_access_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "document_access_logs_action_idx" ON "document_access_logs" USING btree ("document_id","action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "document_access_logs_created_at_idx" ON "document_access_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_owner_id_idx" ON "documents" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_uploaded_by_id_idx" ON "documents" USING btree ("uploaded_by_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_document_type_idx" ON "documents" USING btree ("owner_id","document_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_created_at_idx" ON "documents" USING btree ("owner_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_deleted_at_idx" ON "documents" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "availability_talent_profile_id_idx" ON "availability" USING btree ("talent_profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "availability_date_range_idx" ON "availability" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "availability_status_idx" ON "availability" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "availability_ical_token_idx" ON "availability" USING btree ("ical_token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "show_schedules_talent_profile_id_idx" ON "show_schedules" USING btree ("talent_profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "show_schedules_date_range_idx" ON "show_schedules" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "show_schedules_status_idx" ON "show_schedules" USING btree ("show_schedule_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversation_participants_conversation_idx" ON "conversation_participants" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversation_participants_user_idx" ON "conversation_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversation_participants_user_conversation_idx" ON "conversation_participants" USING btree ("user_id","conversation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversations_created_by_idx" ON "conversations" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversations_last_message_at_idx" ON "conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversations_type_idx" ON "conversations" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_templates_user_idx" ON "message_templates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_conversation_idx" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_sender_idx" ON "messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_created_at_idx" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_parent_message_idx" ON "messages" USING btree ("parent_message_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shows_organization_id_idx" ON "shows" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shows_status_idx" ON "shows" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shows_is_public_idx" ON "shows" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "roles_show_id_idx" ON "roles" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "roles_sort_order_idx" ON "roles" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_organization_id_idx" ON "invoices" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_stripe_invoice_id_idx" ON "invoices" USING btree ("stripe_invoice_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_organization_id_idx" ON "subscriptions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_stripe_customer_id_idx" ON "subscriptions" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_stripe_subscription_id_idx" ON "subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audition_applications_audition_id_idx" ON "audition_applications" USING btree ("audition_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audition_applications_talent_profile_id_idx" ON "audition_applications" USING btree ("talent_profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audition_applications_status_idx" ON "audition_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audition_applications_submitted_at_idx" ON "audition_applications" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audition_form_responses_audition_id_idx" ON "audition_form_responses" USING btree ("audition_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audition_form_responses_talent_profile_id_idx" ON "audition_form_responses" USING btree ("talent_profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audition_form_responses_status_idx" ON "audition_form_responses" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audition_form_responses_queue_number_idx" ON "audition_form_responses" USING btree ("queue_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audition_form_responses_checked_in_at_idx" ON "audition_form_responses" USING btree ("checked_in_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audition_forms_audition_id_idx" ON "audition_forms" USING btree ("audition_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audition_notes_audition_id_idx" ON "audition_notes" USING btree ("audition_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audition_notes_talent_profile_id_idx" ON "audition_notes" USING btree ("talent_profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audition_notes_created_by_idx" ON "audition_notes" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audition_notes_created_at_idx" ON "audition_notes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audition_roles_audition_id_idx" ON "audition_roles" USING btree ("audition_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audition_roles_role_id_idx" ON "audition_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auditions_show_id_idx" ON "auditions" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auditions_organization_id_idx" ON "auditions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auditions_slug_idx" ON "auditions" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auditions_status_idx" ON "auditions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auditions_visibility_idx" ON "auditions" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auditions_publish_at_idx" ON "auditions" USING btree ("publish_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auditions_submission_deadline_idx" ON "auditions" USING btree ("submission_deadline");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audition_decisions_audition_id_idx" ON "audition_decisions" USING btree ("audition_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audition_decisions_talent_id_idx" ON "audition_decisions" USING btree ("talent_profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audition_decisions_role_id_idx" ON "audition_decisions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audition_decisions_round_idx" ON "audition_decisions" USING btree ("round");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audition_decisions_decision_idx" ON "audition_decisions" USING btree ("decision");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audition_decisions_callback_session_idx" ON "audition_decisions" USING btree ("callback_session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "callback_invitations_session_id_idx" ON "callback_invitations" USING btree ("callback_session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "callback_invitations_talent_id_idx" ON "callback_invitations" USING btree ("talent_profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "callback_invitations_role_id_idx" ON "callback_invitations" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "callback_invitations_scheduled_date_idx" ON "callback_invitations" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "callback_invitations_queue_number_idx" ON "callback_invitations" USING btree ("queue_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "callback_notes_session_id_idx" ON "callback_notes" USING btree ("callback_session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "callback_notes_talent_id_idx" ON "callback_notes" USING btree ("talent_profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "callback_notes_role_id_idx" ON "callback_notes" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "callback_sessions_audition_id_idx" ON "callback_sessions" USING btree ("audition_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "callback_sessions_round_idx" ON "callback_sessions" USING btree ("round");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "callback_sessions_status_idx" ON "callback_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "casting_assignments_show_id_idx" ON "casting_assignments" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "casting_assignments_role_id_idx" ON "casting_assignments" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "casting_assignments_talent_id_idx" ON "casting_assignments" USING btree ("talent_profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "casting_assignments_status_idx" ON "casting_assignments" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "casting_deck_show_id_idx" ON "casting_deck" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "casting_deck_talent_id_idx" ON "casting_deck" USING btree ("talent_profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "casting_deck_sort_order_idx" ON "casting_deck" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "casting_presence_show_id_idx" ON "casting_presence" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "casting_presence_user_id_idx" ON "casting_presence" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "casting_presence_last_seen_idx" ON "casting_presence" USING btree ("last_seen_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cast_notifications_show_id_idx" ON "cast_notifications" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cast_notifications_assignment_id_idx" ON "cast_notifications" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cast_notifications_talent_id_idx" ON "cast_notifications" USING btree ("talent_profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cast_notifications_status_idx" ON "cast_notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cast_notifications_response_type_idx" ON "cast_notifications" USING btree ("response_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cast_notifications_deadline_idx" ON "cast_notifications" USING btree ("response_deadline");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_templates_org_id_idx" ON "email_templates" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_templates_type_idx" ON "email_templates" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_templates_is_default_idx" ON "email_templates" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_events_notification_id_idx" ON "notification_events" USING btree ("notification_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_events_type_idx" ON "notification_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_events_created_at_idx" ON "notification_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "department_members_department_id_idx" ON "department_members" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "department_members_user_id_idx" ON "department_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "note_templates_show_id_idx" ON "note_templates" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "note_templates_department_type_idx" ON "note_templates" USING btree ("department_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "note_templates_is_default_idx" ON "note_templates" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_activity_show_id_idx" ON "production_activity" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_activity_department_id_idx" ON "production_activity" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_activity_user_id_idx" ON "production_activity" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_activity_activity_type_idx" ON "production_activity" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_activity_created_at_idx" ON "production_activity" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_departments_show_id_idx" ON "production_departments" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_departments_type_idx" ON "production_departments" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_departments_head_user_id_idx" ON "production_departments" USING btree ("head_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_files_department_id_idx" ON "production_files" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_files_folder_id_idx" ON "production_files" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_files_note_id_idx" ON "production_files" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_files_mime_type_idx" ON "production_files" USING btree ("mime_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_files_created_at_idx" ON "production_files" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_folders_department_id_idx" ON "production_folders" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_folders_parent_folder_id_idx" ON "production_folders" USING btree ("parent_folder_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_note_comments_note_id_idx" ON "production_note_comments" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_note_comments_parent_comment_id_idx" ON "production_note_comments" USING btree ("parent_comment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_note_comments_created_by_idx" ON "production_note_comments" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_note_comments_is_resolved_idx" ON "production_note_comments" USING btree ("is_resolved");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_note_versions_note_id_idx" ON "production_note_versions" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_note_versions_version_idx" ON "production_note_versions" USING btree ("note_id","version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_notes_department_id_idx" ON "production_notes" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_notes_folder_id_idx" ON "production_notes" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_notes_is_pinned_idx" ON "production_notes" USING btree ("is_pinned");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_notes_created_at_idx" ON "production_notes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_notes_last_edited_at_idx" ON "production_notes" USING btree ("last_edited_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_cast_event_id_idx" ON "event_cast" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_cast_talent_id_idx" ON "event_cast" USING btree ("talent_profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_cast_role_id_idx" ON "event_cast" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedule_events_show_id_idx" ON "schedule_events" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedule_events_event_type_idx" ON "schedule_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedule_events_status_idx" ON "schedule_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedule_events_start_time_idx" ON "schedule_events" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedule_events_end_time_idx" ON "schedule_events" USING btree ("end_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedule_events_ical_uid_idx" ON "schedule_events" USING btree ("ical_uid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedule_notifications_event_id_idx" ON "schedule_notifications" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedule_notifications_user_id_idx" ON "schedule_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedule_notifications_type_idx" ON "schedule_notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedule_notifications_sent_at_idx" ON "schedule_notifications" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "budget_lines_budget_id_idx" ON "budget_lines" USING btree ("budget_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "budget_lines_category_idx" ON "budget_lines" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "budget_lines_sort_order_idx" ON "budget_lines" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "budgets_show_id_idx" ON "budgets" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "budgets_created_by_idx" ON "budgets" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_show_id_idx" ON "expenses" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_budget_line_id_idx" ON "expenses" USING btree ("budget_line_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_date_idx" ON "expenses" USING btree ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_submitted_by_idx" ON "expenses" USING btree ("submitted_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_submitted_at_idx" ON "expenses" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_is_paid_idx" ON "expenses" USING btree ("is_paid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reimbursement_requests_expense_id_idx" ON "reimbursement_requests" USING btree ("expense_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reimbursement_requests_status_idx" ON "reimbursement_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reimbursement_requests_requested_by_idx" ON "reimbursement_requests" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reimbursement_requests_requested_at_idx" ON "reimbursement_requests" USING btree ("requested_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reimbursement_requests_reviewed_by_idx" ON "reimbursement_requests" USING btree ("reviewed_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "material_access_logs_material_idx" ON "material_access_logs" USING btree ("material_type","material_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "material_access_logs_user_idx" ON "material_access_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "material_access_logs_timestamp_idx" ON "material_access_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "material_access_logs_action_idx" ON "material_access_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "material_permissions_material_idx" ON "material_permissions" USING btree ("material_type","material_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "material_permissions_user_idx" ON "material_permissions" USING btree ("granted_to_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "material_permissions_role_idx" ON "material_permissions" USING btree ("granted_to_role_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "material_permissions_show_idx" ON "material_permissions" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "material_permissions_expires_at_idx" ON "material_permissions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "minus_tracks_show_id_idx" ON "minus_tracks" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "minus_tracks_act_scene_idx" ON "minus_tracks" USING btree ("show_id","act","scene");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "minus_tracks_sort_order_idx" ON "minus_tracks" USING btree ("show_id","sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "minus_tracks_uploaded_at_idx" ON "minus_tracks" USING btree ("uploaded_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scripts_show_id_idx" ON "scripts" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scripts_version_idx" ON "scripts" USING btree ("show_id","version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scripts_is_active_idx" ON "scripts" USING btree ("show_id","is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scripts_uploaded_at_idx" ON "scripts" USING btree ("uploaded_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invitations_email_idx" ON "invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invitations_token_idx" ON "invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invitations_target_id_idx" ON "invitations" USING btree ("target_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invitations_status_idx" ON "invitations" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "org_members_org_id_idx" ON "organization_members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "org_members_user_id_idx" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_user_id_idx" ON "permission_audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_target_idx" ON "permission_audit_log" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_performed_by_idx" ON "permission_audit_log" USING btree ("performed_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_performed_at_idx" ON "permission_audit_log" USING btree ("performed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "show_members_show_id_idx" ON "show_members" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "show_members_user_id_idx" ON "show_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saved_searches_organization_id_idx" ON "saved_searches" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saved_searches_created_by_idx" ON "saved_searches" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saved_searches_notify_on_match_idx" ON "saved_searches" USING btree ("notify_on_match");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "talent_list_members_list_id_idx" ON "talent_list_members" USING btree ("list_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "talent_list_members_talent_profile_id_idx" ON "talent_list_members" USING btree ("talent_profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "talent_lists_organization_id_idx" ON "talent_lists" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "talent_lists_created_by_idx" ON "talent_lists" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "talent_lists_is_shared_idx" ON "talent_lists" USING btree ("is_shared");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_logs_user_id_idx" ON "email_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_logs_type_idx" ON "email_logs" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_logs_status_idx" ON "email_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_logs_resend_id_idx" ON "email_logs" USING btree ("resend_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_logs_to_email_idx" ON "email_logs" USING btree ("to_email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_logs_created_at_idx" ON "email_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_preferences_user_id_idx" ON "email_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_preferences_type_idx" ON "email_preferences" USING btree ("email_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_unsubscribe_tokens_user_id_idx" ON "email_unsubscribe_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_unsubscribe_tokens_token_idx" ON "email_unsubscribe_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "in_app_notifications_user_id_idx" ON "in_app_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "in_app_notifications_type_idx" ON "in_app_notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "in_app_notifications_read_at_idx" ON "in_app_notifications" USING btree ("read_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "in_app_notifications_created_at_idx" ON "in_app_notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notif_prefs_user_id_idx" ON "notification_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "push_subscriptions_user_id_idx" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "push_subscriptions_endpoint_idx" ON "push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "push_subscriptions_is_active_idx" ON "push_subscriptions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "video_samples_talent_profile_id_idx" ON "video_samples" USING btree ("talent_profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "video_samples_category_idx" ON "video_samples" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "video_samples_visibility_idx" ON "video_samples" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "video_samples_status_idx" ON "video_samples" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "video_samples_is_featured_idx" ON "video_samples" USING btree ("talent_profile_id","is_featured");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "video_samples_sort_order_idx" ON "video_samples" USING btree ("talent_profile_id","sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "compliance_deadlines_org_id_idx" ON "compliance_deadlines" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "compliance_deadlines_show_id_idx" ON "compliance_deadlines" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "compliance_deadlines_deadline_idx" ON "compliance_deadlines" USING btree ("deadline");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "compliance_deadlines_doc_type_idx" ON "compliance_deadlines" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "producer_docs_org_id_idx" ON "producer_documents" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "producer_docs_show_id_idx" ON "producer_documents" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "producer_docs_talent_profile_id_idx" ON "producer_documents" USING btree ("talent_profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "producer_docs_document_id_idx" ON "producer_documents" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "producer_docs_status_idx" ON "producer_documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "producer_docs_deadline_idx" ON "producer_documents" USING btree ("deadline");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "producer_docs_doc_type_idx" ON "producer_documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "producer_docs_compliance_idx" ON "producer_documents" USING btree ("organization_id","document_type","year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "producer_docs_show_compliance_idx" ON "producer_documents" USING btree ("show_id","document_type","year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "producer_docs_viewed_at_idx" ON "producer_documents" USING btree ("viewed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "blocked_users_user_id_idx" ON "blocked_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "blocked_users_blocked_user_id_idx" ON "blocked_users" USING btree ("blocked_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "login_history_user_id_idx" ON "login_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "login_history_created_at_idx" ON "login_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_settings_user_id_idx" ON "user_settings" USING btree ("user_id");