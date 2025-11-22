-- Add RLS policies for staff to manage products, categories, variants, and modifiers

-- Products management
create policy "Staff can insert products" on products for insert with check (auth.role() = 'authenticated');
create policy "Staff can update products" on products for update using (auth.role() = 'authenticated');
create policy "Staff can delete products" on products for delete using (auth.role() = 'authenticated');

-- Categories management
create policy "Staff can insert categories" on categories for insert with check (auth.role() = 'authenticated');
create policy "Staff can update categories" on categories for update using (auth.role() = 'authenticated');
create policy "Staff can delete categories" on categories for delete using (auth.role() = 'authenticated');

-- Variants management
create policy "Staff can insert variants" on variants for insert with check (auth.role() = 'authenticated');
create policy "Staff can update variants" on variants for update using (auth.role() = 'authenticated');
create policy "Staff can delete variants" on variants for delete using (auth.role() = 'authenticated');

-- Modifiers management
create policy "Staff can insert modifiers" on modifiers for insert with check (auth.role() = 'authenticated');
create policy "Staff can update modifiers" on modifiers for update using (auth.role() = 'authenticated');
create policy "Staff can delete modifiers" on modifiers for delete using (auth.role() = 'authenticated');

-- Product ingredients management
create policy "Staff can manage product ingredients" on product_ingredients for all using (auth.role() = 'authenticated');
