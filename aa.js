// Enhanced Reservation Form Submission Handler
document.addEventListener('DOMContentLoaded', function() {
    // Existing code...
    
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