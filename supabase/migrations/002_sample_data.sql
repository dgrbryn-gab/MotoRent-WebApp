-- Sample Data for MotoRent Dumaguete
-- Run this in Supabase SQL Editor after running the initial schema

-- =====================================================
-- SAMPLE MOTORCYCLES
-- =====================================================

INSERT INTO motorcycles (name, type, engine_capacity, transmission, year, color, fuel_capacity, price_per_day, description, image, features, availability, rating, review_count, fuel_type) VALUES
  (
    'Honda Click 125i',
    'Scooter',
    125,
    'Automatic',
    2024,
    'Red',
    4.5,
    500,
    'Perfect for city riding with excellent fuel efficiency. The Honda Click 125i is a reliable and stylish scooter ideal for both beginners and experienced riders.',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    ARRAY['LED Headlight', 'USB Charger', 'Keyless Ignition', 'Under Seat Storage'],
    'Available',
    4.8,
    156,
    'Gasoline'
  ),
  (
    'Yamaha NMAX 155',
    'Scooter',
    155,
    'Automatic',
    2024,
    'Matte Blue',
    7.1,
    700,
    'Premium scooter experience with powerful 155cc engine. Features smart key system, ABS, and comfortable riding position for long journeys.',
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800',
    ARRAY['ABS Brakes', 'Smart Key System', 'LCD Display', 'Traction Control'],
    'Available',
    4.9,
    203,
    'Gasoline'
  ),
  (
    'Suzuki Raider R150',
    'Sport',
    150,
    'Manual',
    2023,
    'Black/Red',
    12,
    600,
    'Sporty and powerful underbone motorcycle. Perfect for those who want performance and style combined with excellent fuel economy.',
    'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800',
    ARRAY['Digital Display', 'Disc Brakes Front & Rear', 'Racing Stripes', 'Sporty Exhaust'],
    'Available',
    4.7,
    128,
    'Gasoline'
  ),
  (
    'Honda Beat',
    'Scooter',
    110,
    'Automatic',
    2024,
    'White',
    4.2,
    450,
    'Economical and reliable scooter perfect for daily commuting. Lightweight and easy to handle with great fuel efficiency.',
    'https://images.unsplash.com/photo-1623637373869-e196b15c2e63?w=800',
    ARRAY['LED Lights', 'Fuel Injection', 'Combi Brake System', 'Lightweight Design'],
    'Available',
    4.6,
    142,
    'Gasoline'
  ),
  (
    'Yamaha Mio i 125',
    'Scooter',
    125,
    'Automatic',
    2024,
    'Pink',
    4.2,
    480,
    'Stylish and fun scooter with vibrant colors. Great for city riding with excellent maneuverability and fuel efficiency.',
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800',
    ARRAY['Stylish Design', 'Fuel Efficient', 'Easy Start', 'Comfortable Seat'],
    'Reserved',
    4.7,
    98,
    'Gasoline'
  ),
  (
    'Honda PCX 160',
    'Scooter',
    160,
    'Automatic',
    2024,
    'Silver',
    8.2,
    800,
    'Premium touring scooter with advanced features. Ideal for long rides with superior comfort and technology.',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    ARRAY['Smart Key', 'ABS', 'USB Port', 'Large Storage', 'LED Lights'],
    'Available',
    4.9,
    187,
    'Gasoline'
  ),
  (
    'Suzuki Skydrive',
    'Scooter',
    125,
    'Automatic',
    2023,
    'Blue',
    4.2,
    470,
    'Lightweight and nimble scooter perfect for navigating city traffic. Great fuel economy and easy maintenance.',
    'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800',
    ARRAY['Lightweight', 'Fuel Efficient', 'Easy Handling', 'Digital Meter'],
    'Available',
    4.5,
    76,
    'Gasoline'
  ),
  (
    'Kawasaki Ninja 400',
    'Sport',
    400,
    'Manual',
    2024,
    'Lime Green',
    14,
    1200,
    'High-performance sport bike for experienced riders. Powerful engine with excellent handling and aggressive styling.',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    ARRAY['ABS', 'Slipper Clutch', 'Digital Display', 'Sport Suspension', 'Dual Disc Brakes'],
    'Available',
    5.0,
    45,
    'Gasoline'
  ),
  (
    'Honda XRM 125',
    'Underbone',
    125,
    'Manual',
    2023,
    'Red/Black',
    9.2,
    550,
    'Rugged and reliable underbone motorcycle. Perfect for both city and off-road adventures with excellent durability.',
    'https://images.unsplash.com/photo-1623637373869-e196b15c2e63?w=800',
    ARRAY['Durable Frame', 'Off-road Capable', 'Fuel Efficient', 'Easy Maintenance'],
    'In Maintenance',
    4.6,
    134,
    'Gasoline'
  ),
  (
    'Yamaha Sniper 155',
    'Underbone',
    155,
    'Manual',
    2024,
    'Blue/White',
    10,
    580,
    'Powerful underbone with racing heritage. Great acceleration and top speed with sporty design.',
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800',
    ARRAY['Racing Style', 'Powerful Engine', 'Disc Brakes', 'Digital Display'],
    'Available',
    4.7,
    89,
    'Gasoline'
  ),
  (
    'Honda ADV 160',
    'Adventure Scooter',
    160,
    'Automatic',
    2024,
    'Gray',
    8.0,
    850,
    'Adventure scooter designed for versatility. Handle both city streets and rough terrain with confidence.',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    ARRAY['Adventure Style', 'High Ground Clearance', 'LED Lights', 'USB Port', 'Large Wheels'],
    'Available',
    4.8,
    112,
    'Gasoline'
  ),
  (
    'Suzuki Burgman Street',
    'Scooter',
    125,
    'Automatic',
    2024,
    'White/Blue',
    5.6,
    520,
    'Comfortable cruiser scooter with premium features. Smooth ride quality and ample storage space.',
    'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800',
    ARRAY['Comfortable Seat', 'Large Storage', 'Bluetooth Ready', 'LED Lights'],
    'Available',
    4.6,
    67,
    'Gasoline'
  );

-- =====================================================
-- SAMPLE ADMIN USERS (Already created in schema, just adding note)
-- =====================================================
-- Default admin users were created in the initial schema:
-- Email: admin@motorent.com (role: admin)
-- Email: superadmin@motorent.com (role: super-admin)

-- =====================================================
-- SAMPLE USERS (Optional - for testing)
-- =====================================================
INSERT INTO users (name, email, phone) VALUES
  ('Juan Dela Cruz', 'juan@example.com', '09171234567'),
  ('Maria Santos', 'maria@example.com', '09181234567'),
  ('Pedro Reyes', 'pedro@example.com', '09191234567')
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- COMPLETED
-- =====================================================
-- Sample data inserted successfully!
-- You should now see 12 motorcycles in your Table Editor
