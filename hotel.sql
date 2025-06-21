-- Create Hotel Management Database
CREATE DATABASE hotel_management_db;
\c hotel_management_db;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: Hotels
CREATE TABLE hotels (
    hotel_id SERIAL PRIMARY KEY,
    hotel_name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    rating DECIMAL(2,1) CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Room Types (Inheritance concept)
CREATE TABLE room_types (
    room_type_id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL UNIQUE,
    base_price DECIMAL(10,2) NOT NULL CHECK (base_price > 0),
    max_occupancy INT NOT NULL CHECK (max_occupancy > 0),
    amenities TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Rooms
CREATE TABLE rooms (
    room_id SERIAL PRIMARY KEY,
    hotel_id INT NOT NULL,
    room_number VARCHAR(10) NOT NULL,
    room_type_id INT NOT NULL,
    floor_number INT NOT NULL CHECK (floor_number > 0),
    status VARCHAR(20) DEFAULT 'Available' CHECK (status IN ('Available', 'Occupied', 'Maintenance', 'Out of Order')),
    last_maintenance DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id) ON DELETE CASCADE,
    FOREIGN KEY (room_type_id) REFERENCES room_types(room_type_id) ON DELETE RESTRICT,
    UNIQUE(hotel_id, room_number)
);

-- Table: Guests
CREATE TABLE guests (
    guest_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15) NOT NULL,
    address VARCHAR(255),
    city VARCHAR(50),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    date_of_birth DATE,
    id_number VARCHAR(50),
    nationality VARCHAR(50),
    loyalty_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Staff (Inheritance - Different staff types)
CREATE TABLE staff (
    staff_id SERIAL PRIMARY KEY,
    hotel_id INT NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15) NOT NULL,
    position VARCHAR(50) NOT NULL,
    department VARCHAR(50) NOT NULL,
    salary DECIMAL(10,2) NOT NULL CHECK (salary > 0),
    hire_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id) ON DELETE CASCADE
);

-- Table: Reservations
CREATE TABLE reservations (
    reservation_id SERIAL PRIMARY KEY,
    guest_id INT NOT NULL,
    room_id INT NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    adults INT NOT NULL DEFAULT 1 CHECK (adults > 0),
    children INT DEFAULT 0 CHECK (children >= 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(20) DEFAULT 'Confirmed' CHECK (status IN ('Pending', 'Confirmed', 'Checked-in', 'Checked-out', 'Cancelled')),
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guest_id) REFERENCES guests(guest_id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
    CHECK (check_out_date > check_in_date)
);

-- Table: Payments
CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    reservation_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('Cash', 'Credit Card', 'Debit Card', 'Online')),
    payment_status VARCHAR(20) DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Completed', 'Failed', 'Refunded')),
    transaction_id VARCHAR(100),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reservation_id) REFERENCES reservations(reservation_id) ON DELETE CASCADE
);

-- Table: Services
CREATE TABLE services (
    service_id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    category VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Service Requests
CREATE TABLE service_requests (
    request_id SERIAL PRIMARY KEY,
    reservation_id INT NOT NULL,
    service_id INT NOT NULL,
    staff_id INT,
    quantity INT DEFAULT 1 CHECK (quantity > 0),
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completion_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
    notes TEXT,
    FOREIGN KEY (reservation_id) REFERENCES reservations(reservation_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id) ON DELETE SET NULL
);

-- Table: Maintenance Logs
CREATE TABLE maintenance_logs (
    log_id SERIAL PRIMARY KEY,
    room_id INT NOT NULL,
    staff_id INT NOT NULL,
    maintenance_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Cancelled')),
    cost DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id) ON DELETE CASCADE
);


-- Delete all data in correct order (to avoid foreign key constraints)
DELETE FROM service_requests;
DELETE FROM maintenance_logs;
DELETE FROM payments;
DELETE FROM reservations;
DELETE FROM guests;
DELETE FROM rooms;
DELETE FROM staff;
DELETE FROM services;
DELETE FROM room_types;
DELETE FROM hotels;

-- Reset all sequences to start from 1
ALTER SEQUENCE hotels_hotel_id_seq RESTART WITH 1;
ALTER SEQUENCE room_types_room_type_id_seq RESTART WITH 1;
ALTER SEQUENCE rooms_room_id_seq RESTART WITH 1;
ALTER SEQUENCE guests_guest_id_seq RESTART WITH 1;
ALTER SEQUENCE staff_staff_id_seq RESTART WITH 1;
ALTER SEQUENCE services_service_id_seq RESTART WITH 1;
ALTER SEQUENCE reservations_reservation_id_seq RESTART WITH 1;
ALTER SEQUENCE payments_payment_id_seq RESTART WITH 1;
ALTER SEQUENCE service_requests_request_id_seq RESTART WITH 1;
ALTER SEQUENCE maintenance_logs_log_id_seq RESTART WITH 1;



-- Insert Hotels
INSERT INTO hotels (hotel_name, address, city, state, zip_code, phone, email, rating) VALUES
('Grand Palace Hotel', '123 Main St', 'New York', 'NY', '10001', '555-0101', 'info@grandpalace.com', 4.5),
('Ocean View Resort', '456 Beach Ave', 'Miami', 'FL', '33101', '555-0102', 'reservations@oceanview.com', 4.2),
('Mountain Lodge Inn', '789 Pine Ridge Rd', 'Denver', 'CO', '80201', '555-0103', 'contact@mountainlodge.com', 4.0);

-- Insert Room Types
INSERT INTO room_types (type_name, base_price, max_occupancy, amenities) VALUES
('Standard', 99.99, 2, 'WiFi, TV, Air Conditioning'),
('Deluxe', 149.99, 3, 'WiFi, TV, Air Conditioning, Mini Bar'),
('Suite', 249.99, 4, 'WiFi, TV, Air Conditioning, Mini Bar, Kitchenette, Living Area'),
('Presidential', 499.99, 6, 'WiFi, TV, Air Conditioning, Mini Bar, Full Kitchen, Living Area, Jacuzzi');

-- Insert Services
INSERT INTO services (service_name, description, price, category) VALUES
('Room Service', '24/7 room service', 15.00, 'Food & Beverage'),
('Laundry', 'Laundry and dry cleaning', 25.00, 'Housekeeping'),
('Spa Treatment', 'Relaxing spa services', 80.00, 'Wellness'),
('Airport Shuttle', 'Transportation to/from airport', 30.00, 'Transportation'),
('Late Checkout', 'Checkout after 12 PM', 50.00, 'Room Service'),
('Gym Access', 'Access to fitness center', 20.00, 'Wellness'),
('Business Center', 'Printing and meeting room access', 35.00, 'Business'),
('Pet Care', 'Pet sitting and walking service', 45.00, 'Pet Services');


-- Insert Rooms for Grand Palace Hotel (Hotel ID 1) - 10 rooms
INSERT INTO rooms (hotel_id, room_number, room_type_id, floor_number) VALUES
(1, '101', 1, 1), (1, '102', 1, 1), (1, '103', 2, 1), (1, '104', 2, 1),
(1, '201', 2, 2), (1, '202', 2, 2), (1, '203', 3, 2), (1, '204', 3, 2),
(1, '301', 3, 3), (1, '302', 4, 3);

-- Insert Rooms for Ocean View Resort (Hotel ID 2) - 10 rooms
INSERT INTO rooms (hotel_id, room_number, room_type_id, floor_number) VALUES
(2, 'A101', 1, 1), (2, 'A102', 1, 1), (2, 'A103', 2, 1), (2, 'A104', 2, 1),
(2, 'B201', 2, 2), (2, 'B202', 2, 2), (2, 'B203', 3, 2), (2, 'B204', 3, 2),
(2, 'C301', 3, 3), (2, 'C302', 4, 3);

-- Insert Rooms for Mountain Lodge Inn (Hotel ID 3) - 10 rooms
INSERT INTO rooms (hotel_id, room_number, room_type_id, floor_number) VALUES
(3, 'ML101', 1, 1), (3, 'ML102', 1, 1), (3, 'ML103', 2, 1), (3, 'ML104', 2, 1),
(3, 'ML201', 2, 2), (3, 'ML202', 2, 2), (3, 'ML203', 3, 2), (3, 'ML204', 3, 2),
(3, 'ML301', 3, 3), (3, 'ML302', 4, 3);

-- Insert Staff for the hotels
INSERT INTO staff (hotel_id, first_name, last_name, email, phone, position, department, salary, hire_date) VALUES
(1, 'John', 'Smith', 'j.smith@grandpalace.com', '555-1001', 'General Manager', 'Management', 75000.00, '2023-01-15'),
(1, 'Sarah', 'Johnson', 's.johnson@grandpalace.com', '555-1002', 'Front Desk Agent', 'Guest Services', 35000.00, '2023-03-20'),
(1, 'Mike', 'Brown', 'm.brown@grandpalace.com', '555-1003', 'Housekeeper', 'Housekeeping', 30000.00, '2023-02-10'),
(1, 'Emma', 'Wilson', 'e.wilson@grandpalace.com', '555-1004', 'Maintenance Tech', 'Maintenance', 40000.00, '2023-04-05'),
(2, 'Lisa', 'Davis', 'l.davis@oceanview.com', '555-2001', 'General Manager', 'Management', 70000.00, '2023-01-20'),
(2, 'Tom', 'Wilson', 't.wilson@oceanview.com', '555-2002', 'Maintenance Supervisor', 'Maintenance', 45000.00, '2023-04-15'),
(2, 'Maria', 'Garcia', 'm.garcia@oceanview.com', '555-2003', 'Concierge', 'Guest Services', 38000.00, '2023-05-01'),
(3, 'Anna', 'Taylor', 'a.taylor@mountainlodge.com', '555-3001', 'General Manager', 'Management', 65000.00, '2023-02-01'),
(3, 'David', 'Miller', 'd.miller@mountainlodge.com', '555-3002', 'Front Desk Agent', 'Guest Services', 32000.00, '2023-05-10'),
(3, 'James', 'Anderson', 'j.anderson@mountainlodge.com', '555-3003', 'Head Housekeeper', 'Housekeeping', 42000.00, '2023-03-15');



-- Insert Guests (diverse set of customers)
INSERT INTO guests (first_name, last_name, email, phone, address, city, state, zip_code, date_of_birth, id_number, nationality) VALUES
('Robert', 'Johnson', 'robert.johnson@email.com', '555-4001', '456 Oak Street', 'New York', 'NY', '10002', '1985-03-15', 'DL123456789', 'USA'),
('Jennifer', 'Williams', 'jennifer.williams@email.com', '555-4002', '789 Pine Avenue', 'Los Angeles', 'CA', '90210', '1990-07-22', 'DL987654321', 'USA'),
('Michael', 'Brown', 'michael.brown@email.com', '555-4003', '321 Elm Street', 'Chicago', 'IL', '60601', '1988-11-08', 'DL456789123', 'USA'),
('Jessica', 'Davis', 'jessica.davis@email.com', '555-4004', '654 Maple Drive', 'Miami', 'FL', '33102', '1992-02-14', 'DL789123456', 'USA'),
('Christopher', 'Miller', 'christopher.miller@email.com', '555-4005', '987 Cedar Lane', 'Denver', 'CO', '80202', '1987-09-03', 'DL321654987', 'USA'),
('Amanda', 'Wilson', 'amanda.wilson@email.com', '555-4006', '147 Birch Road', 'Seattle', 'WA', '98101', '1995-12-18', 'DL654987321', 'USA'),
('Daniel', 'Moore', 'daniel.moore@email.com', '555-4007', '258 Spruce Street', 'Boston', 'MA', '02101', '1983-06-25', 'DL147258369', 'USA'),
('Sarah', 'Taylor', 'sarah.taylor@email.com', '555-4008', '369 Willow Avenue', 'San Francisco', 'CA', '94101', '1991-04-12', 'DL369258147', 'USA'),
('James', 'Anderson', 'james.anderson@email.com', '555-4009', '741 Poplar Drive', 'Portland', 'OR', '97201', '1989-08-30', 'DL741852963', 'USA'),
('Lisa', 'Thomas', 'lisa.thomas@email.com', '555-4010', '852 Hickory Lane', 'Austin', 'TX', '73301', '1986-01-07', 'DL852963741', 'USA');

-- Insert Reservations (mix of past, current, and future)
INSERT INTO reservations (guest_id, room_id, check_in_date, check_out_date, adults, children, total_amount, status, special_requests) VALUES
-- Past reservations (checked out)
(1, 1, '2024-01-15', '2024-01-18', 2, 0, 299.97, 'Checked-out', 'Late checkout requested'),
(2, 12, '2024-01-20', '2024-01-23', 2, 1, 449.97, 'Checked-out', 'Extra towels please'),
(3, 23, '2024-02-01', '2024-02-05', 1, 0, 399.96, 'Checked-out', NULL),

-- Current reservations (checked in)
(4, 5, '2024-06-15', '2024-06-18', 2, 0, 449.97, 'Checked-in', 'Room on higher floor preferred'),
(5, 15, '2024-06-16', '2024-06-20', 2, 2, 999.96, 'Checked-in', 'Crib needed for baby'),

-- Future reservations (confirmed)
(6, 8, '2024-07-01', '2024-07-05', 2, 0, 999.96, 'Confirmed', 'Anniversary celebration'),
(7, 18, '2024-07-10', '2024-07-14', 1, 0, 399.96, 'Confirmed', 'Business trip'),
(8, 28, '2024-07-15', '2024-07-18', 2, 1, 749.97, 'Confirmed', 'Pool access important'),
(9, 3, '2024-08-01', '2024-08-05', 2, 0, 599.96, 'Confirmed', NULL),
(10, 13, '2024-08-10', '2024-08-15', 3, 0, 749.95, 'Confirmed', 'Ground floor room please'),

-- Some cancelled reservations
(1, 21, '2024-05-01', '2024-05-03', 2, 0, 199.98, 'Cancelled', 'Change of plans'),
(3, 7, '2024-06-01', '2024-06-04', 1, 0, 749.97, 'Cancelled', 'Work emergency');



-- Insert Payments (for completed and checked-out reservations)
INSERT INTO payments (reservation_id, amount, payment_method, payment_status, transaction_id, payment_date) VALUES
-- Payments for checked-out reservations
(1, 299.97, 'Credit Card', 'Completed', 'TXN001234567', '2024-01-15 14:30:00'),
(2, 449.97, 'Credit Card', 'Completed', 'TXN001234568', '2024-01-20 16:45:00'),
(3, 399.96, 'Cash', 'Completed', NULL, '2024-02-01 12:15:00'),

-- Payments for current reservations (checked-in)
(4, 449.97, 'Debit Card', 'Completed', 'TXN001234569', '2024-06-15 11:20:00'),
(5, 999.96, 'Credit Card', 'Completed', 'TXN001234570', '2024-06-16 13:45:00'),

-- Payments for future reservations (deposits)
(6, 299.97, 'Online', 'Completed', 'TXN001234571', '2024-06-10 09:30:00'), -- Partial payment
(7, 399.96, 'Credit Card', 'Completed', 'TXN001234572', '2024-06-12 15:20:00'),
(8, 374.99, 'Credit Card', 'Completed', 'TXN001234573', '2024-06-14 10:15:00'), -- 50% deposit

-- Failed payment example
(9, 599.96, 'Credit Card', 'Failed', 'TXN001234574', '2024-06-18 14:22:00'),
-- Retry payment for the same reservation
(9, 599.96, 'Debit Card', 'Completed', 'TXN001234575', '2024-06-18 16:30:00');

-- Insert Service Requests (demonstrating various services)
INSERT INTO service_requests (reservation_id, service_id, staff_id, quantity, request_date, completion_date, status, notes) VALUES
-- Completed service requests
(1, 1, 2, 1, '2024-01-16 19:30:00', '2024-01-16 20:15:00', 'Completed', 'Room service delivered - dinner for 2'),
(2, 2, 3, 1, '2024-01-21 08:00:00', '2024-01-21 14:30:00', 'Completed', 'Laundry picked up and delivered'),
(3, 3, 7, 1, '2024-02-02 15:00:00', '2024-02-02 17:30:00', 'Completed', 'Spa treatment completed'),

-- Current service requests (in progress)
(4, 1, 2, 2, '2024-06-17 18:45:00', NULL, 'In Progress', 'Room service - anniversary dinner'),
(5, 6, 9, 4, '2024-06-17 07:00:00', NULL, 'In Progress', 'Gym access for family'),

-- Pending service requests
(6, 4, 6, 2, '2024-06-18 10:30:00', NULL, 'Pending', 'Airport shuttle for 2 guests'),
(7, 5, 2, 1, '2024-06-18 14:15:00', NULL, 'Pending', 'Late checkout requested'),

-- Cancelled service request
(8, 7, 9, 1, '2024-06-17 11:00:00', NULL, 'Cancelled', 'Business center - guest cancelled');

-- Insert some Maintenance Logs
INSERT INTO maintenance_logs (room_id, staff_id, maintenance_type, description, start_date, end_date, status, cost) VALUES
(1, 4, 'Routine Cleaning', 'Deep cleaning after checkout', '2024-01-18 11:00:00', '2024-01-18 14:00:00', 'Completed', 0.00),
(12, 6, 'Repair', 'Fix leaky faucet in bathroom', '2024-01-24 09:00:00', '2024-01-24 11:30:00', 'Completed', 85.50),
(23, 10, 'Routine Cleaning', 'Post-checkout cleaning and inspection', '2024-02-05 10:00:00', '2024-02-05 13:00:00', 'Completed', 0.00),
(7, 4, 'Preventive', 'HVAC system maintenance', '2024-06-01 08:00:00', '2024-06-01 16:00:00', 'Completed', 250.00),
(15, 6, 'Scheduled', 'Replace air filters', '2024-06-18 09:00:00', NULL, 'In Progress', 45.00);




-- Function 1: Calculate Total Revenue for a Date Range
CREATE OR REPLACE FUNCTION calculate_revenue(start_date DATE, end_date DATE)
RETURNS DECIMAL(12,2) AS $$
DECLARE
    total_revenue DECIMAL(12,2);
BEGIN
    SELECT COALESCE(SUM(total_amount), 0)
    INTO total_revenue
    FROM reservations
    WHERE check_in_date >= start_date
    AND check_in_date <= end_date
    AND status IN ('Confirmed', 'Checked-in', 'Checked-out');

    RETURN total_revenue;
END;
$$ LANGUAGE plpgsql;

-- Function 2: Get Available Rooms for Date Range
CREATE OR REPLACE FUNCTION get_available_rooms(check_in DATE, check_out DATE, hotel_id_param INT DEFAULT NULL)
RETURNS TABLE(room_id INT, room_number VARCHAR, type_name VARCHAR, base_price DECIMAL) AS $$
BEGIN
    RETURN QUERY
    SELECT r.room_id, r.room_number, rt.type_name, rt.base_price
    FROM rooms r
    JOIN room_types rt ON r.room_type_id = rt.room_type_id
    WHERE r.status = 'Available'
    AND (hotel_id_param IS NULL OR r.hotel_id = hotel_id_param)
    AND r.room_id NOT IN (
        SELECT res.room_id
        FROM reservations res
        WHERE res.status IN ('Confirmed', 'Checked-in')
        AND NOT (res.check_out_date <= check_in OR res.check_in_date >= check_out)
    );
END;
$$ LANGUAGE plpgsql;

-- Function 3: Calculate Guest Loyalty Points
CREATE OR REPLACE FUNCTION calculate_loyalty_points(guest_id_param INT)
RETURNS INT AS $$
DECLARE
    total_points INT;
    total_spent DECIMAL(12,2);
BEGIN
    SELECT COALESCE(SUM(total_amount), 0)
    INTO total_spent
    FROM reservations
    WHERE guest_id = guest_id_param
    AND status = 'Checked-out';

    total_points := FLOOR(total_spent / 10); -- 1 point per $10 spent

    UPDATE guests
    SET loyalty_points = total_points
    WHERE guest_id = guest_id_param;

    RETURN total_points;
END;
$$ LANGUAGE plpgsql;

-- Function 4: Get Room Occupancy Rate
CREATE OR REPLACE FUNCTION get_occupancy_rate(hotel_id_param INT, date_param DATE)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_rooms INT;
    occupied_rooms INT;
    occupancy_rate DECIMAL(5,2);
BEGIN
    SELECT COUNT(*) INTO total_rooms
    FROM rooms
    WHERE hotel_id = hotel_id_param AND status != 'Out of Order';

    SELECT COUNT(*) INTO occupied_rooms
    FROM rooms r
    JOIN reservations res ON r.room_id = res.room_id
    WHERE r.hotel_id = hotel_id_param
    AND res.check_in_date <= date_param
    AND res.check_out_date > date_param
    AND res.status IN ('Confirmed', 'Checked-in');

    IF total_rooms > 0 THEN
        occupancy_rate := (occupied_rooms::DECIMAL / total_rooms) * 100;
    ELSE
        occupancy_rate := 0;
    END IF;

    RETURN occupancy_rate;
END;
$$ LANGUAGE plpgsql;

-- Function 5: Auto-assign Staff to Service Request
CREATE OR REPLACE FUNCTION assign_staff_to_service(request_id_param INT)
RETURNS INT AS $$
DECLARE
    assigned_staff_id INT;
    service_category VARCHAR(50);
BEGIN
    -- Get service category
    SELECT s.category INTO service_category
    FROM service_requests sr
    JOIN services s ON sr.service_id = s.service_id
    WHERE sr.request_id = request_id_param;

    -- Find available staff based on category
    SELECT staff_id INTO assigned_staff_id
    FROM staff
    WHERE is_active = TRUE
    AND CASE
        WHEN service_category = 'Housekeeping' THEN department = 'Housekeeping'
        WHEN service_category = 'Food & Beverage' THEN department = 'Food & Beverage'
        WHEN service_category = 'Maintenance' THEN department = 'Maintenance'
        ELSE department = 'Guest Services'
    END
    ORDER BY RANDOM()
    LIMIT 1;

    -- Update service request with assigned staff
    UPDATE service_requests
    SET staff_id = assigned_staff_id
    WHERE request_id = request_id_param;

    RETURN assigned_staff_id;
END;
$$ LANGUAGE plpgsql;



--TRIGGERSSS-------
-- Trigger 1: Update room status when reservation is made
CREATE OR REPLACE FUNCTION update_room_status_on_reservation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Checked-in' THEN
        UPDATE rooms SET status = 'Occupied' WHERE room_id = NEW.room_id;
    ELSIF NEW.status = 'Checked-out' THEN
        UPDATE rooms SET status = 'Available' WHERE room_id = NEW.room_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reservation_room_status_trigger
    AFTER UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_room_status_on_reservation();

-- Trigger 2: Calculate loyalty points after checkout
CREATE OR REPLACE FUNCTION update_loyalty_points_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Checked-out' AND OLD.status != 'Checked-out' THEN
        PERFORM calculate_loyalty_points(NEW.guest_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER loyalty_points_trigger
    AFTER UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_loyalty_points_trigger();

-- Trigger 3: Prevent double booking
CREATE OR REPLACE FUNCTION prevent_double_booking()
RETURNS TRIGGER AS $$
DECLARE
    conflict_count INT;
BEGIN
    SELECT COUNT(*) INTO conflict_count
    FROM reservations
    WHERE room_id = NEW.room_id
    AND status IN ('Confirmed', 'Checked-in')
    AND NOT (check_out_date <= NEW.check_in_date OR check_in_date >= NEW.check_out_date)
    AND (TG_OP = 'INSERT' OR reservation_id != NEW.reservation_id);

    IF conflict_count > 0 THEN
        RAISE EXCEPTION 'Room is already booked for the selected dates';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_double_booking_trigger
    BEFORE INSERT OR UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION prevent_double_booking();

-- Trigger 4: Auto-assign staff to new service requests
CREATE OR REPLACE FUNCTION auto_assign_staff_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.staff_id IS NULL THEN
        NEW.staff_id := assign_staff_to_service(NEW.request_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_assign_staff_trigger
    BEFORE INSERT ON service_requests
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_staff_trigger();

-- Trigger 5: Log room maintenance
CREATE OR REPLACE FUNCTION log_room_maintenance_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Maintenance' AND OLD.status != 'Maintenance' THEN
        INSERT INTO maintenance_logs (room_id, staff_id, maintenance_type, description, status)
        VALUES (NEW.room_id, 1, 'Routine', 'Room set to maintenance status', 'Scheduled');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER room_maintenance_trigger
    AFTER UPDATE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION log_room_maintenance_trigger();



-- View 1: Guest Reservation Summary
CREATE VIEW guest_reservation_summary AS
SELECT
    g.guest_id,
    g.first_name || ' ' || g.last_name AS guest_name,
    g.email,
    COUNT(r.reservation_id) AS total_reservations,
    SUM(r.total_amount) AS total_spent,
    g.loyalty_points,
    MAX(r.check_out_date) AS last_visit
FROM guests g
LEFT JOIN reservations r ON g.guest_id = r.guest_id
GROUP BY g.guest_id, g.first_name, g.last_name, g.email, g.loyalty_points;

-- View 2: Room Availability Status
CREATE VIEW room_availability AS
SELECT
    h.hotel_name,
    rm.room_number,
    rt.type_name,
    rt.base_price,
    rm.status,
    rm.floor_number,
    CASE
        WHEN rm.status = 'Occupied' THEN
            (SELECT r.check_out_date FROM reservations r
             WHERE r.room_id = rm.room_id AND r.status = 'Checked-in'
             LIMIT 1)
        ELSE NULL
    END AS available_from
FROM rooms rm
JOIN hotels h ON rm.hotel_id = h.hotel_id
JOIN room_types rt ON rm.room_type_id = rt.room_type_id;

-- View 3: Daily Revenue Report
CREATE VIEW daily_revenue AS
SELECT
    DATE(r.check_in_date) AS revenue_date,
    h.hotel_name,
    COUNT(r.reservation_id) AS total_bookings,
    SUM(r.total_amount) AS daily_revenue,
    AVG(r.total_amount) AS avg_booking_value
FROM reservations r
JOIN rooms rm ON r.room_id = rm.room_id
JOIN hotels h ON rm.hotel_id = h.hotel_id
WHERE r.status IN ('Confirmed', 'Checked-in', 'Checked-out')
GROUP BY DATE(r.check_in_date), h.hotel_name
ORDER BY revenue_date DESC;

-- View 4: Staff Workload
CREATE VIEW staff_workload AS
SELECT
    s.staff_id,
    s.first_name || ' ' || s.last_name AS staff_name,
    s.department,
    COUNT(sr.request_id) AS active_requests,
    COUNT(ml.log_id) AS maintenance_tasks
FROM staff s
LEFT JOIN service_requests sr ON s.staff_id = sr.staff_id
    AND sr.status IN ('Pending', 'In Progress')
LEFT JOIN maintenance_logs ml ON s.staff_id = ml.staff_id
    AND ml.status IN ('Scheduled', 'In Progress')
WHERE s.is_active = TRUE
GROUP BY s.staff_id, s.first_name, s.last_name, s.department;

-- View 5: Service Performance
CREATE VIEW service_performance AS
SELECT
    s.service_name,
    s.category,
    COUNT(sr.request_id) AS total_requests,
    AVG(EXTRACT(EPOCH FROM (sr.completion_date - sr.request_date))/3600) AS avg_completion_hours,
    SUM(s.price * sr.quantity) AS total_revenue
FROM services s
LEFT JOIN service_requests sr ON s.service_id = sr.service_id
WHERE sr.status = 'Completed'
GROUP BY s.service_id, s.service_name, s.category;





-- =====================================
-- DATABASE ROLES AND PRIVILEGES
-- =====================================

-- Create different user roles for the hotel management system

-- 1. Hotel Manager Role (Full Access)
CREATE ROLE hotel_manager;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hotel_manager;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hotel_manager;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO hotel_manager;

-- 2. Front Desk Agent Role (Guest and Reservation Management)
CREATE ROLE front_desk_agent;
GRANT SELECT, INSERT, UPDATE ON guests TO front_desk_agent;
GRANT SELECT, INSERT, UPDATE ON reservations TO front_desk_agent;
GRANT SELECT ON rooms TO front_desk_agent;
GRANT SELECT ON room_types TO front_desk_agent;
GRANT SELECT ON hotels TO front_desk_agent;
GRANT SELECT, INSERT ON payments TO front_desk_agent;
GRANT SELECT ON guest_reservation_summary TO front_desk_agent;
GRANT SELECT ON room_availability TO front_desk_agent;

-- 3. Housekeeping Role (Room and Maintenance Management)
CREATE ROLE housekeeping_staff;
GRANT SELECT ON rooms TO housekeeping_staff;
GRANT UPDATE (status) ON rooms TO housekeeping_staff;
GRANT SELECT, INSERT, UPDATE ON maintenance_logs TO housekeeping_staff;
GRANT SELECT ON reservations TO housekeeping_staff;
GRANT SELECT ON room_availability TO housekeeping_staff;

-- 4. Finance Role (Payment and Reporting)
CREATE ROLE finance_staff;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO finance_staff;
GRANT SELECT, INSERT, UPDATE ON payments TO finance_staff;
GRANT SELECT ON daily_revenue TO finance_staff;
GRANT EXECUTE ON FUNCTION calculate_revenue(DATE, DATE) TO finance_staff;
GRANT EXECUTE ON FUNCTION get_occupancy_rate(INT, DATE) TO finance_staff;

-- 5. Guest Services Role (Service Requests)
CREATE ROLE guest_services;
GRANT SELECT ON guests TO guest_services;
GRANT SELECT ON reservations TO guest_services;
GRANT SELECT ON services TO guest_services;
GRANT SELECT, INSERT, UPDATE ON service_requests TO guest_services;
GRANT SELECT ON staff_workload TO guest_services;
GRANT SELECT ON service_performance TO guest_services;

-- 6. Read-Only Auditor Role
CREATE ROLE auditor;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO auditor;

-- =====================================
-- CONCURRENCY CONTROL DEMONSTRATIONS
-- =====================================

-- Function to demonstrate READ COMMITTED isolation
CREATE OR REPLACE FUNCTION demo_read_committed_booking()
RETURNS TABLE(
    demo_step TEXT,
    room_status TEXT,
    reservation_count BIGINT,
    message TEXT
) AS $$
BEGIN
    -- Step 1: Show current state
    RETURN QUERY
    SELECT 
        'Step 1: Initial State'::TEXT,
        r.status,
        COUNT(res.reservation_id),
        'Room 101 current status and reservation count'::TEXT
    FROM rooms r
    LEFT JOIN reservations res ON r.room_id = res.room_id AND res.status = 'Confirmed'
    WHERE r.room_number = '101' AND r.hotel_id = 1
    GROUP BY r.status;
    
    -- Set isolation level
    SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
    
    -- Simulate concurrent booking scenario
    RETURN QUERY
    SELECT 
        'Step 2: READ COMMITTED Level Set'::TEXT,
        'N/A'::TEXT,
        0::BIGINT,
        'Transaction isolation level set to READ COMMITTED'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to demonstrate SERIALIZABLE isolation
CREATE OR REPLACE FUNCTION demo_serializable_booking(
    p_guest_id INT,
    p_room_id INT,
    p_check_in DATE,
    p_check_out DATE
)
RETURNS TEXT AS $$
DECLARE
    booking_result TEXT;
    conflict_count INT;
BEGIN
    -- Set serializable isolation level
    SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
    
    BEGIN
        -- Check for conflicts
        SELECT COUNT(*) INTO conflict_count
        FROM reservations
        WHERE room_id = p_room_id
        AND status IN ('Confirmed', 'Checked-in')
        AND NOT (check_out_date <= p_check_in OR check_in_date >= p_check_out);
        
        IF conflict_count > 0 THEN
            booking_result := 'CONFLICT: Room already booked for selected dates';
            ROLLBACK;
        ELSE
            -- Attempt to create reservation
            INSERT INTO reservations (guest_id, room_id, check_in_date, check_out_date, adults, total_amount, status)
            VALUES (p_guest_id, p_room_id, p_check_in, p_check_out, 2, 299.97, 'Confirmed');
            
            booking_result := 'SUCCESS: Reservation created successfully with SERIALIZABLE isolation';
            COMMIT;
        END IF;
        
    EXCEPTION
        WHEN serialization_failure THEN
            booking_result := 'SERIALIZATION_FAILURE: Transaction was aborted due to concurrent modification';
            ROLLBACK;
        WHEN OTHERS THEN
            booking_result := 'ERROR: ' || SQLERRM;
            ROLLBACK;
    END;
    
    RETURN booking_result;
END;
$$ LANGUAGE plpgsql;

-- Function to demonstrate deadlock prevention
CREATE OR REPLACE FUNCTION demo_deadlock_prevention()
RETURNS TABLE(
    step_number INT,
    description TEXT,
    lock_acquired TEXT,
    status TEXT
) AS $$
BEGIN
    -- Step 1: Acquire locks in consistent order (room_id, then guest_id)
    RETURN QUERY
    SELECT 
        1,
        'Acquiring lock on rooms table first'::TEXT,
        'room_id ASC order'::TEXT,
        'PREVENTED DEADLOCK'::TEXT;
    
    -- Step 2: Show proper lock ordering
    RETURN QUERY
    SELECT 
        2,
        'Then acquiring lock on guests table'::TEXT,
        'guest_id ASC order'::TEXT,
        'CONSISTENT ORDERING'::TEXT;
    
    -- Step 3: Complete transaction
    RETURN QUERY
    SELECT 
        3,
        'Transaction completed successfully'::TEXT,
        'All locks released'::TEXT,
        'SUCCESS'::TEXT;
END;
$$ LANGUAGE plpgsql;






-- Grant sequence usage for roles that need to insert data
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO front_desk_agent;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO housekeeping_staff;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO finance_staff;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO guest_services;


-- Create specific users and assign them to roles

-- Hotel Manager Users
CREATE USER john_manager WITH PASSWORD 'manager123';
GRANT hotel_manager TO john_manager;

CREATE USER lisa_manager WITH PASSWORD 'manager456';
GRANT hotel_manager TO lisa_manager;

-- Front Desk Agents
CREATE USER sarah_frontdesk WITH PASSWORD 'frontdesk123';
GRANT front_desk_agent TO sarah_frontdesk;

CREATE USER david_frontdesk WITH PASSWORD 'frontdesk456';
GRANT front_desk_agent TO david_frontdesk;

-- Housekeeping Staff
CREATE USER mike_housekeeping WITH PASSWORD 'housekeeping123';
GRANT housekeeping_staff TO mike_housekeeping;

CREATE USER emma_housekeeping WITH PASSWORD 'housekeeping456';
GRANT housekeeping_staff TO emma_housekeeping;

-- Finance Staff
CREATE USER anna_finance WITH PASSWORD 'finance123';
GRANT finance_staff TO anna_finance;

-- Guest Services
CREATE USER tom_services WITH PASSWORD 'services123';
GRANT guest_services TO tom_services;

-- Auditor
CREATE USER audit_user WITH PASSWORD 'audit123';
GRANT auditor TO audit_user;


-- Enable Row Level Security for sensitive tables

-- Enable RLS on payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policy: Finance staff can see all payments, others only see their hotel's payments
CREATE POLICY payment_access_policy ON payments
    FOR ALL
    TO front_desk_agent, guest_services
    USING (
        reservation_id IN (
            SELECT r.reservation_id
            FROM reservations r
            JOIN rooms rm ON r.room_id = rm.room_id
            WHERE rm.hotel_id = current_setting('app.current_hotel_id', true)::int
        )
    );

-- Policy: Finance staff can see all payments
CREATE POLICY finance_payment_policy ON payments
    FOR ALL
    TO finance_staff
    USING (true);

-- Enable RLS on staff table
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Policy: Staff can only see colleagues from their hotel
CREATE POLICY staff_hotel_policy ON staff
    FOR ALL
    TO front_desk_agent, housekeeping_staff, guest_services
    USING (hotel_id = current_setting('app.current_hotel_id', true)::int);

-- Policy: Managers and finance can see all staff
CREATE POLICY manager_staff_policy ON staff
    FOR ALL
    TO hotel_manager, finance_staff
    USING (true);



-- Function to set current user's hotel context
CREATE OR REPLACE FUNCTION set_current_hotel(hotel_id_param INT)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_hotel_id', hotel_id_param::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to all roles
GRANT EXECUTE ON FUNCTION set_current_hotel(INT) TO front_desk_agent, housekeeping_staff, guest_services, hotel_manager, finance_staff;

-- Function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(table_name TEXT, operation TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    has_permission BOOLEAN := FALSE;
BEGIN
    SELECT current_user INTO user_role;

    -- Check if user has permission for the operation
    IF pg_has_role(current_user, 'hotel_manager', 'member') THEN
        has_permission := TRUE;
    ELSIF pg_has_role(current_user, 'front_desk_agent', 'member') AND
          table_name IN ('guests', 'reservations', 'payments') AND
          operation IN ('SELECT', 'INSERT', 'UPDATE') THEN
        has_permission := TRUE;
    ELSIF pg_has_role(current_user, 'housekeeping_staff', 'member') AND
          table_name IN ('rooms', 'maintenance_logs') THEN
        has_permission := TRUE;
    ELSIF pg_has_role(current_user, 'finance_staff', 'member') AND
          operation = 'SELECT' THEN
        has_permission := TRUE;
    END IF;

    RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Create audit table to track all database changes
CREATE TABLE audit_log (
    audit_id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    operation VARCHAR(10) NOT NULL,
    user_name VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grant access to audit table
GRANT SELECT ON audit_log TO auditor;
GRANT INSERT ON audit_log TO hotel_manager, front_desk_agent, housekeeping_staff, finance_staff, guest_services;
GRANT USAGE ON SEQUENCE audit_log_audit_id_seq TO hotel_manager, front_desk_agent, housekeeping_staff, finance_staff, guest_services;

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, operation, user_name, old_values)
        VALUES (TG_TABLE_NAME, TG_OP, current_user, row_to_json(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, operation, user_name, old_values, new_values)
        VALUES (TG_TABLE_NAME, TG_OP, current_user, row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, operation, user_name, new_values)
        VALUES (TG_TABLE_NAME, TG_OP, current_user, row_to_json(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers on important tables
CREATE TRIGGER audit_guests_trigger
    AFTER INSERT OR UPDATE OR DELETE ON guests
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_reservations_trigger
    AFTER INSERT OR UPDATE OR DELETE ON reservations
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_payments_trigger
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();


-- Test commands (run these to verify security works)

