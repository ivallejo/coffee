-- Create inventory table (separate from ingredients for better stock tracking)
create table if not exists inventory (
  id uuid default uuid_generate_v4() primary key,
  ingredient_id uuid references ingredients(id) on delete cascade,
  ingredient_name text,
  current_stock decimal(10,2) default 0,
  min_stock decimal(10,2) default 10,
  max_stock decimal(10,2) default 100,
  last_updated timestamptz default now()
);

-- Enable RLS
alter table inventory enable row level security;

-- RLS Policies
create policy "Public read inventory" on inventory for select using (true);
create policy "Staff can manage inventory" on inventory for all using (auth.role() = 'authenticated');

-- Sync inventory with ingredients
insert into inventory (ingredient_id, ingredient_name, current_stock, min_stock, max_stock)
select 
  id, 
  name, 
  current_stock, 
  low_stock_threshold as min_stock,
  low_stock_threshold * 10 as max_stock
from ingredients
on conflict do nothing;
