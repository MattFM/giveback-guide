-- Migration 010: Rollback Admin Features (migrations 004-009)
-- This removes all admin panel infrastructure and restores the simple static site state

-- ============================================================================
-- Remove any functions/triggers created by admin migrations FIRST
-- ============================================================================

-- Drop profile update trigger (from migration 008) - must drop before table
DROP TRIGGER IF EXISTS on_profile_updated ON public.user_profiles;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- Drop profile auto-creation trigger (from migration 004) - must drop before table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ============================================================================
-- Drop tables created in migration 004
-- ============================================================================

DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- ============================================================================
-- Restore RLS policies to pre-admin state
-- ============================================================================

-- The lists and list_items tables should already have correct policies from migrations 001-003
-- But let's ensure they're clean by dropping any admin-added policies

-- Drop any admin-specific policies that might have been added
DROP POLICY IF EXISTS admin_all_lists ON public.lists;
DROP POLICY IF EXISTS admin_all_list_items ON public.list_items;
DROP POLICY IF EXISTS admin_all_user_item_status ON public.user_item_status;

-- Verify the original policies exist (they should from migrations 001 and 003)
-- Lists: users can only access their own
-- List items: users can only access items in their own lists
-- User item status: users can only access their own status records

-- ============================================================================
-- Note: This rollback preserves user data in lists, list_items, and user_item_status
-- Only admin infrastructure is removed
-- ============================================================================
