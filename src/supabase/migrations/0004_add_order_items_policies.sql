-- Migration: Add RLS policies for order_items to allow reading
-- This ensures that authenticated users can read order items for shift details

-- Enable RLS on order_items if not already enabled
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can read order_items" ON order_items;
DROP POLICY IF EXISTS "Authenticated users can insert order_items" ON order_items;

-- Create policies for order_items
CREATE POLICY "Authenticated users can read order_items" 
    ON order_items FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert order_items" 
    ON order_items FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- Ensure products table has proper read policy
DROP POLICY IF EXISTS "Public read products" ON products;
CREATE POLICY "Public read products" 
    ON products FOR SELECT 
    USING (true);

-- Ensure orders table has proper read policy for authenticated users
DROP POLICY IF EXISTS "Authenticated users can read orders" ON orders;
CREATE POLICY "Authenticated users can read orders" 
    ON orders FOR SELECT 
    USING (auth.role() = 'authenticated');
