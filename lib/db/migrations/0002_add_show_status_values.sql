-- Add new show_status enum values
ALTER TYPE "public"."show_status" ADD VALUE IF NOT EXISTS 'in_production' AFTER 'auditions';--> statement-breakpoint
ALTER TYPE "public"."show_status" ADD VALUE IF NOT EXISTS 'completed' AFTER 'running';
