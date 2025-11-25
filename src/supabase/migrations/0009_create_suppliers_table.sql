-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  tax_id TEXT, -- RUC or ID
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read suppliers" ON suppliers FOR SELECT USING (true);
CREATE POLICY "Staff can manage suppliers" ON suppliers FOR ALL USING (auth.role() = 'authenticated');

-- Add supplier_id to inventory_movements (optional link, keeping text supplier for historical safety if needed, but ID is better)
ALTER TABLE inventory_movements
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);
