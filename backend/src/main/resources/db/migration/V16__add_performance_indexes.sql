-- V16__add_performance_indexes.sql
-- Create indexes on foreign keys to optimize query response times and joins

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_outlets_brand_id ON outlets(brand_id);
CREATE INDEX IF NOT EXISTS idx_categories_outlet_id ON categories(outlet_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_outlet_id ON orders(outlet_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_dining_tables_floor_id ON dining_tables(floor_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_outlet_id ON ingredients(outlet_id);
