-- Add fields for purchase tracking
ALTER TABLE inventory_movements
ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS supplier TEXT,
ADD COLUMN IF NOT EXISTS reference_number TEXT; -- Invoice/Bill number

-- Update the view policy if needed (usually selects * so it's fine)
