// app.js - Frontend JavaScript for Hotel Management System

// API Base URL - Make sure this matches your backend server
const API_BASE = 'http://localhost:3000/api';

// Global variables
let currentModule = null;
let guests = [];
let rooms = [];
let reservations = [];

// Utility Functions
function showLoading() {
    document.getElementById('loading-overlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

function showError(message) {
    alert('Error: ' + message);
}

function showSuccess(message) {
    alert('Success: ' + message);
}

// Navigation Functions
function showModule(moduleName) {
    // Hide all modules
    document.querySelectorAll('.module').forEach(module => {
        module.style.display = 'none';
    });
    
    // Hide welcome message
    document.getElementById('main-content').style.display = 'none';
    
    // Show selected module
    document.getElementById(`${moduleName}-module`).style.display = 'block';
    
    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
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
    }
}

// Guest Management Functions
async function loadGuests() {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/guests`);
        const data = await response.json();
        guests = data;
        
        const tbody = document.querySelector('#guests-table tbody');
        tbody.innerHTML = '';
        
        data.forEach(guest => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${guest.guest_name || 'N/A'}</td>
                <td>${guest.email || 'N/A'}</td>
                <td>${guest.phone || 'N/A'}</td>
                <td>${guest.total_reservations || 0}</td>
                <td>$${parseFloat(guest.total_spent || 0).toFixed(2)}</td>
                <td>${guest.loyalty_points || 0}</td>
                <td>
                    <button onclick="editGuest(${guest.guest_id})" class="btn btn-warning" style="margin-right: 5px;">✏️ Edit</button>
                    <button onclick="deleteGuest(${guest.guest_id})" class="btn btn-danger">🗑️ Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading guests:', error);
        showError('Failed to load guests. Make sure the backend server is running.');
    }
    hideLoading();
}

function showAddGuestForm() {
    document.getElementById('add-guest-form').style.display = 'block';
}

function hideAddGuestForm() {
    document.getElementById('add-guest-form').style.display = 'none';
    const form = document.getElementById('guest-form');
    form.reset();
    form.removeAttribute('data-guest-id');
    form.querySelector('button[type="submit"]').textContent = '💾 Add Guest';
}

// Edit guest function
async function editGuest(guestId) {
    try {
        // Get guest details
        const response = await fetch(`${API_BASE}/guests/${guestId}`);
        const guest = await response.json();
        
        // Fill the form with existing data
        document.getElementById('first_name').value = guest.first_name || '';
        document.getElementById('last_name').value = guest.last_name || '';
        document.getElementById('email').value = guest.email || '';
        document.getElementById('phone').value = guest.phone || '';
        document.getElementById('address').value = guest.address || '';
        document.getElementById('city').value = guest.city || '';
        document.getElementById('state').value = guest.state || '';
        document.getElementById('zip_code').value = guest.zip_code || '';
        document.getElementById('date_of_birth').value = guest.date_of_birth || '';
        document.getElementById('id_number').value = guest.id_number || '';
        document.getElementById('nationality').value = guest.nationality || '';
        
        // Show the form
        document.getElementById('add-guest-form').style.display = 'block';
        
        // Change form behavior to update instead of create
        const form = document.getElementById('guest-form');
        form.setAttribute('data-guest-id', guestId);
        form.querySelector('button[type="submit"]').textContent = '💾 Update Guest';
        
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
        const response = await fetch(`${API_BASE}/guests/${guestId}`, {
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

// Guest form submission
// Update the guest form submission handler
document.addEventListener('DOMContentLoaded', function() {
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
                const url = isUpdate ? `${API_BASE}/guests/${guestId}` : `${API_BASE}/guests`;
                const method = isUpdate ? 'PUT' : 'POST';
                
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    showSuccess(`Guest ${isUpdate ? 'updated' : 'added'} successfully!`);
                    hideAddGuestForm();
                    loadGuests();
                } else {
                    const error = await response.json();
                    showError(error.error || `Failed to ${isUpdate ? 'update' : 'add'} guest`);
                }
            } catch (error) {
                console.error(`Error ${isUpdate ? 'updating' : 'adding'} guest:`, error);
                showError(`Failed to ${isUpdate ? 'update' : 'add'} guest. Check your connection.`);
            }
            hideLoading();
        });
    }
});

// Room Management Functions
async function loadRooms() {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/rooms`);
        const data = await response.json();
        rooms = data;
        
        const tbody = document.querySelector('#rooms-table tbody');
        tbody.innerHTML = '';
        
        data.forEach(room => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${room.hotel_name || 'N/A'}</td>
                <td>${room.room_number || 'N/A'}</td>
                <td>${room.type_name || 'N/A'}</td>
                <td>$${parseFloat(room.base_price || 0).toFixed(2)}</td>
                <td><span class="status-${(room.status || '').toLowerCase().replace(/\s+/g, '-')}">${room.status || 'Unknown'}</span></td>
                <td>${room.floor_number || 'N/A'}</td>
                <td>${room.available_from ? new Date(room.available_from).toLocaleDateString() : 'Available Now'}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading rooms:', error);
        showError('Failed to load rooms');
    }
    hideLoading();
}

async function searchAvailableRooms() {
    const checkin = document.getElementById('search-checkin').value;
    const checkout = document.getElementById('search-checkout').value;
    
    if (!checkin || !checkout) {
        showError('Please select both check-in and check-out dates');
        return;
    }
    
    if (new Date(checkin) >= new Date(checkout)) {
        showError('Check-out date must be after check-in date');
        return;
    }
    
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/rooms/available?check_in=${checkin}&check_out=${checkout}`);
        const data = await response.json();
        
        const tbody = document.querySelector('#rooms-table tbody');
        tbody.innerHTML = '';
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No available rooms found for selected dates</td></tr>';
        } else {
            data.forEach(room => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>Available Room</td>
                    <td>${room.room_number}</td>
                    <td>${room.type_name}</td>
                    <td>$${parseFloat(room.base_price).toFixed(2)}</td>
                    <td><span class="status-available">Available</span></td>
                    <td>-</td>
                    <td>${checkin}</td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error searching rooms:', error);
        showError('Failed to search available rooms');
    }
    hideLoading();
}

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
            select.innerHTML = '<option value="">Select Guest</option>';
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
        const response = await fetch(`${API_BASE}/rooms/available?check_in=${new Date().toISOString().split('T')[0]}&check_out=${new Date(Date.now() + 86400000).toISOString().split('T')[0]}`);
        const data = await response.json();
        
        const select = document.getElementById('room_id');
        if (select) {
            select.innerHTML = '<option value="">Select Room</option>';
            data.forEach(room => {
                const option = document.createElement('option');
                option.value = room.room_id;
                option.textContent = `Room ${room.room_number} - ${room.type_name} ($${room.base_price})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading rooms for reservation:', error);
    }
}

function showAddReservationForm() {
    document.getElementById('add-reservation-form').style.display = 'block';
    loadGuestsForReservation();
    loadRoomsForReservation();
}

function hideAddReservationForm() {
    document.getElementById('add-reservation-form').style.display = 'none';
    document.getElementById('reservation-form').reset();
}

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
        const response = await fetch(`${API_BASE}/payments`);
        const data = await response.json();
        
        const tbody = document.querySelector('#payments-table tbody');
        tbody.innerHTML = '';
        
        data.forEach(payment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${payment.payment_id}</td>
                <td>${payment.guest_name || 'N/A'}</td>
                <td>$${parseFloat(payment.amount).toFixed(2)}</td>
                <td>${payment.payment_method}</td>
                <td><span class="status-${payment.payment_status.toLowerCase()}">${payment.payment_status}</span></td>
                <td>${new Date(payment.payment_date).toLocaleDateString()}</td>
                <td>${new Date(payment.check_in_date).toLocaleDateString()}</td>
                <td>${new Date(payment.check_out_date).toLocaleDateString()}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading payments:', error);
        showError('Failed to load payments');
    }
    hideLoading();
}

async function loadReservationsForPayment() {
    try {
        const response = await fetch(`${API_BASE}/reservations`);
        const data = await response.json();
        
        const select = document.getElementById('payment_reservation_id');
        if (select) {
            select.innerHTML = '<option value="">Select Reservation</option>';
            data.filter(res => res.status !== 'Cancelled').forEach(reservation => {
                const option = document.createElement('option');
                option.value = reservation.reservation_id;
                option.textContent = `#${reservation.reservation_id} - ${reservation.guest_name} - $${reservation.total_amount}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading reservations for payment:', error);
    }
}

function showAddPaymentForm() {
    document.getElementById('add-payment-form').style.display = 'block';
    loadReservationsForPayment();
}

function hideAddPaymentForm() {
    document.getElementById('add-payment-form').style.display = 'none';
    document.getElementById('payment-form').reset();
}

// Reports Functions
async function getRevenueReport() {
    const startDate = document.getElementById('revenue-start').value;
    const endDate = document.getElementById('revenue-end').value;
    
    if (!startDate || !endDate) {
        showError('Please select both start and end dates');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        showError('Start date must be before end date');
        return;
    }
    
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/reports/revenue?start_date=${startDate}&end_date=${endDate}`);
        const data = await response.json();
        
        document.getElementById('revenue-result').innerHTML = `
            <div class="report-result">
                <h4>💰 Total Revenue: $${parseFloat(data.total_revenue || 0).toFixed(2)}</h4>
                <p><strong>Period:</strong> ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}</p>
            </div>
        `;
    } catch (error) {
        console.error('Error getting revenue report:', error);
        showError('Failed to generate revenue report');
    }
    hideLoading();
}

async function getOccupancyReport() {
    const hotelId = document.getElementById('occupancy-hotel').value;
    const date = document.getElementById('occupancy-date').value;
    
    if (!hotelId || !date) {
        showError('Please enter hotel ID and select date');
        return;
    }
    
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/reports/occupancy?hotel_id=${hotelId}&date=${date}`);
        const data = await response.json();
        
        document.getElementById('occupancy-result').innerHTML = `
            <div class="report-result">
                <h4>🏨 Occupancy Rate: ${parseFloat(data.occupancy_rate || 0).toFixed(1)}%</h4>
                <p><strong>Hotel ID:</strong> ${hotelId} on ${new Date(date).toLocaleDateString()}</p>
            </div>
        `;
    } catch (error) {
        console.error('Error getting occupancy report:', error);
        showError('Failed to generate occupancy report');
    }
    hideLoading();
}

async function getDailyRevenue() {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/reports/daily-revenue`);
        const data = await response.json();
        
        let html = '<div class="report-result"><h4>📅 Recent Daily Revenue</h4>';
        
        if (data.length === 0) {
            html += '<p>No revenue data available</p>';
        } else {
            html += '<table class="report-table"><thead><tr><th>Date</th><th>Hotel</th><th>Bookings</th><th>Revenue</th></tr></thead><tbody>';
            
            data.forEach(row => {
                html += `
                    <tr>
                        <td>${new Date(row.revenue_date).toLocaleDateString()}</td>
                        <td>${row.hotel_name}</td>
                        <td>${row.total_bookings}</td>
                        <td>$${parseFloat(row.daily_revenue).toFixed(2)}</td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
        }
        
        html += '</div>';
        document.getElementById('daily-revenue-result').innerHTML = html;
    } catch (error) {
        console.error('Error getting daily revenue:', error);
        showError('Failed to load daily revenue report');
    }
    hideLoading();
}

// Complex Query Functions (LEFT, RIGHT, FULL OUTER JOIN)
async function loadGuestsReservations() {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/queries/guests-reservations`);
        const data = await response.json();
        
        let html = '<div class="report-result"><h4>👥 Guests & Reservations (LEFT OUTER JOIN)</h4>';
        html += '<table class="report-table"><thead><tr><th>Guest</th><th>Email</th><th>Reservation ID</th><th>Check-in</th><th>Amount</th></tr></thead><tbody>';
        
        data.forEach(row => {
            html += `
                <tr>
                    <td>${row.first_name} ${row.last_name}</td>
                    <td>${row.email}</td>
                    <td>${row.reservation_id || 'No reservations'}</td>
                    <td>${row.check_in_date ? new Date(row.check_in_date).toLocaleDateString() : '-'}</td>
                    <td>${row.total_amount ? '$' + parseFloat(row.total_amount).toFixed(2) : '-'}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        document.getElementById('complex-query-result').innerHTML = html;
    } catch (error) {
        console.error('Error loading guests-reservations query:', error);
        showError('Failed to load guests-reservations data');
    }
    hideLoading();
}

async function loadReservationsGuests() {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/queries/reservations-guests`);
        const data = await response.json();
        
        let html = '<div class="report-result"><h4>📅 All Reservations (RIGHT OUTER JOIN)</h4>';
        html += '<table class="report-table"><thead><tr><th>Guest</th><th>Email</th><th>Reservation ID</th><th>Check-in</th><th>Status</th></tr></thead><tbody>';
        
        data.forEach(row => {
            html += `
                <tr>
                    <td>${row.first_name ? row.first_name + ' ' + row.last_name : 'Unknown Guest'}</td>
                    <td>${row.email || 'N/A'}</td>
                    <td>${row.reservation_id}</td>
                    <td>${new Date(row.check_in_date).toLocaleDateString()}</td>
                    <td><span class="status-${row.status.toLowerCase().replace(/\s+/g, '-')}">${row.status}</span></td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        document.getElementById('complex-query-result').innerHTML = html;
    } catch (error) {
        console.error('Error loading reservations-guests query:', error);
        showError('Failed to load reservations-guests data');
    }
    hideLoading();
}

async function loadStaffServices() {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/queries/staff-services`);
        const data = await response.json();
        
        let html = '<div class="report-result"><h4>👨‍💼 Staff & Services (FULL OUTER JOIN)</h4>';
        html += '<table class="report-table"><thead><tr><th>Staff</th><th>Department</th><th>Request ID</th><th>Service</th><th>Status</th></tr></thead><tbody>';
        
        data.forEach(row => {
            html += `
                <tr>
                    <td>${row.first_name ? row.first_name + ' ' + row.last_name : 'No Staff'}</td>
                    <td>${row.department || 'N/A'}</td>
                    <td>${row.request_id || 'No requests'}</td>
                    <td>${row.service_name || 'N/A'}</td>
                    <td>${row.request_status ? '<span class="status-' + row.request_status.toLowerCase() + '">' + row.request_status + '</span>' : '-'}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        document.getElementById('complex-query-result').innerHTML = html;
    } catch (error) {
        console.error('Error loading staff-services query:', error);
        showError('Failed to load staff-services data');
    }
    hideLoading();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏨 Hotel Management System loaded successfully!');
    
    // Set default dates for searches
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    const checkinInput = document.getElementById('search-checkin');
    const checkoutInput = document.getElementById('search-checkout');
    
    if (checkinInput) checkinInput.value = today;
    if (checkoutInput) checkoutInput.value = tomorrow;
    
    // Set default dates for revenue report
    const revenueStart = document.getElementById('revenue-start');
    const revenueEnd = document.getElementById('revenue-end');
    
    if (revenueStart) revenueStart.value = today;
    if (revenueEnd) revenueEnd.value = today;
    
    // Set default date for occupancy
    const occupancyDate = document.getElementById('occupancy-date');
    if (occupancyDate) occupancyDate.value = today;
});