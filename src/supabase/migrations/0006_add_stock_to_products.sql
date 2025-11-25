-- Add stock column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0 NOT NULL;

-- Optional: Add low stock threshold alert per product
ALTER TABLE products
ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 5;
