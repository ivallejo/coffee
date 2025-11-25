const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:AiAssistant2024!Secure@db.xiiiqyixkpfkxpfhtqhb.supabase.co:5432/postgres';

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function diagnose() {
    try {
        await client.connect();
        console.log('✅ Conectado a la base de datos\n');

        // 1. Verificar categorías
        console.log('📋 CATEGORÍAS EXISTENTES:');
        const { rows: categories } = await client.query(`
      SELECT id, name FROM categories ORDER BY name;
    `);
        categories.forEach(cat => console.log(`  - ${cat.name} (ID: ${cat.id})`));

        // 2. Verificar productos de bebidas
        console.log('\n☕ PRODUCTOS EN "BEBIDAS CALIENTES":');
        const { rows: hotDrinks } = await client.query(`
      SELECT p.name, c.name as category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE c.name = 'Bebidas Calientes';
    `);

        if (hotDrinks.length === 0) {
            console.log('  ⚠️  NO HAY PRODUCTOS en la categoría "Bebidas Calientes"');
        } else {
            hotDrinks.forEach(p => console.log(`  - ${p.name}`));
        }

        // 3. Verificar última orden
        console.log('\n📦 ÚLTIMA ORDEN REGISTRADA:');
        const { rows: lastOrder } = await client.query(`
      SELECT 
        o.id,
        o.customer_id,
        c.full_name,
        o.created_at,
        (SELECT COUNT(*) FROM order_items oi 
         JOIN products p ON oi.product_id = p.id 
         JOIN categories cat ON p.category_id = cat.id 
         WHERE oi.order_id = o.id AND cat.name = 'Bebidas Calientes') as hot_drinks_count
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
      LIMIT 1;
    `);

        if (lastOrder.length > 0) {
            const order = lastOrder[0];
            console.log(`  ID: ${order.id}`);
            console.log(`  Cliente: ${order.full_name || 'Sin cliente'}`);
            console.log(`  Fecha: ${order.created_at}`);
            console.log(`  Bebidas Calientes en la orden: ${order.hot_drinks_count}`);
        }

        // 4. Verificar loyalty_cards
        console.log('\n⭐ TARJETAS DE FIDELIDAD:');
        const { rows: loyaltyCards } = await client.query(`
      SELECT 
        lc.customer_id,
        c.full_name,
        lc.points,
        lc.total_visits
      FROM loyalty_cards lc
      JOIN customers c ON lc.customer_id = c.id
      ORDER BY lc.points DESC;
    `);

        if (loyaltyCards.length === 0) {
            console.log('  ⚠️  NO HAY TARJETAS DE FIDELIDAD registradas');
        } else {
            loyaltyCards.forEach(lc => {
                console.log(`  - ${lc.full_name}: ${lc.points} puntos, ${lc.total_visits} visitas`);
            });
        }

        // 5. Verificar trigger
        console.log('\n🔧 VERIFICAR TRIGGER:');
        const { rows: triggerCheck } = await client.query(`
      SELECT tgname, tgenabled 
      FROM pg_trigger 
      WHERE tgname LIKE '%loyalty%';
    `);

        if (triggerCheck.length === 0) {
            console.log('  ❌ NO SE ENCONTRÓ EL TRIGGER de loyalty');
        } else {
            triggerCheck.forEach(t => {
                console.log(`  - ${t.tgname}: ${t.tgenabled === 'O' ? '✅ ACTIVO' : '❌ DESACTIVADO'}`);
            });
        }

    } catch (err) {
        console.error('❌ ERROR:', err.message);
    } finally {
        await client.end();
    }
}

diagnose();
