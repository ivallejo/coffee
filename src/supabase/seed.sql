-- Categories
insert into categories (name, slug, sort_order) values
('Hot Drinks', 'hot-drinks', 1),
('Cold Drinks', 'cold-drinks', 2),
('Food', 'food', 3),
('Desserts', 'desserts', 4);

-- Products (Hot Drinks)
insert into products (category_id, name, base_price, description) 
select id, 'Espresso', 2.50, 'Rich and bold single shot' from categories where slug = 'hot-drinks';

insert into products (category_id, name, base_price, description) 
select id, 'Cappuccino', 3.50, 'Espresso with steamed milk foam' from categories where slug = 'hot-drinks';

insert into products (category_id, name, base_price, description) 
select id, 'Latte', 4.00, 'Espresso with steamed milk' from categories where slug = 'hot-drinks';

-- Products (Cold Drinks)
insert into products (category_id, name, base_price, description) 
select id, 'Iced Americano', 3.00, 'Espresso over ice and water' from categories where slug = 'cold-drinks';

insert into products (category_id, name, base_price, description) 
select id, 'Cold Brew', 4.50, 'Slow steeped cold coffee' from categories where slug = 'cold-drinks';

-- Products (Food)
insert into products (category_id, name, base_price, description) 
select id, 'Croissant', 3.00, 'Buttery flaky pastry' from categories where slug = 'food';

insert into products (category_id, name, base_price, description) 
select id, 'Bagel', 2.50, 'Toasted bagel with cream cheese' from categories where slug = 'food';

-- Variants
insert into variants (product_id, name, price_adjustment)
select id, 'Large', 1.00 from products where name = 'Latte';

insert into variants (product_id, name, price_adjustment)
select id, 'Small', -0.50 from products where name = 'Latte';

-- Modifiers
insert into modifiers (name, price) values
('Oat Milk', 0.80),
('Almond Milk', 0.80),
('Extra Shot', 1.00),
('Vanilla Syrup', 0.50),
('Caramel Syrup', 0.50);

-- Ingredients
insert into ingredients (name, unit, current_stock, cost_per_unit) values
('Coffee Beans', 'g', 5000, 0.02),
('Whole Milk', 'ml', 10000, 0.0015),
('Oat Milk', 'ml', 5000, 0.003),
('Sugar', 'g', 2000, 0.001);

-- Link Ingredients to Products (Simple example)
-- Latte uses 18g coffee + 250ml milk
insert into product_ingredients (product_id, ingredient_id, quantity)
select p.id, i.id, 18
from products p, ingredients i
where p.name = 'Latte' and i.name = 'Coffee Beans';

insert into product_ingredients (product_id, ingredient_id, quantity)
select p.id, i.id, 250
from products p, ingredients i
where p.name = 'Latte' and i.name = 'Whole Milk';
