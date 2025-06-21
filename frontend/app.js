// [app.js](http://_vscodecontentref_/0) - Frontend JavaScript for Hotel Management System

// API Base URL - Make sure this matches your backend server
const API_BASE = 'http://localhost:3000/api';

// Global variables
let currentModule = null;
let guests = [];
let rooms = [];
let reservations = [];

console.log("🚀 [app.js](http://_vscodecontentref_/1) loaded successfully!");

// Utility Functions
function showLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

function showError(message) {
    alert('Error: ' + message);
}

function showSuccess(message) {
    alert('Success: ' + message);
}

// Navigation Function
// Navigation Function
function showModule(moduleName) {
    console.log("🔍 showModule called with:", moduleName);
    
    try {
        // Hide all modules
        document.querySelectorAll('.module').forEach(module => {
            module.style.display = 'none';
        });
        
        // Hide welcome message  
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.display = 'none';
        }
        
        // Show selected module
        const targetModule = document.getElementById(moduleName + '-module');
        if (targetModule) {
            targetModule.style.display = 'block';
            console.log("✅ Module shown:", moduleName);
        } else {
            console.error("❌ Module not found:", moduleName + '-module');
        }
        
        // Update active nav button
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Find and activate the clicked button
        const activeButton = document.querySelector("button[onclick=\"showModule('" + moduleName + "')\"]");
        if (activeButton) {
            activeButton.classList.add('active');
        }
        
        currentModule = moduleName;
        
        // Load module data
        switch(moduleName) {
            case 'guests':
                loadGuests();
                break;
            case 'rooms':
                loadRooms();
                break;
            case 'reservations':
                loadReservations();
                loadGuestsForReservation();
                loadRoomsForReservation();
                break;
            case 'payments':
                loadPayments();
                loadReservationsForPayment();
                break;
            case 'reports':
                // Reports load on demand
                break;
            case 'security':
                console.log('Security module accessed');
                break;
        }
        
        console.log("🎯 Navigation complete for:", moduleName);
        
    } catch (error) {
        console.error("💥 Error in showModule:", error);
    }
}

// Guest Management Functions
async function loadGuests() {
    showLoading();
    try {
        const response = await fetch(API_BASE + '/guests');
        const data = await response.json();
        guests = data;
        
        const tbody = document.querySelector('#guests-table tbody');
        if (tbody) {
            tbody.innerHTML = '';
            
            data.forEach(guest => {
                const row = document.createElement('tr');
                row.innerHTML = 
                    '<td>' + (guest.guest_name || 'N/A') + '</td>' +
                    '<td>' + (guest.email || 'N/A') + '</td>' +
                    '<td>' + (guest.phone || 'N/A') + '</td>' +
                    '<td>' + (guest.total_reservations || 0) + '</td>' +
                    '<td>$' + parseFloat(guest.total_spent || 0).toFixed(2) + '</td>' +
                    '<td>' + (guest.loyalty_points || 0) + '</td>' +
                    '<td>' +
                        '<button onclick="editGuest(' + guest.guest_id + ')" class="btn btn-warning" style="margin-right: 5px;">✏️ Edit</button>' +
                        '<button onclick="deleteGuest(' + guest.guest_id + ')" class="btn btn-danger">🗑️ Delete</button>' +
                    '</td>';
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading guests:', error);
        showError('Failed to load guests. Make sure the backend server is running.');
    }
    hideLoading();
}

function showAddGuestForm() {
    const form = document.getElementById('add-guest-form');
    if (form) {
        form.style.display = 'block';
    }
}

function hideAddGuestForm() {
    const form = document.getElementById('add-guest-form');
    if (form) {
        form.style.display = 'none';
    }
    
    const guestForm = document.getElementById('guest-form');
    if (guestForm) {
        guestForm.reset();
        guestForm.removeAttribute('data-guest-id');
        const submitBtn = guestForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = '💾 Add Guest';
        }
    }
}

// Edit guest function
async function editGuest(guestId) {
    try {
        const response = await fetch(API_BASE + '/guests/' + guestId);
        const guest = await response.json();
        
        // Fill form fields
        const fields = ['first_name', 'last_name', 'email', 'phone', 'address', 'city', 'state', 'zip_code', 'date_of_birth', 'id_number', 'nationality'];
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                element.value = guest[field] || '';
            }
        });
        
        // Show form
        showAddGuestForm();
        
        // Update form for editing
        const form = document.getElementById('guest-form');
        if (form) {
            form.setAttribute('data-guest-id', guestId);
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = '💾 Update Guest';
            }
        }
        
    } catch (error) {
        console.error('Error loading guest for edit:', error);
        showError('Failed to load guest details');
    }
}

// Delete guest function
async function deleteGuest(guestId) {
    if (!confirm('Are you sure you want to delete this guest? This action cannot be undone.')) {
        return;
    }
    
    showLoading();
    try {
        const response = await fetch(API_BASE + '/guests/' + guestId, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showSuccess('Guest deleted successfully!');
            loadGuests();
        } else {
            const error = await response.json();
            showError(error.error || 'Failed to delete guest');
        }
    } catch (error) {
        console.error('Error deleting guest:', error);
        showError('Failed to delete guest');
    }
    hideLoading();
}

// Room Management Functions
async function loadRooms() {
    showLoading();
    try {
        const response = await fetch(API_BASE + '/rooms');
        const data = await response.json();
        rooms = data;
        
        const tbody = document.querySelector('#rooms-table tbody');
        if (tbody) {
            tbody.innerHTML = '';
            
            data.forEach(room => {
                const row = document.createElement('tr');
                const statusClass = 'status-' + (room.status || '').toLowerCase().replace(/\s+/g, '-');
                const availableFrom = room.available_from ? new Date(room.available_from).toLocaleDateString() : 'Available Now';
                
                row.innerHTML = 
                    '<td>' + (room.hotel_name || 'N/A') + '</td>' +
                    '<td>' + (room.room_number || 'N/A') + '</td>' +
                    '<td>' + (room.type_name || 'N/A') + '</td>' +
                    '<td>$' + parseFloat(room.base_price || 0).toFixed(2) + '</td>' +
                    '<td><span class="' + statusClass + '">' + (room.status || 'Unknown') + '</span></td>' +
                    '<td>' + (room.floor_number || 'N/A') + '</td>' +
                    '<td>' + availableFrom + '</td>';
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading rooms:', error);
        showError('Failed to load rooms');
    }
    hideLoading();
}

async function searchAvailableRooms() {
    const checkin = document.getElementById('search-checkin');
    const checkout = document.getElementById('search-checkout');
    
    if (!checkin || !checkout || !checkin.value || !checkout.value) {
        showError('Please select both check-in and check-out dates');
        return;
    }
    
    if (new Date(checkin.value) >= new Date(checkout.value)) {
        showError('Check-out date must be after check-in date');
        return;
    }
    
    showLoading();
    try {
        const response = await fetch(API_BASE + '/rooms/available?check_in=' + checkin.value + '&check_out=' + checkout.value);
        const data = await response.json();
        
        const tbody = document.querySelector('#rooms-table tbody');
        if (tbody) {
            tbody.innerHTML = '';
            
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No available rooms found for selected dates</td></tr>';
            } else {
                data.forEach(room => {
                    const row = document.createElement('tr');
                    row.innerHTML = 
                        '<td>' + (room.hotel_name || 'Unknown Hotel') + '</td>' +  // ✅ FIXED: Shows actual hotel name
                        '<td>' + (room.room_number || 'N/A') + '</td>' +
                        '<td>' + (room.type_name || 'N/A') + '</td>' +
                        '<td>$' + parseFloat(room.base_price || 0).toFixed(2) + '</td>' +
                        '<td><span class="status-available">Available</span></td>' +
                        '<td>-</td>' +
                        '<td>' + checkin.value + '</td>';
                    tbody.appendChild(row);
                });
            }
        }
    } catch (error) {
        console.error('Error searching rooms:', error);
        showError('Failed to search available rooms');
    }
    hideLoading();
}

// Enhanced Reservation Management Functions
let selectedRoomData = null;
let availableRooms = [];

// Reservation Management Functions
async function loadReservations() {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/reservations`);
        const data = await response.json();
        reservations = data;
        
        const tbody = document.querySelector('#reservations-table tbody');
        tbody.innerHTML = '';
        
        data.forEach(reservation => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${reservation.reservation_id}</td>
                <td>${reservation.guest_name || 'N/A'}</td>
                <td>${reservation.hotel_name || 'N/A'}</td>
                <td>${reservation.room_number || 'N/A'}</td>
                <td>${new Date(reservation.check_in_date).toLocaleDateString()}</td>
                <td>${new Date(reservation.check_out_date).toLocaleDateString()}</td>
                <td>$${parseFloat(reservation.total_amount).toFixed(2)}</td>
                <td><span class="status-${reservation.status.toLowerCase().replace(/\s+/g, '-')}">${reservation.status}</span></td>
                <td>
                    ${reservation.status === 'Confirmed' ? 
                        `<button onclick="updateReservationStatus(${reservation.reservation_id}, 'Checked-in')" class="btn btn-success">Check In</button>` : ''}
                    ${reservation.status === 'Checked-in' ? 
                        `<button onclick="updateReservationStatus(${reservation.reservation_id}, 'Checked-out')" class="btn btn-warning">Check Out</button>` : ''}
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading reservations:', error);
        showError('Failed to load reservations');
    }
    hideLoading();
}

async function loadGuestsForReservation() {
    try {
        const response = await fetch(`${API_BASE}/guests`);
        const data = await response.json();
        
        const select = document.getElementById('guest_id');
        if (select) {
            select.innerHTML = '<option value="">Select Guest...</option>';
            data.forEach(guest => {
                const option = document.createElement('option');
                option.value = guest.guest_id;
                option.textContent = `${guest.guest_name} (${guest.email})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading guests for reservation:', error);
    }
}
async function loadRoomsForReservation() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const response = await fetch(API_BASE + '/rooms/available?check_in=' + today + '&check_out=' + tomorrow);
        const data = await response.json();
        
        const select = document.getElementById('room_id');
        if (select) {
            select.innerHTML = '<option value="">Select Room</option>';
            data.forEach(room => {
                const option = document.createElement('option');
                option.value = room.room_id;
                option.textContent = 'Room ' + room.room_number + ' - ' + room.type_name + ' ($' + room.base_price + ')';
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading rooms for reservation:', error);
    }
}

async function loadHotelsForReservation() {
    try {
        const response = await fetch(`${API_BASE}/hotels`);
        const data = await response.json();
        
        const select = document.getElementById('hotel_id');
        if (select) {
            select.innerHTML = '<option value="">Select Hotel...</option>';
            data.forEach(hotel => {
                const option = document.createElement('option');
                option.value = hotel.hotel_id;
                option.textContent = `${hotel.hotel_name} - ${hotel.city}, ${hotel.state}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading hotels for reservation:', error);
    }
}

// Update room list based on hotel and dates
async function updateRoomList() {
    const hotelId = document.getElementById('hotel_id').value;
    const checkIn = document.getElementById('check_in_date').value;
    const checkOut = document.getElementById('check_out_date').value;
    
    const roomsGrid = document.getElementById('available-rooms-grid');
    
    // Clear previous selection
    selectedRoomData = null;
    document.getElementById('selected_room_id').value = '';
    updateTotalAmount();
    
    if (!hotelId || !checkIn || !checkOut) {
        roomsGrid.innerHTML = '<p class="room-instruction">Please select hotel and dates to see available rooms</p>';
        return;
    }
    
    // Validate dates
    if (new Date(checkIn) >= new Date(checkOut)) {
        roomsGrid.innerHTML = '<p class="rooms-empty">❌ Check-out date must be after check-in date</p>';
        return;
    }
    
    // Show loading
    roomsGrid.innerHTML = '<div class="rooms-loading">🔍 Finding available rooms...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/rooms/by-hotel/${hotelId}?check_in=${checkIn}&check_out=${checkOut}`);
        const rooms = await response.json();
        availableRooms = rooms;
        
        if (rooms.length === 0) {
            roomsGrid.innerHTML = '<p class="rooms-empty">😔 No rooms available for selected dates</p>';
            return;
        }
        
        // Display room cards
        roomsGrid.innerHTML = '';
        rooms.forEach(room => {
            const roomCard = document.createElement('div');
            roomCard.className = 'room-card';
            roomCard.setAttribute('data-room-id', room.room_id);
            roomCard.onclick = () => selectRoom(room);
            
            roomCard.innerHTML = `
                <div class="room-card-header">
                    <div class="room-number">🏠 Room ${room.room_number}</div>
                    <div class="room-price">$${parseFloat(room.base_price).toFixed(2)}/night</div>
                </div>
                <div class="room-type">${room.type_name}</div>
                <div class="room-details">
                    <div>🏢 Floor ${room.floor_number} • 👥 Max ${room.max_occupancy} guests</div>
                </div>
                <div class="room-amenities">✨ ${room.amenities}</div>
            `;
            
            roomsGrid.appendChild(roomCard);
        });
        if (rooms.length > 0) {
            roomsGrid.classList.add('rooms-loaded');
        }
        
    } catch (error) {
        console.error('Error loading rooms:', error);
        roomsGrid.innerHTML = '<p class="rooms-empty">❌ Error loading rooms. Please try again.</p>';
    }
}

// Select a room
function selectRoom(room) {
    // Remove previous selection
    document.querySelectorAll('.room-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Select new room
    const roomCard = document.querySelector(`[data-room-id="${room.room_id}"]`);
    roomCard.classList.add('selected');
    
    selectedRoomData = room;
    document.getElementById('selected_room_id').value = room.room_id;
    
    updateTotalAmount();
}

// Calculate and update total amount
function updateTotalAmount() {
    const checkIn = document.getElementById('check_in_date').value;
    const checkOut = document.getElementById('check_out_date').value;
    
    if (!selectedRoomData || !checkIn || !checkOut) {
        document.getElementById('total_amount_display').textContent = '0.00';
        document.getElementById('total_amount_input').value = '';
        return;
    }
    
    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    const totalAmount = selectedRoomData.base_price * nights;
    
    document.getElementById('total_amount_display').textContent = totalAmount.toFixed(2);
    document.getElementById('total_amount_input').value = totalAmount.toFixed(2);
}


function showAddReservationForm() {
    document.getElementById('add-reservation-form').style.display = 'block';
    loadGuestsForReservation();
    loadHotelsForReservation();
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    document.getElementById('check_in_date').value = today;
    document.getElementById('check_out_date').value = tomorrow;
}

// Hide reservation form and reset
function hideAddReservationForm() {
    document.getElementById('add-reservation-form').style.display = 'none';
    document.getElementById('reservation-form').reset();
    selectedRoomData = null;
    availableRooms = [];
    
    // Reset room grid
    const roomsGrid = document.getElementById('available-rooms-grid');
    roomsGrid.innerHTML = '<p class="room-instruction">Please select hotel and dates to see available rooms</p>';
    
    updateTotalAmount();
}

// Update reservation status
async function updateReservationStatus(reservationId, status) {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/reservations/${reservationId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            showSuccess(`Reservation ${status.toLowerCase()} successfully!`);
            loadReservations();
        } else {
            const error = await response.json();
            showError(error.error || 'Failed to update reservation');
        }
    } catch (error) {
        console.error('Error updating reservation:', error);
        showError('Failed to update reservation status');
    }
    hideLoading();
}

// Payment Management Functions
async function loadPayments() {
    showLoading();
    try {
        const response = await fetch(API_BASE + '/payments');
        const data = await response.json();
        
        const tbody = document.querySelector('#payments-table tbody');
        if (tbody) {
            tbody.innerHTML = '';
            
            data.forEach(payment => {
                const row = document.createElement('tr');
                const statusClass = 'status-' + payment.payment_status.toLowerCase();
                
                row.innerHTML = 
                    '<td>' + payment.payment_id + '</td>' +
                    '<td>' + (payment.guest_name || 'N/A') + '</td>' +
                    '<td>$' + parseFloat(payment.amount).toFixed(2) + '</td>' +
                    '<td>' + payment.payment_method + '</td>' +
                    '<td><span class="' + statusClass + '">' + payment.payment_status + '</span></td>' +
                    '<td>' + new Date(payment.payment_date).toLocaleDateString() + '</td>' +
                    '<td>' + new Date(payment.check_in_date).toLocaleDateString() + '</td>' +
                    '<td>' + new Date(payment.check_out_date).toLocaleDateString() + '</td>';
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading payments:', error);
        showError('Failed to load payments');
    }
    hideLoading();
}

async function loadReservationsForPayment() {
    try {
        const response = await fetch(API_BASE + '/reservations');
        const data = await response.json();
        
        const select = document.getElementById('payment_reservation_id');
        if (select) {
            select.innerHTML = '<option value="">Select Reservation</option>';
            data.filter(res => res.status !== 'Cancelled').forEach(reservation => {
                const option = document.createElement('option');
                option.value = reservation.reservation_id;
                option.textContent = '#' + reservation.reservation_id + ' - ' + reservation.guest_name + ' - $' + reservation.total_amount;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading reservations for payment:', error);
    }
}

function showAddPaymentForm() {
    const form = document.getElementById('add-payment-form');
    if (form) {
        form.style.display = 'block';
        loadReservationsForPayment();
    }
}

function hideAddPaymentForm() {
    const form = document.getElementById('add-payment-form');
    if (form) {
        form.style.display = 'none';
    }
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        paymentForm.reset();
    }
}

// Reports Functions
async function getRevenueReport() {
    const startDate = document.getElementById('revenue-start');
    const endDate = document.getElementById('revenue-end');
    
    if (!startDate || !endDate || !startDate.value || !endDate.value) {
        showError('Please select both start and end dates');
        return;
    }
    
    if (new Date(startDate.value) > new Date(endDate.value)) {
        showError('Start date must be before end date');
        return;
    }
    
    showLoading();
    try {
        const response = await fetch(API_BASE + '/reports/revenue?start_date=' + startDate.value + '&end_date=' + endDate.value);
        const data = await response.json();
        
        const resultDiv = document.getElementById('revenue-result');
        if (resultDiv) {
            resultDiv.innerHTML = 
                '<div class="report-result">' +
                    '<h4>💰 Total Revenue: $' + parseFloat(data.total_revenue || 0).toFixed(2) + '</h4>' +
                    '<p><strong>Period:</strong> ' + new Date(startDate.value).toLocaleDateString() + ' to ' + new Date(endDate.value).toLocaleDateString() + '</p>' +
                '</div>';
        }
    } catch (error) {
        console.error('Error getting revenue report:', error);
        showError('Failed to generate revenue report');
    }
    hideLoading();
}

async function getOccupancyReport() {
    const hotelId = document.getElementById('occupancy-hotel');
    const date = document.getElementById('occupancy-date');
    
    if (!hotelId || !date || !hotelId.value || !date.value) {
        showError('Please enter hotel ID and select date');
        return;
    }
    
    showLoading();
    try {
        const response = await fetch(API_BASE + '/reports/occupancy?hotel_id=' + hotelId.value + '&date=' + date.value);
        const data = await response.json();
        
        const resultDiv = document.getElementById('occupancy-result');
        if (resultDiv) {
            resultDiv.innerHTML = 
                '<div class="report-result">' +
                    '<h4>🏨 Occupancy Rate: ' + parseFloat(data.occupancy_rate || 0).toFixed(1) + '%</h4>' +
                    '<p><strong>Hotel ID:</strong> ' + hotelId.value + ' on ' + new Date(date.value).toLocaleDateString() + '</p>' +
                '</div>';
        }
    } catch (error) {
        console.error('Error getting occupancy report:', error);
        showError('Failed to generate occupancy report');
    }
    hideLoading();
}

async function getDailyRevenue() {
    showLoading();
    try {
        const response = await fetch(API_BASE + '/reports/daily-revenue');
        const data = await response.json();
        
        let html = '<div class="report-result"><h4>📅 Recent Daily Revenue</h4>';
        
        if (data.length === 0) {
            html += '<p>No revenue data available</p>';
        } else {
            html += '<table class="report-table"><thead><tr><th>Date</th><th>Hotel</th><th>Bookings</th><th>Revenue</th></tr></thead><tbody>';
            
            data.forEach(row => {
                html += 
                    '<tr>' +
                        '<td>' + new Date(row.revenue_date).toLocaleDateString() + '</td>' +
                        '<td>' + row.hotel_name + '</td>' +
                        '<td>' + row.total_bookings + '</td>' +
                        '<td>$' + parseFloat(row.daily_revenue).toFixed(2) + '</td>' +
                    '</tr>';
            });
            
            html += '</tbody></table>';
        }
        
        html += '</div>';
        const resultDiv = document.getElementById('daily-revenue-result');
        if (resultDiv) {
            resultDiv.innerHTML = html;
        }
    } catch (error) {
        console.error('Error getting daily revenue:', error);
        showError('Failed to load daily revenue report');
    }
    hideLoading();
}

// Complex Query Functions
async function loadGuestsReservations() {
    showLoading();
    try {
        const response = await fetch(API_BASE + '/queries/guests-reservations');
        const data = await response.json();
        
        let html = '<div class="report-result"><h4>👥 Guests & Reservations (LEFT OUTER JOIN)</h4>';
        html += '<table class="report-table"><thead><tr><th>Guest</th><th>Email</th><th>Reservation ID</th><th>Check-in</th><th>Amount</th></tr></thead><tbody>';
        
        data.forEach(row => {
            html += 
                '<tr>' +
                    '<td>' + row.first_name + ' ' + row.last_name + '</td>' +
                    '<td>' + row.email + '</td>' +
                    '<td>' + (row.reservation_id || 'No reservations') + '</td>' +
                    '<td>' + (row.check_in_date ? new Date(row.check_in_date).toLocaleDateString() : '-') + '</td>' +
                    '<td>' + (row.total_amount ? '$' + parseFloat(row.total_amount).toFixed(2) : '-') + '</td>' +
                '</tr>';
        });
        
        html += '</tbody></table></div>';
        const resultDiv = document.getElementById('complex-query-result');
        if (resultDiv) {
            resultDiv.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading guests-reservations query:', error);
        showError('Failed to load guests-reservations data');
    }
    hideLoading();
}

async function loadReservationsGuests() {
    showLoading();
    try {
        const response = await fetch(API_BASE + '/queries/reservations-guests');
        const data = await response.json();
        
        let html = '<div class="report-result"><h4>📅 All Reservations (RIGHT OUTER JOIN)</h4>';
        html += '<table class="report-table"><thead><tr><th>Guest</th><th>Email</th><th>Reservation ID</th><th>Check-in</th><th>Status</th></tr></thead><tbody>';
        
        data.forEach(row => {
            const statusClass = 'status-' + row.status.toLowerCase().replace(/\s+/g, '-');
            html += 
                '<tr>' +
                    '<td>' + (row.first_name ? row.first_name + ' ' + row.last_name : 'Unknown Guest') + '</td>' +
                    '<td>' + (row.email || 'N/A') + '</td>' +
                    '<td>' + row.reservation_id + '</td>' +
                    '<td>' + new Date(row.check_in_date).toLocaleDateString() + '</td>' +
                    '<td><span class="' + statusClass + '">' + row.status + '</span></td>' +
                '</tr>';
        });
        
        html += '</tbody></table></div>';
        const resultDiv = document.getElementById('complex-query-result');
        if (resultDiv) {
            resultDiv.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading reservations-guests query:', error);
        showError('Failed to load reservations-guests data');
    }
    hideLoading();
}

async function loadStaffServices() {
    showLoading();
    try {
        const response = await fetch(API_BASE + '/queries/staff-services');
        const data = await response.json();
        
        let html = '<div class="report-result"><h4>👨‍💼 Staff & Services (FULL OUTER JOIN)</h4>';
        html += '<table class="report-table"><thead><tr><th>Staff</th><th>Department</th><th>Request ID</th><th>Service</th><th>Status</th></tr></thead><tbody>';
        
        data.forEach(row => {
            let statusHtml = '-';
            if (row.request_status) {
                const statusClass = 'status-' + row.request_status.toLowerCase();
                statusHtml = '<span class="' + statusClass + '">' + row.request_status + '</span>';
            }
            
            html += 
                '<tr>' +
                    '<td>' + (row.first_name ? row.first_name + ' ' + row.last_name : 'No Staff') + '</td>' +
                    '<td>' + (row.department || 'N/A') + '</td>' +
                    '<td>' + (row.request_id || 'No requests') + '</td>' +
                    '<td>' + (row.service_name || 'N/A') + '</td>' +
                    '<td>' + statusHtml + '</td>' +
                '</tr>';
        });
        
        html += '</tbody></table></div>';
        const resultDiv = document.getElementById('complex-query-result');
        if (resultDiv) {
            resultDiv.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading staff-services query:', error);
        showError('Failed to load staff-services data');
    }
    hideLoading();
}

// Security Module Functions
async function loadAuditLog() {
    const auditResult = document.getElementById('audit-log-result');
    if (auditResult) {
        auditResult.innerHTML = '<div class="loading">Loading audit log...</div>';
    }
    
    setTimeout(() => {
        const auditData = [
            { timestamp: '2024-06-18 14:30:15', user: 'sarah_frontdesk', operation: 'INSERT', table: 'guests', details: 'Added new guest: John Doe' },
            { timestamp: '2024-06-18 14:25:42', user: 'mike_housekeeping', operation: 'UPDATE', table: 'rooms', details: 'Changed room 101 status to Maintenance' },
            { timestamp: '2024-06-18 14:20:18', user: 'anna_finance', operation: 'SELECT', table: 'payments', details: 'Generated revenue report' },
            { timestamp: '2024-06-18 14:15:33', user: 'john_manager', operation: 'UPDATE', table: 'staff', details: 'Updated staff salary' },
            { timestamp: '2024-06-18 14:10:55', user: 'tom_services', operation: 'INSERT', table: 'service_requests', details: 'Added room service request' }
        ];
        
        let html = '<div class="audit-entries"><h4>Recent Database Activities</h4>';
        auditData.forEach(entry => {
            html += 
                '<div class="audit-entry">' +
                    '<div class="audit-time">' + entry.timestamp + '</div>' +
                    '<div class="audit-user"><strong>' + entry.user + '</strong></div>' +
                    '<div class="audit-action">' + entry.operation + ' on ' + entry.table + '</div>' +
                    '<div class="audit-details">' + entry.details + '</div>' +
                '</div>';
        });
        html += '</div>';
        
        if (auditResult) {
            auditResult.innerHTML = html;
        }
        
        const auditCount = document.getElementById('audit-count');
        if (auditCount) {
            auditCount.textContent = auditData.length;
        }
    }, 1000);
}

function testPermission() {
    const roleSelect = document.getElementById('test-role');
    const operationSelect = document.getElementById('test-operation');
    const resultDiv = document.getElementById('permission-result');
    
    if (!roleSelect || !operationSelect || !resultDiv) {
        return;
    }
    
    const role = roleSelect.value;
    const operation = operationSelect.value;
    
    const permissions = {
        'hotel_manager': ['view_guests', 'edit_guests', 'view_payments', 'edit_payments', 'view_reports', 'manage_rooms'],
        'front_desk_agent': ['view_guests', 'edit_guests', 'view_payments', 'view_reports'],
        'housekeeping_staff': ['manage_rooms', 'view_reports'],
        'finance_staff': ['view_guests', 'view_payments', 'edit_payments', 'view_reports'],
        'guest_services': ['view_guests', 'view_reports'],
        'auditor': ['view_guests', 'view_payments', 'view_reports']
    };
    
    const hasPermission = permissions[role] && permissions[role].includes(operation);
    
    if (hasPermission) {
        resultDiv.innerHTML = '✅ <strong>ALLOWED:</strong> ' + role + ' can perform ' + operation.replace('_', ' ');
        resultDiv.className = 'permission-allowed';
    } else {
        resultDiv.innerHTML = '❌ <strong>DENIED:</strong> ' + role + ' cannot perform ' + operation.replace('_', ' ');
        resultDiv.className = 'permission-denied';
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏨 Hotel Management System loaded successfully!');
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    // Set default values for date inputs
    const checkinInput = document.getElementById('search-checkin');
    const checkoutInput = document.getElementById('search-checkout');
    const revenueStart = document.getElementById('revenue-start');
    const revenueEnd = document.getElementById('revenue-end');
    const occupancyDate = document.getElementById('occupancy-date');
    
    if (checkinInput) checkinInput.value = today;
    if (checkoutInput) checkoutInput.value = tomorrow;
    if (revenueStart) revenueStart.value = today;
    if (revenueEnd) revenueEnd.value = today;
    if (occupancyDate) occupancyDate.value = today;

    // Guest form handler
    const guestForm = document.getElementById('guest-form');
    if (guestForm) {
        guestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const guestId = guestForm.getAttribute('data-guest-id');
            const isUpdate = !!guestId;
            
            const formData = {
                first_name: document.getElementById('first_name').value,
                last_name: document.getElementById('last_name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value || null,
                city: document.getElementById('city').value || null,
                state: document.getElementById('state').value || null,
                zip_code: document.getElementById('zip_code').value || null,
                date_of_birth: document.getElementById('date_of_birth').value || null,
                id_number: document.getElementById('id_number').value || null,
                nationality: document.getElementById('nationality').value || null
            };
            
            showLoading();
            try {
                const url = isUpdate ? API_BASE + '/guests/' + guestId : API_BASE + '/guests';
                const method = isUpdate ? 'PUT' : 'POST';
                
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    showSuccess('Guest ' + (isUpdate ? 'updated' : 'added') + ' successfully!');
                    hideAddGuestForm();
                    loadGuests();
                } else {
                    const error = await response.json();
                    showError(error.error || 'Failed to ' + (isUpdate ? 'update' : 'add') + ' guest');
                }
            } catch (error) {
                console.error('Error ' + (isUpdate ? 'updating' : 'adding') + ' guest:', error);
                showError('Failed to ' + (isUpdate ? 'update' : 'add') + ' guest. Check your connection.');
            }
            hideLoading();
        });
    }

    // Enhanced reservation form submission
    const reservationForm = document.getElementById('reservation-form');
    if (reservationForm) {
        reservationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Validate form data
            const formData = {
                guest_id: document.getElementById('guest_id').value,
                room_id: document.getElementById('selected_room_id').value,
                check_in_date: document.getElementById('check_in_date').value,
                check_out_date: document.getElementById('check_out_date').value,
                adults: parseInt(document.getElementById('adults').value),
                children: parseInt(document.getElementById('children').value),
                total_amount: parseFloat(document.getElementById('total_amount_input').value),
                special_requests: document.getElementById('special_requests').value
            };
            
            // Validation
            if (!formData.guest_id) {
                showError('Please select a guest');
                return;
            }
            
            if (!formData.room_id) {
                showError('Please select a room');
                return;
            }
            
            if (!formData.check_in_date || !formData.check_out_date) {
                showError('Please select check-in and check-out dates');
                return;
            }
            
            if (new Date(formData.check_in_date) >= new Date(formData.check_out_date)) {
                showError('Check-out date must be after check-in date');
                return;
            }
            
            if (!formData.total_amount || formData.total_amount <= 0) {
                showError('Invalid total amount. Please select a room.');
                return;
            }
            
            if (formData.adults < 1) {
                showError('At least 1 adult is required');
                return;
            }
            
            // Check room capacity
            if (selectedRoomData && (formData.adults + formData.children) > selectedRoomData.max_occupancy) {
                showError(`Room capacity exceeded! Maximum ${selectedRoomData.max_occupancy} guests allowed.`);
                return;
            }
            
            showLoading();
            try {
                const response = await fetch(`${API_BASE}/reservations`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    const newReservation = await response.json();
                    
                    // Show success message with details
                    const nights = Math.ceil((new Date(formData.check_out_date) - new Date(formData.check_in_date)) / (1000 * 60 * 60 * 24));
                    const successMessage = `
                        🎉 Reservation Created Successfully!
                        
                        📋 Reservation ID: ${newReservation.reservation_id}
                        🏠 Room: ${selectedRoomData.room_number} (${selectedRoomData.type_name})
                        📅 ${nights} night(s): ${new Date(formData.check_in_date).toLocaleDateString()} - ${new Date(formData.check_out_date).toLocaleDateString()}
                        👥 ${formData.adults} adult(s), ${formData.children} child(ren)
                        💰 Total: $${formData.total_amount}
                    `;
                    
                    showSuccess(successMessage);
                    hideAddReservationForm();
                    loadReservations();
                    
                    // Add visual feedback to form sections
                    document.querySelectorAll('.form-section').forEach(section => {
                        section.classList.add('completed');
                    });
                    
                } else {
                    const error = await response.json();
                    showError(error.error || 'Failed to create reservation');
                }
            } catch (error) {
                console.error('Error creating reservation:', error);
                showError('Failed to create reservation. Please check your connection and try again.');
            }
            hideLoading();
        });
    }
    
    // Add real-time validation for dates
    const checkInInput = document.getElementById('check_in_date');
    const checkOutInput = document.getElementById('check_out_date');
    
    if (checkInInput) {
        checkInInput.addEventListener('change', function() {
            const today = new Date().toISOString().split('T')[0];
            if (this.value < today) {
                showError('Check-in date cannot be in the past');
                this.value = today;
            }
            
            // Auto-update check-out if needed
            const checkOut = document.getElementById('check_out_date').value;
            if (checkOut && this.value >= checkOut) {
                const nextDay = new Date(this.value);
                nextDay.setDate(nextDay.getDate() + 1);
                document.getElementById('check_out_date').value = nextDay.toISOString().split('T')[0];
            }
            
            updateRoomList();
        });
    }
    
    if (checkOutInput) {
        checkOutInput.addEventListener('change', function() {
            const checkIn = document.getElementById('check_in_date').value;
            if (checkIn && this.value <= checkIn) {
                showError('Check-out date must be after check-in date');
                const nextDay = new Date(checkIn);
                nextDay.setDate(nextDay.getDate() + 1);
                this.value = nextDay.toISOString().split('T')[0];
            }
            
            updateRoomList();
        });
    }
    
    // Add guest count validation
    const adultsInput = document.getElementById('adults');
    const childrenInput = document.getElementById('children');
    
    if (adultsInput) {
        adultsInput.addEventListener('change', function() {
            if (this.value < 1) {
                this.value = 1;
                showError('At least 1 adult is required');
            }
            validateGuestCount();
        });
    }
    
    if (childrenInput) {
        childrenInput.addEventListener('change', function() {
            if (this.value < 0) {
                this.value = 0;
            }
            validateGuestCount();
        });
    }
});

// Validate guest count against room capacity
function validateGuestCount() {
    if (!selectedRoomData) return;
    
    const adults = parseInt(document.getElementById('adults').value) || 0;
    const children = parseInt(document.getElementById('children').value) || 0;
    const totalGuests = adults + children;
    
    if (totalGuests > selectedRoomData.max_occupancy) {
        showError(`Room capacity exceeded! Maximum ${selectedRoomData.max_occupancy} guests allowed for ${selectedRoomData.type_name}.`);
        
        // Auto-adjust to maximum capacity
        if (adults > selectedRoomData.max_occupancy) {
            document.getElementById('adults').value = selectedRoomData.max_occupancy;
            document.getElementById('children').value = 0;
        } else {
            document.getElementById('children').value = selectedRoomData.max_occupancy - adults;
        }
    }
}

// Enhanced success message display
function showEnhancedSuccess(title, details) {
    // Create a better success modal instead of simple alert
    const successDiv = document.createElement('div');
    successDiv.className = 'success-modal';
    successDiv.innerHTML = `
        <div class="success-content">
            <h3>${title}</h3>
            <div class="success-details">${details}</div>
            <button onclick="this.parentElement.parentElement.remove()" class="btn btn-primary">OK</button>
        </div>
    `;
    
    document.body.appendChild(successDiv);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (successDiv.parentElement) {
            successDiv.remove();
        }
    }, 10000);
}