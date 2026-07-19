-- Seed Roles
INSERT INTO roles (name, description) VALUES 
('OWNER', 'Owner dashboard and analytics access'),
('ADMIN', 'Super administrator with all permissions'),
('CASHIER', 'POS billing and shift management'),
('KITCHEN', 'Kitchen Order Ticket viewing and processing'),
('WAITER', 'Order creation and KOT sending');

-- Seed Permissions
INSERT INTO permissions (name, description) VALUES
('READ_MENU', 'View menu categories, items, variants, and addons'),
('WRITE_MENU', 'Create, update, and delete menu components'),
('CREATE_ORDER', 'Place new orders and generate KOTs'),
('CANCEL_ORDER', 'Void orders, process refunds, and apply discounts'),
('KITCHEN_VIEW', 'View and update KOT ticket statuses'),
('VIEW_REPORTS', 'Access real-time sales, tax, and inventory reports'),
('MANAGE_INVENTORY', 'Modify ingredients, vendors, and record purchase entries');

-- Map Permissions to Roles
-- Admin gets all
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'ADMIN';

-- Owner gets Reports and Menu Read
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'OWNER' AND p.name IN ('READ_MENU', 'VIEW_REPORTS');

-- Cashier gets Menu Read, Order Creation, Cancel Order
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'CASHIER' AND p.name IN ('READ_MENU', 'CREATE_ORDER', 'CANCEL_ORDER');

-- Kitchen gets Kitchen View
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'KITCHEN' AND p.name = 'KITCHEN_VIEW';

-- Waiter gets Menu Read and Order Creation
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'WAITER' AND p.name IN ('READ_MENU', 'CREATE_ORDER');

-- Seed Users
-- Password is 'password' (bcrypt hash)
INSERT INTO users (uuid, username, email, password, full_name, phone, active) VALUES
('u0000001-e29b-41d4-a716-417757b01981', 'admin', 'admin@restaurant360.com', '$2a$10$pvCJH4E.l8j/mWgqiRkdQepi7HgDhN2gWx5LA4dxZ8J39axrCd4em', 'System Administrator', '+919999999999', true),
('u0000002-e29b-41d4-a716-417757b01982', 'owner', 'owner@restaurant360.com', '$2a$10$pvCJH4E.l8j/mWgqiRkdQepi7HgDhN2gWx5LA4dxZ8J39axrCd4em', 'John Owner', '+918888888888', true),
('u0000003-e29b-41d4-a716-417757b01983', 'cashier1', 'cashier1@restaurant360.com', '$2a$10$pvCJH4E.l8j/mWgqiRkdQepi7HgDhN2gWx5LA4dxZ8J39axrCd4em', 'Alice Cashier', '+917777777777', true),
('u0000004-e29b-41d4-a716-417757b01984', 'chef1', 'chef1@restaurant360.com', '$2a$10$pvCJH4E.l8j/mWgqiRkdQepi7HgDhN2gWx5LA4dxZ8J39axrCd4em', 'Bob Headchef', '+916666666666', true);

-- Map Users to Roles
INSERT INTO user_roles (user_id, role_id) VALUES
((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM roles WHERE name = 'ADMIN')),
((SELECT id FROM users WHERE username = 'owner'), (SELECT id FROM roles WHERE name = 'OWNER')),
((SELECT id FROM users WHERE username = 'cashier1'), (SELECT id FROM roles WHERE name = 'CASHIER')),
((SELECT id FROM users WHERE username = 'chef1'), (SELECT id FROM roles WHERE name = 'KITCHEN'));

-- Seed Brand
INSERT INTO brands (uuid, name, description) VALUES
('b0000001-e29b-41d4-a716-417757b01981', 'restaurant360 Chain', 'Premier Restaurant Brand');

-- Seed Outlet
INSERT INTO outlets (uuid, brand_id, name, address, phone, gst_number, active) VALUES
('o0000001-e29b-41d4-a716-417757b01981', (SELECT id FROM brands LIMIT 1), 'restaurant360 Central Café', '123 Tech Park, Sector 5, Bangalore', '+911234567890', '29AAAAA0000A1Z5', true);

-- Seed Terminal
INSERT INTO terminals (uuid, outlet_id, name, device_identifier, active) VALUES
('t0000001-e29b-41d4-a716-417757b01981', (SELECT id FROM outlets LIMIT 1), 'Central Terminal POS', 'POS-TERM-01', true);

-- Seed Menu Categories
INSERT INTO categories (id, uuid, outlet_id, name, description, active) VALUES
(1, 'c0000001-e29b-41d4-a716-417757b01981', (SELECT id FROM outlets LIMIT 1), 'Starters', 'Appetizers and quick bites', true),
(2, 'c0000002-e29b-41d4-a716-417757b01982', (SELECT id FROM outlets LIMIT 1), 'Main Course', 'Traditional entrees and curries', true),
(3, 'c0000003-e29b-41d4-a716-417757b01983', (SELECT id FROM outlets LIMIT 1), 'Breads', 'Indian breads and rotis', true),
(4, 'c0000004-e29b-41d4-a716-417757b01984', (SELECT id FROM outlets LIMIT 1), 'Beverages', 'Cold and hot drinks', true),
(5, 'c0000005-e29b-41d4-a716-417757b01985', (SELECT id FROM outlets LIMIT 1), 'Desserts', 'Sweet treats and ice creams', true);

-- Seed Menu Items
INSERT INTO menu_items (id, uuid, category_id, name, description, sku, base_price, tax_rate, active) VALUES
(1, 'm0000001-e29b-41d4-a716-417757b01981', 1, 'Paneer Tikka', 'Spiced cottage cheese chunks grilled in tandoor', 'PNRTK-001', 280.00, 5.00, true),
(2, 'm0000002-e29b-41d4-a716-417757b01982', 1, 'Chicken 65', 'Deep fried spicy chicken chunks', 'CH65-001', 320.00, 5.00, true),
(3, 'm0000003-e29b-41d4-a716-417757b01983', 1, 'Veg Spring Roll', 'Crisp rolls stuffed with vegetables', 'VSPRL-001', 180.00, 5.00, true),
(4, 'm0000004-e29b-41d4-a716-417757b01984', 1, 'Fish Fry', 'Crispy batter fried fish fillets', 'FSHFR-001', 350.00, 5.00, true),
(5, 'm0000005-e29b-41d4-a716-417757b01985', 1, 'Mushroom Manchurian', 'Stir fried mushroom in manchurian sauce', 'MSHMN-001', 220.00, 5.00, true),
(6, 'm0000006-e29b-41d4-a716-417757b01986', 2, 'Butter Chicken', 'Chicken cooked in rich tomato butter gravy', 'BTCHK-001', 380.00, 5.00, true),
(7, 'm0000007-e29b-41d4-a716-417757b01987', 2, 'Dal Makhani', 'Slow cooked black lentils with butter and cream', 'DLMKH-001', 240.00, 5.00, true),
(8, 'm0000008-e29b-41d4-a716-417757b01988', 2, 'Paneer Butter Masala', 'Cottage cheese cubes in rich tomato gravy', 'PNBTM-001', 300.00, 5.00, true),
(9, 'm0000009-e29b-41d4-a716-417757b01989', 2, 'Chicken Biryani', 'Aromatic basmati rice cooked with spiced chicken', 'CHBRY-001', 320.00, 5.00, true),
(10, 'm0000010-e29b-41d4-a716-417757b01990', 2, 'Veg Pulao', 'Fragrant rice cooked with mixed vegetables', 'VGPL-001', 220.00, 5.00, true),
(11, 'm0000011-e29b-41d4-a716-417757b01991', 3, 'Butter Naan', 'Flatbread cooked in tandoor brushed with butter', 'BTNN-001', 50.00, 5.00, true),
(12, 'm0000012-e29b-41d4-a716-417757b01992', 3, 'Garlic Naan', 'Flatbread topped with chopped garlic and coriander', 'GRNN-001', 70.00, 5.00, true),
(13, 'm0000013-e29b-41d4-a716-417757b01993', 3, 'Tandoori Roti', 'Whole wheat flatbread cooked in tandoor', 'TDRT-001', 40.00, 5.00, true),
(14, 'm0000014-e29b-41d4-a716-417757b01994', 3, 'Laccha Paratha', 'Layered tandoori flatbread', 'LCPRT-001', 60.00, 5.00, true),
(15, 'm0000015-e29b-41d4-a716-417757b01995', 4, 'Masala Chai', 'Traditional spiced Indian milk tea', 'MSCH-001', 40.00, 12.00, true),
(16, 'm0000016-e29b-41d4-a716-417757b01996', 4, 'Cold Coffee', 'Creamy chilled milk coffee', 'CLCF-001', 120.00, 12.00, true),
(17, 'm0000017-e29b-41d4-a716-417757b01997', 4, 'Fresh Lime Soda', 'Sweet and salted lime juice with soda', 'FRLS-001', 80.00, 12.00, true),
(18, 'm0000018-e29b-41d4-a716-417757b01998', 4, 'Lassi', 'Chilled yogurt shake sweet or salted', 'LSI-001', 90.00, 12.00, true),
(19, 'm0000019-e29b-41d4-a716-417757b01999', 5, 'Gulab Jamun', 'Warm milk dumplings soaked in sugar syrup', 'GLJM-001', 100.00, 18.00, true),
(20, 'm0000020-e29b-41d4-a716-417757b01900', 5, 'Rasmalai', 'Soft paneer balls in sweetened cardamom milk', 'RSML-001', 130.00, 18.00, true),
(21, 'm0000021-e29b-41d4-a716-417757b01901', 5, 'Chocolate Brownie', 'Fudgy chocolate brownie with chocochips', 'CHBRN-001', 150.00, 18.00, true);

-- Seed Variants
INSERT INTO variants (id, uuid, menu_item_id, name, price_override, active) VALUES
(1, 'v0000001-e29b-41d4-a716-417757b01981', 9, 'Half', 180.00, true),
(2, 'v0000002-e29b-41d4-a716-417757b01982', 9, 'Full', 320.00, true);

-- Seed Addons
INSERT INTO addons (id, uuid, outlet_id, name, price, active) VALUES
(1, 'a0000001-e29b-41d4-a716-417757b01981', (SELECT id FROM outlets LIMIT 1), 'Extra Cheese', 30.00, true),
(2, 'a0000002-e29b-41d4-a716-417757b01982', (SELECT id FROM outlets LIMIT 1), 'Extra Cream', 20.00, true);

-- Seed Ingredients (Inventory)
INSERT INTO ingredients (id, uuid, outlet_id, name, sku, unit, min_stock_level, current_stock) VALUES
(1, 'i0000001-e29b-41d4-a716-417757b01981', (SELECT id FROM outlets LIMIT 1), 'Paneer', 'ING-PNR', 'KG', 5.000, 50.000),
(2, 'i0000002-e29b-41d4-a716-417757b01982', (SELECT id FROM outlets LIMIT 1), 'Chicken Raw', 'ING-CHK', 'KG', 10.000, 100.000),
(3, 'i0000003-e29b-41d4-a716-417757b01983', (SELECT id FROM outlets LIMIT 1), 'Butter', 'ING-BTR', 'KG', 2.000, 20.000),
(4, 'i0000004-e29b-41d4-a716-417757b01984', (SELECT id FROM outlets LIMIT 1), 'Basmati Rice', 'ING-RCE', 'KG', 10.000, 150.000);

-- Seed Recipes
-- Butter Chicken (ID 6) Recipe
INSERT INTO recipes (id, uuid, menu_item_id, name, description) VALUES
(1, 'r0000001-e29b-41d4-a716-417757b01981', 6, 'Butter Chicken Recipe', 'Standard assembly for Butter Chicken');

INSERT INTO recipe_items (recipe_id, ingredient_id, quantity, unit) VALUES
(1, 2, 0.250, 'KG'), -- 250g Chicken
(1, 3, 0.050, 'KG'); -- 50g Butter

-- Chicken Biryani (ID 9) - Full Variant (ID 2) Recipe
INSERT INTO recipes (id, uuid, menu_item_id, variant_id, name, description) VALUES
(2, 'r0000002-e29b-41d4-a716-417757b01982', 9, 2, 'Biryani Full Recipe', 'Recipe for Full Biryani');

INSERT INTO recipe_items (recipe_id, ingredient_id, quantity, unit) VALUES
(2, 2, 0.300, 'KG'), -- 300g Chicken
(2, 4, 0.250, 'KG'); -- 250g Rice

-- Seed Coupons
INSERT INTO coupons (uuid, code, discount_type, discount_value, min_order_amount, max_discount, start_date, end_date, active) VALUES
('c0000001-e29b-41d4-a716-417757b01981', 'WELCOME50', 'FLAT', 50.00, 200.00, 50.00, '2026-07-01 00:00:00', '2026-12-31 23:59:59', true),
('c0000002-e29b-41d4-a716-417757b01982', 'SAVE10', 'PERCENTAGE', 10.00, 100.00, 100.00, '2026-07-01 00:00:00', '2026-12-31 23:59:59', true);

-- Seed Payment Methods
INSERT INTO payment_methods (name, active) VALUES
('CASH', true),
('CARD', true),
('UPI', true),
('WALLET', true);

-- Seed Customer
INSERT INTO customers (uuid, name, phone, email, loyalty_points) VALUES
('c0000003-e29b-41d4-a716-417757b01983', 'John Doe', '+919876543210', 'johndoe@email.com', 100);

INSERT INTO loyalty_wallets (customer_id, balance_points) VALUES
((SELECT id FROM customers WHERE phone = '+919876543210'), 100);

-- Seed Shift
INSERT INTO shifts (uuid, outlet_id, terminal_id, user_id, opening_balance, status) VALUES
('s0000001-e29b-41d4-a716-417757b01981', (SELECT id FROM outlets LIMIT 1), (SELECT id FROM terminals LIMIT 1), (SELECT id FROM users WHERE username = 'cashier1'), 1000.00, 'OPEN');
