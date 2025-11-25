-- Add cost_price to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0;

-- Update the comment to clarify
COMMENT ON COLUMN products.base_price IS 'Selling price (PVP)';
COMMENT ON COLUMN products.cost_price IS 'Cost price (Costo de compra)';
