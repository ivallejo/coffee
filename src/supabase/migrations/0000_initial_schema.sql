-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ENUMS
create type user_role as enum ('admin', 'cashier');
create type order_status as enum ('pending', 'completed', 'cancelled');
create type payment_method as enum ('cash', 'card', 'qr');

-- PROFILES (Users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role user_role default 'cashier',
  created_at timestamptz default now()
);

-- CATEGORIES
create table categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  image_url text, 
  sort_order int default 0,
  created_at timestamptz default now()
);

-- PRODUCTS
create table products (
  id uuid default uuid_generate_v4() primary key,
  category_id uuid references categories(id),
  name text not null,
  description text,
  image_url text,
  base_price decimal(10,2) not null,
  is_available boolean default true,
  created_at timestamptz default now()
);

-- VARIANTS (Sizes)
create table variants (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references products(id) on delete cascade,
  name text not null, -- e.g., "Small", "Large"
  price_adjustment decimal(10,2) default 0,
  created_at timestamptz default now()
);

-- MODIFIERS (Add-ons)
create table modifiers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  price decimal(10,2) not null,
  category_id uuid references categories(id), -- Optional: link modifier to category
  is_available boolean default true,
  created_at timestamptz default now()
);

-- INGREDIENTS (Inventory)
create table ingredients (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  unit text not null, -- e.g., "ml", "g", "count"
  current_stock decimal(10,2) default 0,
  low_stock_threshold decimal(10,2) default 10,
  cost_per_unit decimal(10,4),
  updated_at timestamptz default now()
);

-- RECIPES (Product -> Ingredients)
create table product_ingredients (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references products(id) on delete cascade,
  variant_id uuid references variants(id) on delete cascade, -- Optional: specific to size
  ingredient_id uuid references ingredients(id) on delete cascade,
  quantity decimal(10,2) not null,
  created_at timestamptz default now()
);

-- SHIFTS (Z-Report)
create table shifts (
  id uuid default uuid_generate_v4() primary key,
  cashier_id uuid references profiles(id),
  start_time timestamptz default now(),
  end_time timestamptz,
  start_cash decimal(10,2) default 0,
  end_cash decimal(10,2),
  expected_cash decimal(10,2),
  notes text
);

-- ORDERS
create table orders (
  id uuid default uuid_generate_v4() primary key,
  shift_id uuid references shifts(id),
  cashier_id uuid references profiles(id),
  customer_phone text, -- For loyalty
  total_amount decimal(10,2) not null,
  subtotal decimal(10,2) not null,
  tax decimal(10,2) default 0,
  payment_method payment_method not null,
  amount_paid decimal(10,2),
  change_returned decimal(10,2),
  status order_status default 'completed',
  created_at timestamptz default now()
);

-- ORDER ITEMS
create table order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  variant_id uuid references variants(id),
  product_name text not null,
  variant_name text,
  quantity int default 1,
  unit_price decimal(10,2) not null,
  total_price decimal(10,2) not null,
  modifiers jsonb -- Store modifiers as JSON snapshot: [{name: "Soy Milk", price: 0.5}]
);

-- LOYALTY
create table loyalty_cards (
  phone text primary key,
  points int default 0,
  total_visits int default 0,
  last_visit timestamptz default now()
);

-- RLS POLICIES
alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table variants enable row level security;
alter table modifiers enable row level security;
alter table ingredients enable row level security;
alter table product_ingredients enable row level security;
alter table shifts enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table loyalty_cards enable row level security;

-- Public read access for catalog
create policy "Public read categories" on categories for select using (true);
create policy "Public read products" on products for select using (true);
create policy "Public read variants" on variants for select using (true);
create policy "Public read modifiers" on modifiers for select using (true);

-- Authenticated access for operations
create policy "Staff can view all" on profiles for select using (auth.role() = 'authenticated');
create policy "Staff can insert orders" on orders for insert with check (auth.role() = 'authenticated');
create policy "Staff can view orders" on orders for select using (auth.role() = 'authenticated');
create policy "Staff can insert order items" on order_items for insert with check (auth.role() = 'authenticated');
create policy "Staff can view order items" on order_items for select using (auth.role() = 'authenticated');
create policy "Staff can update inventory" on ingredients for all using (auth.role() = 'authenticated');
create policy "Staff can manage shifts" on shifts for all using (auth.role() = 'authenticated');
create policy "Staff can manage loyalty" on loyalty_cards for all using (auth.role() = 'authenticated');

-- FUNCTIONS & TRIGGERS

-- Handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'cashier');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Deduct inventory on order
create or replace function deduct_inventory()
returns trigger as $$
declare
  item record;
  ing record;
begin
  -- Loop through ingredients for the product
  for ing in 
    select ingredient_id, quantity 
    from product_ingredients 
    where product_id = new.product_id 
    and (variant_id is null or variant_id = new.variant_id)
  loop
    update ingredients
    set current_stock = current_stock - (ing.quantity * new.quantity)
    where id = ing.ingredient_id;
  end loop;
  return new;
end;
$$ language plpgsql;

create trigger on_order_item_created
  after insert on order_items
  for each row execute procedure deduct_inventory();

-- Update Loyalty Points
create or replace function update_loyalty()
returns trigger as $$
begin
  if new.customer_phone is not null then
    insert into loyalty_cards (phone, points, total_visits, last_visit)
    values (new.customer_phone, 1, 1, now())
    on conflict (phone) do update
    set points = loyalty_cards.points + 1,
        total_visits = loyalty_cards.total_visits + 1,
        last_visit = now();
  end if;
  return new;
end;
$$ language plpgsql;

create trigger on_order_created
  after insert on orders
  for each row execute procedure update_loyalty();
