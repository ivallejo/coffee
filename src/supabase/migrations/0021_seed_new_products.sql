-- Clean up existing data to ensure clean slate
TRUNCATE TABLE order_items, orders, inventory_movements, product_ingredients, variants, products, categories CASCADE;

-- Insert Categories
INSERT INTO categories (name, slug) VALUES
('ADICIONALES', 'adicionales'),
('BATIDOS', 'batidos'),
('BEBIDAS CALIENTES', 'bebidas-calientes'),
('BEBIDAS FRIAS', 'bebidas-frias'),
('EXTRAS', 'extras'),
('JUGOS NATURALES', 'jugos-naturales'),
('OTROS', 'otros'),
('PARA COMER', 'para-comer'),
('POSTRES', 'postres'),
('PROMOCION', 'promocion'),
('SANDWICHES', 'sandwiches'),
('SNACKS FIT', 'snacks-fit');

-- Insert Products and Initial Stock
DO $$
DECLARE
    product_data jsonb := '[
        {"name": "ARROZ PORCION", "price": 3, "category": "ADICIONALES", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560808.jpg"},
        {"name": "CAMOTE PORCION", "price": 1.5, "category": "ADICIONALES", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560809.jpg"},
        {"name": "HUEVO SANCOCHADO", "price": 1.5, "category": "ADICIONALES", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560811.jpg"},
        {"name": "LECHE DE COCO", "price": 3, "category": "ADICIONALES", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560789.jpg"},
        {"name": "BATIDO PROTEICO", "price": 9, "category": "BATIDOS", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560786.jpg"},
        {"name": "CAFE CON LECHE", "price": 5, "category": "BEBIDAS CALIENTES", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560801.jpg"},
        {"name": "INFUSIÓNES", "price": 2, "category": "BEBIDAS CALIENTES", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560802.jpg"},
        {"name": "TAZA CAFE", "price": 3, "category": "BEBIDAS CALIENTES", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560800.jpg"},
        {"name": "TE VERDE", "price": 3, "category": "BEBIDAS CALIENTES", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560803.jpg"},
        {"name": "AGUA 1 LITRO", "price": 3, "category": "BEBIDAS FRIAS", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560817.jpg"},
        {"name": "AGUA CIELO 500ML", "price": 2, "category": "BEBIDAS FRIAS", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560819.jpg"},
        {"name": "GATORADE", "price": 3, "category": "BEBIDAS FRIAS", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560820.jpg"},
        {"name": "SPORADE", "price": 2.5, "category": "BEBIDAS FRIAS", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560818.jpg"},
        {"name": "VOLT 300ML", "price": 2.5, "category": "BEBIDAS FRIAS", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560821.jpg"},
        {"name": "LECHE ALMENDRAS", "price": 3, "category": "EXTRAS", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560790.jpg"},
        {"name": "LECHE SIN LACTOSA", "price": 3, "category": "EXTRAS", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560791.jpg"},
        {"name": "SCOOP PROTEINA", "price": 4, "category": "EXTRAS", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560788.jpg"},
        {"name": "JUGO DE FRESA", "price": 8, "category": "JUGOS NATURALES", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560783.jpg"},
        {"name": "JUGO DE PAPAYA", "price": 8, "category": "JUGOS NATURALES", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560775.jpg"},
        {"name": "JUGO DE PIÑA", "price": 8, "category": "JUGOS NATURALES", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560776.jpg"},
        {"name": "JUGO ESPECIAL", "price": 10, "category": "JUGOS NATURALES", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560785.jpg"},
        {"name": "JUGO SURTIDO", "price": 9.5, "category": "JUGOS NATURALES", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560784.jpg"},
        {"name": "JUGO VERDE DETOX", "price": 8.5, "category": "JUGOS NATURALES", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560787.jpg"},
        {"name": "ENSALADA DE ATUN", "price": 12, "category": "PARA COMER", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560778.jpg"},
        {"name": "FILETE POLLO", "price": 13.5, "category": "PARA COMER", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560805.jpg"},
        {"name": "HUEVOS REVUELTOS", "price": 6, "category": "PARA COMER", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560780.jpg"},
        {"name": "OMELET", "price": 8, "category": "PARA COMER", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560777.jpg"},
        {"name": "PECHUGA AL PESTO FIT", "price": 15, "category": "PARA COMER", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560941.jpg"},
        {"name": "WRAP DE POLLO", "price": 10, "category": "PARA COMER", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560779.jpg"},
        {"name": "AVENA FIT", "price": 10, "category": "POSTRES", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560794.jpg"},
        {"name": "ENSALADA DE FRUTAS", "price": 10, "category": "POSTRES", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560795.jpg"},
        {"name": "FRUTA PICADA 1 SABOR", "price": 5, "category": "POSTRES", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560804.jpg"},
        {"name": "FRUTA PICADA 2 SABOR", "price": 7.5, "category": "POSTRES", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560813.jpg"},
        {"name": "GELATINA", "price": 2, "category": "POSTRES", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560947.jpg"},
        {"name": "PANQUEQUES DE AVENA", "price": 8.5, "category": "POSTRES", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560796.jpg"},
        {"name": "TOSTADAS FRANCESAS", "price": 7, "category": "POSTRES", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560797.jpg"},
        {"name": "WAFFLES PROTEICO", "price": 10.5, "category": "POSTRES", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560940.jpg"},
        {"name": "PROMO FILETE", "price": 15.5, "category": "PROMOCION", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560827.jpg"},
        {"name": "PROMO POST ENTRENO", "price": 13, "category": "PROMOCION", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560945.jpg"},
        {"name": "PROMO PROTEICA", "price": 13.5, "category": "PROMOCION", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560814.jpg"},
        {"name": "PROMO PROTEICA Y JUG", "price": 9.5, "category": "PROMOCION", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560815.jpg"},
        {"name": "MIXTO FIT", "price": 6.5, "category": "SANDWICHES", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560782.jpg"},
        {"name": "PALTA POWER", "price": 10, "category": "SANDWICHES", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560937.jpg"},
        {"name": "SANDWISH PROTEICO", "price": 7.5, "category": "SANDWICHES", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560781.jpg"},
        {"name": "TRIPLEFIT", "price": 10, "category": "SANDWICHES", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560938.jpg"},
        {"name": "GALLETAS DE AVENA", "price": 3, "category": "SNACKS FIT", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560824.jpg"},
        {"name": "GALLETON", "price": 3, "category": "SNACKS FIT", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560823.jpg"},
        {"name": "KEKE DE AVENA", "price": 3, "category": "SNACKS FIT", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560798.jpg"},
        {"name": "MINI COOKIES", "price": 3, "category": "SNACKS FIT", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560831.jpg"},
        {"name": "PALITOS", "price": 2, "category": "SNACKS FIT", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560816.jpg"},
        {"name": "PARFAIT GRANDE", "price": 10, "category": "SNACKS FIT", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560792.jpg"},
        {"name": "PARFAIT MEDIANO", "price": 6, "category": "SNACKS FIT", "image": "http://sistema.lifefitnessgym.pe/fotos/1producto97560793.jpg"}
    ]';
    p jsonb;
    cat_id uuid;
    prod_id uuid;
BEGIN
    FOR p IN SELECT * FROM jsonb_array_elements(product_data)
    LOOP
        -- Find category ID
        SELECT id INTO cat_id FROM categories WHERE name = p->>'category';
        
        IF cat_id IS NOT NULL THEN
            -- Insert Product
            INSERT INTO products (category_id, name, base_price, image_url, stock, cost_price)
            VALUES (cat_id, p->>'name', (p->>'price')::numeric, p->>'image', 0, 0)
            RETURNING id INTO prod_id;
            
            -- Insert Initial Stock Movement (Trigger will update product stock to 100)
            INSERT INTO inventory_movements (product_id, type, quantity, reason, notes)
            VALUES (prod_id, 'IN', 100, 'Initial Stock', 'Migration Seed');
        END IF;
    END LOOP;
END $$;
