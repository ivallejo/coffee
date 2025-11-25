-- 1. Create Customers Table
CREATE TABLE customers (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    full_name text NOT NULL,
    doc_type text DEFAULT 'DNI', -- DNI, RUC, CE, PASAPORTE
    doc_number text UNIQUE,
    email text,
    phone text,
    address text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Add customer_id to orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id);

-- 3. Add notes to order_items
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS notes text;

-- 4. RLS Policies for Customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for customers" ON customers
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert customers" ON customers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update customers" ON customers
    FOR UPDATE USING (auth.role() = 'authenticated');
