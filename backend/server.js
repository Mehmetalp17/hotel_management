const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mehmet_otel',
  password: process.env.DB_PASSWORD || '4238',
  port: process.env.DB_PORT || 5432,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('✅ Connected to PostgreSQL database');
    release();
  }
});

// =====================================
// GUEST MANAGEMENT APIs
// =====================================

// GET all guests with reservation summary
app.get('/api/guests', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          g.guest_id,
          g.first_name || ' ' || g.last_name AS guest_name,
          g.email,
          g.phone,
          COUNT(r.reservation_id) AS total_reservations,
          COALESCE(SUM(r.total_amount), 0) AS total_spent,
          g.loyalty_points,
          MAX(r.check_out_date) AS last_visit
        FROM guests g
        LEFT JOIN reservations r ON g.guest_id = r.guest_id
        WHERE r.status != 'Cancelled' OR r.status IS NULL
        GROUP BY g.guest_id, g.first_name, g.last_name, g.email, g.phone, g.loyalty_points
        ORDER BY g.last_name, g.first_name
      `);
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching guests:', err);
      res.status(500).json({ error: err.message });
    }
  });
  
  // POST - Add new guest
  app.post('/api/guests', async (req, res) => {
    const { 
      first_name, 
      last_name, 
      email, 
      phone, 
      address, 
      city, 
      state, 
      zip_code, 
      date_of_birth, 
      id_number, 
      nationality 
    } = req.body;
  
    try {
      const result = await pool.query(
        `INSERT INTO guests (first_name, last_name, email, phone, address, city, state, zip_code, date_of_birth, id_number, nationality) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
         RETURNING *`,
        [first_name, last_name, email, phone, address, city, state, zip_code, date_of_birth, id_number, nationality]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Error adding guest:', err);
      if (err.code === '23505') { // Unique constraint violation
        res.status(400).json({ error: 'Email already exists' });
      } else {
        res.status(500).json({ error: err.message });
      }
    }
  });
  
  // GET single guest by ID
  app.get('/api/guests/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query('SELECT * FROM guests WHERE guest_id = $1', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Guest not found' });
      }
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error fetching guest:', err);
      res.status(500).json({ error: err.message });
    }
  });


  // PUT - Update guest information
    app.put('/api/guests/:id', async (req, res) => {
        const { id } = req.params;
        const { 
        first_name, 
        last_name, 
        email, 
        phone, 
        address, 
        city, 
        state, 
        zip_code, 
        date_of_birth, 
        id_number, 
        nationality 
        } = req.body;
    
        // Validation
        if (!first_name || !last_name || !email || !phone) {
        return res.status(400).json({ error: 'First name, last name, email, and phone are required' });
        }
    
        try {
        const result = await pool.query(
            `UPDATE guests 
            SET first_name = $1, last_name = $2, email = $3, phone = $4, 
                address = $5, city = $6, state = $7, zip_code = $8, 
                date_of_birth = $9, id_number = $10, nationality = $11
            WHERE guest_id = $12 
            RETURNING *`,
            [first_name, last_name, email, phone, address, city, state, zip_code, 
            date_of_birth, id_number, nationality, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Guest not found' });
        }
        
        res.json(result.rows[0]);
        } catch (err) {
        console.error('Error updating guest:', err);
        if (err.code === '23505') { // Unique constraint violation
            res.status(400).json({ error: 'Email already exists' });
        } else {
            res.status(500).json({ error: err.message });
        }
        }
    });
    
    // DELETE - Delete guest (only if no reservations)
    app.delete('/api/guests/:id', async (req, res) => {
        const { id } = req.params;
        
        const client = await pool.connect();
        try {
        await client.query('BEGIN');
        
        // Check if guest has any reservations
        const reservationCheck = await client.query(
            'SELECT COUNT(*) as count FROM reservations WHERE guest_id = $1',
            [id]
        );
        
        if (parseInt(reservationCheck.rows[0].count) > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
            error: 'Cannot delete guest with existing reservations. Cancel reservations first.' 
            });
        }
        
        // Delete the guest
        const result = await client.query(
            'DELETE FROM guests WHERE guest_id = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Guest not found' });
        }
        
        await client.query('COMMIT');
        res.json({ message: 'Guest deleted successfully', guest: result.rows[0] });
        } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting guest:', err);
        res.status(500).json({ error: err.message });
        } finally {
        client.release();
        }
    });


  // =====================================
// ROOM MANAGEMENT APIs
// =====================================

// GET all rooms with status
app.get('/api/rooms', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          h.hotel_name,
          rm.room_id,
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
        JOIN room_types rt ON rm.room_type_id = rt.room_type_id
        ORDER BY h.hotel_name, rm.room_number
      `);
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      res.status(500).json({ error: err.message });
    }
  });
  
  // GET available rooms for date range
  app.get('/api/rooms/available', async (req, res) => {
    const { check_in, check_out, hotel_id } = req.query;
    
    if (!check_in || !check_out) {
      return res.status(400).json({ error: 'Check-in and check-out dates are required' });
    }
  
    try {
      let query = `
        SELECT r.room_id, r.room_number, rt.type_name, rt.base_price, h.hotel_name
        FROM rooms r
        JOIN room_types rt ON r.room_type_id = rt.room_type_id
        JOIN hotels h ON r.hotel_id = h.hotel_id
        WHERE r.status = 'Available'
      `;
      
      let params = [check_in, check_out];
      
      if (hotel_id) {
        query += ` AND r.hotel_id = $3`;
        params.push(hotel_id);
      }
      
      query += `
        AND r.room_id NOT IN (
          SELECT res.room_id
          FROM reservations res
          WHERE res.status IN ('Confirmed', 'Checked-in')
          AND NOT (res.check_out_date <= $1 OR res.check_in_date >= $2)
        )
        ORDER BY h.hotel_name, r.room_number
      `;
  
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching available rooms:', err);
      res.status(500).json({ error: err.message });
    }
  });
  
  // UPDATE room status
  app.put('/api/rooms/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['Available', 'Occupied', 'Maintenance', 'Out of Order'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
  
    try {
      const result = await pool.query(
        'UPDATE rooms SET status = $1 WHERE room_id = $2 RETURNING *',
        [status, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Room not found' });
      }
      
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error updating room status:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Add this after your existing room APIs (around line 267)

// GET all hotels for reservation form
app.get('/api/hotels', async (req, res) => {
  try {
    const result = await pool.query('SELECT hotel_id, hotel_name, city, state FROM hotels ORDER BY hotel_name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching hotels:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET rooms by hotel for reservation form
app.get('/api/rooms/by-hotel/:hotel_id', async (req, res) => {
  const { hotel_id } = req.params;
  const { check_in, check_out } = req.query;
  
  try {
    let query = `
      SELECT 
        r.room_id, 
        r.room_number, 
        rt.type_name, 
        rt.base_price,
        rt.max_occupancy,
        rt.amenities,
        r.floor_number
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.room_type_id
      WHERE r.hotel_id = $1 AND r.status = 'Available'
    `;
    
    let params = [hotel_id];
    
    if (check_in && check_out) {
      query += `
        AND r.room_id NOT IN (
          SELECT res.room_id
          FROM reservations res
          WHERE res.status IN ('Confirmed', 'Checked-in')
          AND NOT (res.check_out_date <= $2 OR res.check_in_date >= $3)
        )
      `;
      params.push(check_in, check_out);
    }
    
    query += ' ORDER BY rt.base_price, r.room_number';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching rooms by hotel:', err);
    res.status(500).json({ error: err.message });
  }
});


  // =====================================
// RESERVATION MANAGEMENT APIs
// =====================================

// GET all reservations with guest and room details
app.get('/api/reservations', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          r.reservation_id,
          r.guest_id,
          r.room_id,
          g.first_name || ' ' || g.last_name as guest_name,
          g.email as guest_email,
          rm.room_number,
          h.hotel_name,
          rt.type_name as room_type,
          r.check_in_date,
          r.check_out_date,
          r.adults,
          r.children,
          r.total_amount,
          r.status,
          r.special_requests,
          r.created_at
        FROM reservations r
        JOIN guests g ON r.guest_id = g.guest_id
        JOIN rooms rm ON r.room_id = rm.room_id
        JOIN hotels h ON rm.hotel_id = h.hotel_id
        JOIN room_types rt ON rm.room_type_id = rt.room_type_id
        ORDER BY r.check_in_date DESC, r.created_at DESC
      `);
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      res.status(500).json({ error: err.message });
    }
  });
  
  // POST - Create new reservation (with transaction)
  app.post('/api/reservations', async (req, res) => {
    const { 
      guest_id, 
      room_id, 
      check_in_date, 
      check_out_date, 
      adults, 
      children, 
      total_amount, 
      special_requests 
    } = req.body;
  
    // Validation
    if (!guest_id || !room_id || !check_in_date || !check_out_date || !total_amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    if (new Date(check_in_date) >= new Date(check_out_date)) {
      return res.status(400).json({ error: 'Check-out date must be after check-in date' });
    }
  
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Check if room is available for the dates
      const conflictCheck = await client.query(`
        SELECT COUNT(*) as count
        FROM reservations
        WHERE room_id = $1
        AND status IN ('Confirmed', 'Checked-in')
        AND NOT (check_out_date <= $2 OR check_in_date >= $3)
      `, [room_id, check_in_date, check_out_date]);
  
      if (parseInt(conflictCheck.rows[0].count) > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Room is not available for selected dates' });
      }
  
      // Create the reservation
      const result = await client.query(
        `INSERT INTO reservations (guest_id, room_id, check_in_date, check_out_date, adults, children, total_amount, special_requests, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Confirmed') 
         RETURNING *`,
        [guest_id, room_id, check_in_date, check_out_date, adults || 1, children || 0, total_amount, special_requests]
      );
      
      await client.query('COMMIT');
      res.status(201).json(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error creating reservation:', err);
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  });
  
  // PUT - Update reservation status (check-in/check-out)
  app.put('/api/reservations/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['Pending', 'Confirmed', 'Checked-in', 'Checked-out', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
  
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Get current reservation details
      const currentRes = await client.query(
        'SELECT * FROM reservations WHERE reservation_id = $1',
        [id]
      );
      
      if (currentRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Reservation not found' });
      }
  
      // Update reservation status
      const result = await client.query(
        'UPDATE reservations SET status = $1 WHERE reservation_id = $2 RETURNING *',
        [status, id]
      );
      
      await client.query('COMMIT');
      res.json(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error updating reservation:', err);
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  });
  
  // GET single reservation by ID
  app.get('/api/reservations/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(`
        SELECT 
          r.*,
          g.first_name || ' ' || g.last_name as guest_name,
          g.email as guest_email,
          rm.room_number,
          h.hotel_name
        FROM reservations r
        JOIN guests g ON r.guest_id = g.guest_id
        JOIN rooms rm ON r.room_id = rm.room_id
        JOIN hotels h ON rm.hotel_id = h.hotel_id
        WHERE r.reservation_id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Reservation not found' });
      }
      
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error fetching reservation:', err);
      res.status(500).json({ error: err.message });
    }
  });


  // =====================================
// PAYMENT MANAGEMENT APIs
// =====================================

// GET all payments with reservation and guest details
app.get('/api/payments', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          p.payment_id,
          p.reservation_id,
          p.amount,
          p.payment_method,
          p.payment_status,
          p.transaction_id,
          p.payment_date,
          g.first_name || ' ' || g.last_name as guest_name,
          g.email as guest_email,
          r.check_in_date,
          r.check_out_date,
          r.total_amount as reservation_amount,
          rm.room_number,
          h.hotel_name
        FROM payments p
        JOIN reservations r ON p.reservation_id = r.reservation_id
        JOIN guests g ON r.guest_id = g.guest_id
        JOIN rooms rm ON r.room_id = rm.room_id
        JOIN hotels h ON rm.hotel_id = h.hotel_id
        ORDER BY p.payment_date DESC
      `);
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching payments:', err);
      res.status(500).json({ error: err.message });
    }
  });
  
  // POST - Create new payment (with transaction)
  app.post('/api/payments', async (req, res) => {
    const { reservation_id, amount, payment_method, transaction_id } = req.body;
    
    if (!reservation_id || !amount || !payment_method) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
  
    const validMethods = ['Cash', 'Credit Card', 'Debit Card', 'Online'];
    if (!validMethods.includes(payment_method)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }
  
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Verify reservation exists
      const resCheck = await client.query(
        'SELECT * FROM reservations WHERE reservation_id = $1',
        [reservation_id]
      );
      
      if (resCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Reservation not found' });
      }
  
      // Create payment
      const result = await client.query(
        `INSERT INTO payments (reservation_id, amount, payment_method, transaction_id, payment_status) 
         VALUES ($1, $2, $3, $4, 'Completed') 
         RETURNING *`,
        [reservation_id, amount, payment_method, transaction_id]
      );
      
      await client.query('COMMIT');
      res.status(201).json(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error creating payment:', err);
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  });
  
  // PUT - Update payment status
  app.put('/api/payments/:id/status', async (req, res) => {
    const { id } = req.params;
    const { payment_status } = req.body;
    
    const validStatuses = ['Pending', 'Completed', 'Failed', 'Refunded'];
    if (!validStatuses.includes(payment_status)) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }
  
    try {
      const result = await pool.query(
        'UPDATE payments SET payment_status = $1 WHERE payment_id = $2 RETURNING *',
        [payment_status, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error updating payment status:', err);
      res.status(500).json({ error: err.message });
    }
  });
  
  // GET payments by reservation ID
  app.get('/api/payments/reservation/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(
        'SELECT * FROM payments WHERE reservation_id = $1 ORDER BY payment_date DESC',
        [id]
      );
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching payments for reservation:', err);
      res.status(500).json({ error: err.message });
    }
  });

// =====================================
// REPORTS & ANALYTICS APIs
// =====================================

// GET revenue report for date range
app.get('/api/reports/revenue', async (req, res) => {
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
  
    try {
      const result = await pool.query(
        'SELECT calculate_revenue($1, $2) as total_revenue',
        [start_date, end_date]
      );
      res.json({ total_revenue: result.rows[0].total_revenue || 0 });
    } catch (err) {
      console.error('Error calculating revenue:', err);
      res.status(500).json({ error: err.message });
    }
  });
  
  // GET daily revenue report
  app.get('/api/reports/daily-revenue', async (req, res) => {
    try {
      const result = await pool.query(`
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
        AND r.check_in_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(r.check_in_date), h.hotel_name
        ORDER BY revenue_date DESC
        LIMIT 30
      `);
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching daily revenue:', err);
      res.status(500).json({ error: err.message });
    }
  });
  
  // GET occupancy rate
  app.get('/api/reports/occupancy', async (req, res) => {
    const { hotel_id, date } = req.query;
    
    if (!hotel_id || !date) {
      return res.status(400).json({ error: 'Hotel ID and date are required' });
    }
  
    try {
      const result = await pool.query(
        'SELECT get_occupancy_rate($1, $2) as occupancy_rate',
        [hotel_id, date]
      );
      res.json({ occupancy_rate: result.rows[0].occupancy_rate || 0 });
    } catch (err) {
      console.error('Error calculating occupancy rate:', err);
      res.status(500).json({ error: err.message });
    }
  });
  
  // GET guest statistics
  app.get('/api/reports/guest-stats', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_guests,
          COUNT(CASE WHEN loyalty_points > 0 THEN 1 END) as loyalty_members,
          AVG(loyalty_points) as avg_loyalty_points,
          MAX(loyalty_points) as max_loyalty_points
        FROM guests
      `);
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error fetching guest statistics:', err);
      res.status(500).json({ error: err.message });
    }
  });
  
  // GET room utilization report
  app.get('/api/reports/room-utilization', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          rt.type_name,
          COUNT(r.room_id) as total_rooms,
          COUNT(CASE WHEN r.status = 'Available' THEN 1 END) as available_rooms,
          COUNT(CASE WHEN r.status = 'Occupied' THEN 1 END) as occupied_rooms,
          COUNT(CASE WHEN r.status = 'Maintenance' THEN 1 END) as maintenance_rooms,
          ROUND(
            (COUNT(CASE WHEN r.status = 'Occupied' THEN 1 END)::DECIMAL / COUNT(r.room_id)) * 100, 2
          ) as occupancy_percentage
        FROM rooms r
        JOIN room_types rt ON r.room_type_id = rt.room_type_id
        GROUP BY rt.type_name
        ORDER BY rt.type_name
      `);
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching room utilization:', err);
      res.status(500).json({ error: err.message });
    }
  });


  // =====================================
// COMPLEX QUERIES (Required: LEFT, RIGHT, FULL OUTER JOIN)
// =====================================

// LEFT OUTER JOIN - All guests with their reservations (including guests without reservations)
app.get('/api/queries/guests-reservations', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          g.guest_id, 
          g.first_name, 
          g.last_name, 
          g.email,
          r.reservation_id, 
          r.check_in_date, 
          r.check_out_date, 
          r.total_amount,
          r.status as reservation_status
        FROM guests g
        LEFT OUTER JOIN reservations r ON g.guest_id = r.guest_id
        ORDER BY g.last_name, g.first_name, r.check_in_date DESC
      `);
      res.json(result.rows);
    } catch (err) {
      console.error('Error executing LEFT OUTER JOIN query:', err);
      res.status(500).json({ error: err.message });
    }
  });
  
  // RIGHT OUTER JOIN - All reservations with guest info (including orphaned reservations if any)
  app.get('/api/queries/reservations-guests', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          g.first_name, 
          g.last_name, 
          g.email,
          r.reservation_id, 
          r.check_in_date, 
          r.check_out_date, 
          r.total_amount, 
          r.status,
          rm.room_number,
          h.hotel_name
        FROM guests g
        RIGHT OUTER JOIN reservations r ON g.guest_id = r.guest_id
        LEFT JOIN rooms rm ON r.room_id = rm.room_id
        LEFT JOIN hotels h ON rm.hotel_id = h.hotel_id
        ORDER BY r.check_in_date DESC
      `);
      res.json(result.rows);
    } catch (err) {
      console.error('Error executing RIGHT OUTER JOIN query:', err);
      res.status(500).json({ error: err.message });
    }
  });
  
  // FULL OUTER JOIN - All staff and service requests (showing staff with/without requests and requests with/without staff)
  app.get('/api/queries/staff-services', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          s.staff_id,
          s.first_name, 
          s.last_name, 
          s.department,
          s.position,
          sr.request_id, 
          sr.status as request_status, 
          sv.service_name,
          sr.request_date,
          sr.completion_date
        FROM staff s
        FULL OUTER JOIN service_requests sr ON s.staff_id = sr.staff_id
        LEFT JOIN services sv ON sr.service_id = sv.service_id
        ORDER BY s.last_name, s.first_name, sr.request_date DESC
      `);
      res.json(result.rows);
    } catch (err) {
      console.error('Error executing FULL OUTER JOIN query:', err);
      res.status(500).json({ error: err.message });
    }
  });
  
  // Additional complex query - Guest loyalty analysis with payment history
  app.get('/api/queries/guest-loyalty-analysis', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          g.guest_id,
          g.first_name || ' ' || g.last_name as guest_name,
          g.email,
          g.loyalty_points,
          COUNT(r.reservation_id) as total_reservations,
          COALESCE(SUM(r.total_amount), 0) as total_spent,
          COUNT(p.payment_id) as total_payments,
          COALESCE(SUM(p.amount), 0) as total_paid,
          AVG(r.total_amount) as avg_reservation_value,
          MAX(r.check_out_date) as last_visit,
          CASE 
            WHEN COUNT(r.reservation_id) >= 10 THEN 'VIP'
            WHEN COUNT(r.reservation_id) >= 5 THEN 'Gold'
            WHEN COUNT(r.reservation_id) >= 2 THEN 'Silver'
            ELSE 'Bronze'
          END as guest_tier
        FROM guests g
        LEFT OUTER JOIN reservations r ON g.guest_id = r.guest_id AND r.status != 'Cancelled'
        LEFT OUTER JOIN payments p ON r.reservation_id = p.reservation_id AND p.payment_status = 'Completed'
        GROUP BY g.guest_id, g.first_name, g.last_name, g.email, g.loyalty_points
        ORDER BY total_spent DESC, total_reservations DESC
      `);
      res.json(result.rows);
    } catch (err) {
      console.error('Error executing guest loyalty analysis query:', err);
      res.status(500).json({ error: err.message });
    }
  });
  
  // Complex query - Revenue analysis by room type and month
  app.get('/api/queries/revenue-by-room-type', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          rt.type_name,
          DATE_TRUNC('month', r.check_in_date) as month,
          COUNT(r.reservation_id) as bookings,
          SUM(r.total_amount) as total_revenue,
          AVG(r.total_amount) as avg_revenue_per_booking,
          rt.base_price,
          ROUND(
            (SUM(r.total_amount) / COUNT(r.reservation_id) / rt.base_price - 1) * 100, 2
          ) as price_premium_percentage
        FROM reservations r
        JOIN rooms rm ON r.room_id = rm.room_id
        JOIN room_types rt ON rm.room_type_id = rt.room_type_id
        WHERE r.status IN ('Confirmed', 'Checked-in', 'Checked-out')
        AND r.check_in_date >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY rt.type_name, DATE_TRUNC('month', r.check_in_date), rt.base_price
        ORDER BY month DESC, total_revenue DESC
      `);
      res.json(result.rows);
    } catch (err) {
      console.error('Error executing revenue by room type query:', err);
      res.status(500).json({ error: err.message });
    }
  });



// =====================================
// ERROR HANDLING MIDDLEWARE
// =====================================

// 404 handler for undefined routes
app.use((req, res, next) => {
    // Only handle requests that haven't been handled by previous routes
    if (!res.headersSent) {
      res.status(404).json({ 
        error: 'Route not found',
        message: `The requested route ${req.originalUrl} does not exist.`,
        availableRoutes: [
          'GET /api/guests',
          'POST /api/guests', 
          'GET /api/rooms',
          'GET /api/rooms/available',
          'GET /api/reservations',
          'POST /api/reservations',
          'GET /api/payments',
          'POST /api/payments',
          'GET /api/reports/revenue',
          'GET /api/reports/daily-revenue',
          'GET /api/reports/occupancy',
          'GET /api/queries/guests-reservations',
          'GET /api/queries/reservations-guests',
          'GET /api/queries/staff-services'
        ]
      });
    }
  });
  
  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
      });
    }
  });
  
  // =====================================
  // SERVER STARTUP
  // =====================================
  
  const PORT = process.env.PORT || 3000;
  
  app.listen(PORT, () => {
    console.log(`
  🏨 ====================================
     HOTEL MANAGEMENT SYSTEM BACKEND
  🏨 ====================================
  
  ✅ Server running on port ${PORT}
  🔗 Base URL: http://localhost:${PORT}
  📊 Database: ${process.env.DB_NAME || 'mehmet_otel'}
  🌐 Environment: ${process.env.NODE_ENV || 'development'}
  
  📋 Available API Endpoints:
     
     👥 GUESTS:
     • GET  /api/guests
     • POST /api/guests
     • GET  /api/guests/:id
     
     🏠 ROOMS:
     • GET  /api/rooms
     • GET  /api/rooms/available
     • PUT  /api/rooms/:id/status
     
     📅 RESERVATIONS:
     • GET  /api/reservations
     • POST /api/reservations
     • PUT  /api/reservations/:id/status
     • GET  /api/reservations/:id
     
     💳 PAYMENTS:
     • GET  /api/payments
     • POST /api/payments
     • PUT  /api/payments/:id/status
     
     📊 REPORTS:
     • GET  /api/reports/revenue
     • GET  /api/reports/daily-revenue
     • GET  /api/reports/occupancy
     • GET  /api/reports/guest-stats
     • GET  /api/reports/room-utilization
     
     🔍 COMPLEX QUERIES:
     • GET  /api/queries/guests-reservations (LEFT JOIN)
     • GET  /api/queries/reservations-guests (RIGHT JOIN)
     • GET  /api/queries/staff-services (FULL OUTER JOIN)
     • GET  /api/queries/guest-loyalty-analysis
     • GET  /api/queries/revenue-by-room-type
  
  🏨 ====================================
  `);
  });
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server gracefully...');
    
    try {
      await pool.end();
      console.log('✅ Database connection pool closed.');
    } catch (err) {
      console.error('❌ Error closing database connection:', err);
    }
    
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\n🛑 SIGTERM received, shutting down gracefully...');
    await pool.end();
    process.exit(0);
  });