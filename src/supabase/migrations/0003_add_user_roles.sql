-- Migration: Add user roles and permissions
-- Description: Adds role column to profiles table and creates RLS policies for role-based access

-- Add role column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'cashier' 
CHECK (role IN ('admin', 'cashier', 'supervisor'));

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Add created_by column to track who created the user (for audit)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);

-- Add is_active column to enable/disable users
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing users to admin (first user should be admin)
-- You can manually update this after migration
UPDATE profiles 
SET role = 'admin' 
WHERE id = (SELECT id FROM profiles ORDER BY created_at LIMIT 1);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "cashiers_own_shifts" ON shifts;
DROP POLICY IF EXISTS "cashiers_own_orders" ON orders;
DROP POLICY IF EXISTS "admins_see_all_shifts" ON shifts;
DROP POLICY IF EXISTS "admins_see_all_orders" ON orders;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Allow users to view their own profile
CREATE POLICY "users_view_own_profile" ON profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "admins_view_all_profiles" ON profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow users to update their own profile
CREATE POLICY "users_update_own_profile" ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow admins to insert new users
CREATE POLICY "admins_insert_users" ON profiles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to update any user
CREATE POLICY "admins_update_users" ON profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- SHIFTS POLICIES
-- ============================================

-- Cashiers can only view their own shifts
CREATE POLICY "cashiers_view_own_shifts" ON shifts
FOR SELECT
USING (
  cashier_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Cashiers can only insert their own shifts
CREATE POLICY "cashiers_insert_own_shifts" ON shifts
FOR INSERT
WITH CHECK (cashier_id = auth.uid());

-- Cashiers can only update their own shifts
CREATE POLICY "cashiers_update_own_shifts" ON shifts
FOR UPDATE
USING (cashier_id = auth.uid())
WITH CHECK (cashier_id = auth.uid());

-- Admins can update any shift
CREATE POLICY "admins_update_all_shifts" ON shifts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- ORDERS POLICIES
-- ============================================

-- Cashiers can only view their own orders
CREATE POLICY "cashiers_view_own_orders" ON orders
FOR SELECT
USING (
  cashier_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Cashiers can only insert their own orders
CREATE POLICY "cashiers_insert_own_orders" ON orders
FOR INSERT
WITH CHECK (cashier_id = auth.uid());

-- Cashiers can only update their own orders
CREATE POLICY "cashiers_update_own_orders" ON orders
FOR UPDATE
USING (cashier_id = auth.uid())
WITH CHECK (cashier_id = auth.uid());

-- Admins can update any order
CREATE POLICY "admins_update_all_orders" ON orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- PRODUCTS POLICIES (Read-only for cashiers)
-- ============================================

-- Everyone can view products
CREATE POLICY "everyone_view_products" ON products
FOR SELECT
USING (is_available = true OR auth.uid() IS NOT NULL);

-- Only admins can insert products
CREATE POLICY "admins_insert_products" ON products
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can update products
CREATE POLICY "admins_update_products" ON products
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- INVENTORY POLICIES (Admin only)
-- ============================================

-- Only admins can view inventory
CREATE POLICY "admins_view_inventory" ON inventory
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can insert inventory
CREATE POLICY "admins_insert_inventory" ON inventory
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can update inventory
CREATE POLICY "admins_update_inventory" ON inventory
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- LOYALTY POLICIES (Admin only for management)
-- ============================================

-- Cashiers can view loyalty customers (to apply rewards)
CREATE POLICY "cashiers_view_loyalty" ON loyalty_customers
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only admins can insert loyalty customers
CREATE POLICY "admins_insert_loyalty" ON loyalty_customers
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can update loyalty customers
CREATE POLICY "admins_update_loyalty" ON loyalty_customers
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- HELPER FUNCTION
-- ============================================

-- Function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role = 'admin' FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN profiles.role IS 'User role: admin, cashier, or supervisor';
COMMENT ON COLUMN profiles.created_by IS 'ID of the admin who created this user';
COMMENT ON COLUMN profiles.is_active IS 'Whether the user account is active';
COMMENT ON FUNCTION get_user_role() IS 'Returns the role of the current authenticated user';
COMMENT ON FUNCTION is_admin() IS 'Returns true if current user is an admin';
