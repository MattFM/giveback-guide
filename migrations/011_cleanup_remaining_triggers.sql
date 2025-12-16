-- Migration 011: Cleanup any remaining triggers/functions referencing user_profiles
-- This ensures no database objects reference the removed admin tables

-- ============================================================================
-- Drop any remaining triggers on lists, list_items, or user_item_status tables
-- ============================================================================

-- Triggers from migration 008 that update user_profiles.last_active_at
DROP TRIGGER IF EXISTS update_last_active_on_list_create ON public.lists;
DROP TRIGGER IF EXISTS update_last_active_on_list_item_add ON public.list_items;
DROP TRIGGER IF EXISTS update_last_active_on_completion ON public.user_item_status;

-- Drop the function that updates last_active_at
DROP FUNCTION IF EXISTS public.update_last_active() CASCADE;

-- Drop any other triggers that might reference user_profiles
DROP TRIGGER IF EXISTS update_user_profile_stats_on_list ON public.lists;
DROP TRIGGER IF EXISTS update_user_profile_stats_on_list_item ON public.list_items;
DROP TRIGGER IF EXISTS update_user_profile_stats_on_completion ON public.user_item_status;

-- Drop any functions that reference user_profiles
DROP FUNCTION IF EXISTS public.update_user_stats() CASCADE;
DROP FUNCTION IF EXISTS public.increment_user_saved_count() CASCADE;
DROP FUNCTION IF EXISTS public.decrement_user_saved_count() CASCADE;
DROP FUNCTION IF EXISTS public.increment_user_completed_count() CASCADE;
DROP FUNCTION IF EXISTS public.sync_user_profile_stats() CASCADE;

-- ============================================================================
-- Verify core tables are clean (lists, list_items, user_item_status)
-- ============================================================================

-- These tables should only have the original RLS policies from migrations 001 and 003
-- No admin policies, no triggers, just the basic user-owns-data policies

-- Lists policies:
-- ✓ lists_user_is_owner (for all operations)

-- List items policies:
-- ✓ list_items_select_for_owner
-- ✓ list_items_insert_if_owner_of_list
-- ✓ list_items_update_if_owner_of_list
-- ✓ list_items_delete_if_owner_of_list

-- User item status policies:
-- ✓ user_item_status_user_is_owner (for all operations)
