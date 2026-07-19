INSERT INTO users (uuid, username, email, password, full_name, phone, active) VALUES
('u0000005-e29b-41d4-a716-417757b01985', 'waiter1', 'waiter1@restaurant360.com', '$2a$10$pvCJH4E.l8j/mWgqiRkdQepi7HgDhN2gWx5LA4dxZ8J39axrCd4em', 'David Waiter', '+915555555555', true);

INSERT INTO user_roles (user_id, role_id) VALUES
((SELECT id FROM users WHERE username = 'waiter1'), (SELECT id FROM roles WHERE name = 'WAITER'));
