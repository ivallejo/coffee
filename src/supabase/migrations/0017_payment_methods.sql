-- 1. Create Payment Methods table
create table payment_methods (
  id uuid default uuid_generate_v4() primary key,
  name text not null, -- e.g., "Efectivo", "Visa", "Yape"
  code text not null unique, -- e.g., "cash", "card_visa", "yape"
  is_active boolean default true,
  requires_reference boolean default false, -- If true, asks for operation number
  requires_details boolean default false, -- If true, asks for extra details (e.g. Credit/Debit)
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Enable RLS
alter table payment_methods enable row level security;

-- Policies
create policy "Public read payment methods" on payment_methods for select using (true);
create policy "Admins can manage payment methods" on payment_methods for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- 2. Seed default payment methods
insert into payment_methods (name, code, is_active, requires_reference, requires_details, sort_order) values
('Efectivo', 'cash', true, false, false, 10),
('Tarjeta', 'card', true, true, true, 20), -- Requires ref (op number) and details (credit/debit)
('Yape', 'yape', true, true, false, 30),
('Plin', 'plin', true, true, false, 40),
('Transferencia', 'transfer', true, true, false, 50);

-- 3. Update Orders table to support dynamic payments
-- First, we need to drop the enum constraint if we want full flexibility, 
-- or we can just cast the column to text. Let's cast to text to allow any string code.
alter table orders alter column payment_method type text;

-- Add column for extra payment details (JSONB)
-- Stores: { operation_number: "1234", card_type: "credit", etc. }
alter table orders add column payment_data jsonb default '{}'::jsonb;
