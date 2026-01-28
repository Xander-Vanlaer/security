// API Configuration
// Use window.location.host to determine the API URL dynamically
const API_BASE_URL = `http://${window.location.hostname}:8000`;

// Fetch hospitals and display them in the dashboard columns
async function loadHospitals() {
    try {
        console.log('Fetching hospitals from:', API_BASE_URL);
        const response = await fetch(`${API_BASE_URL}/hospitals`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const hospitals = await response.json();
        console.log('Hospitals loaded:', hospitals);
        displayHospitals(hospitals);
    } catch (error) {
        console.error('Error loading hospitals:', error);
        displayError('Failed to load hospital data');
    }
}

// Display hospitals in the dashboard columns
function displayHospitals(hospitals) {
    const columns = [
        document.getElementById('column-1'),
        document.getElementById('column-2'),
        document.getElementById('column-3'),
        document.getElementById('column-4'),
        document.getElementById('column-5'),
        document.getElementById('column-6')
    ];

    // Clear all loading states
    columns.forEach(column => {
        if (column) {
            const card = column.querySelector('.hospital-card');
            if (card) {
                card.innerHTML = '';
            }
        }
    });

    // Display hospitals in their columns
    hospitals.forEach((hospital, index) => {
        if (index < columns.length && columns[index]) {
            const card = columns[index].querySelector('.hospital-card');
            if (card) {
                card.innerHTML = createHospitalCard(hospital);
            }
        }
    });

    // Show message if fewer hospitals than columns
    if (hospitals.length < columns.length) {
        for (let i = hospitals.length; i < columns.length; i++) {
            const card = columns[i].querySelector('.hospital-card');
            if (card) {
                card.innerHTML = '<p class="empty-state">No hospital data</p>';
            }
        }
    }
}

// Create HTML for a hospital card
function createHospitalCard(hospital) {
    const phone = hospital.phone ? `<p><strong>Phone:</strong> ${hospital.phone}</p>` : '';
    const email = hospital.email ? `<p><strong>Email:</strong> ${hospital.email}</p>` : '';
    const address = hospital.address ? `<p><strong>Address:</strong> ${hospital.address}</p>` : '';
    const city = hospital.city ? `${hospital.city}${hospital.state ? ', ' + hospital.state : ''}` : '';
    const location = city || hospital.zip_code ? `<p><strong>Location:</strong> ${city}${hospital.zip_code ? ' ' + hospital.zip_code : ''}</p>` : '';

    return `
        <div class="hospital-info">
            <h3>${hospital.name}</h3>
            ${address}
            ${location}
            ${phone}
            ${email}
            <div class="hospital-footer">
                <small>ID: ${hospital.id}</small>
            </div>
        </div>
    `;
}

// Display error message
function displayError(message) {
    const columns = document.querySelectorAll('.hospital-card');
    columns.forEach(card => {
        card.innerHTML = `<p class="error">${message}</p>`;
    });
}

// Fetch water data for a specific hospital
async function getWaterDataByHospital(hospitalId) {
    try {
        const response = await fetch(`${API_BASE_URL}/waterdata?hospital_id=${hospitalId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error loading water data:', error);
        return [];
    }
}

// Fetch hospital details
async function getHospitalDetails(hospitalId) {
    try {
        const response = await fetch(`${API_BASE_URL}/hospitals/${hospitalId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const hospital = await response.json();
        return hospital;
    } catch (error) {
        console.error('Error loading hospital details:', error);
        return null;
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadHospitals();
    setupFormHandler();
    
    // Refresh hospitals every 30 seconds
    setInterval(loadHospitals, 30000);
});

// Setup form submission handler
function setupFormHandler() {
    const form = document.getElementById('hospitalForm');
    if (form) {
        form.addEventListener('submit', handleHospitalFormSubmit);
    }
}

// Handle hospital form submission
async function handleHospitalFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('.btn-submit');
    const originalButtonText = submitButton.textContent;
    
    // Collect form data
    const hospitalData = {
        name: document.getElementById('hospitalName').value,
        phone: document.getElementById('hospitalPhone').value || null,
        email: document.getElementById('hospitalEmail').value || null,
        address: document.getElementById('hospitalAddress').value || null,
        city: document.getElementById('hospitalCity').value || null,
        state: document.getElementById('hospitalState').value || null,
        zip_code: document.getElementById('hospitalZip').value || null
    };

    // Validate hospital name
    if (!hospitalData.name.trim()) {
        showFormMessage('Please enter a hospital name', 'error');
        return;
    }

    try {
        // Disable button and show loading state
        submitButton.disabled = true;
        submitButton.textContent = '⏳ Creating...';

        const response = await fetch(`${API_BASE_URL}/hospitals`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(hospitalData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Hospital created:', result);
        showFormMessage(`✓ Hospital "${hospitalData.name}" created successfully!`, 'success');
        
        // Clear form
        form.reset();
        
        // Reload hospitals and scroll to dashboard after a longer delay
        setTimeout(() => {
            console.log('Reloading hospitals...');
            loadHospitals();
            scrollToDashboard();
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }, 1500);
    } catch (error) {
        console.error('Error adding hospital:', error);
        showFormMessage(`✗ Error: ${error.message}`, 'error');
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}

// Show form message
function showFormMessage(message, type) {
    const messageDiv = document.getElementById('formMessage');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `form-message ${type}`;
        
        // Clear message after 5 seconds
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = 'form-message';
        }, 5000);
    }
}

// Scroll to dashboard overview
function scrollToDashboard() {
    const dashboardSection = document.querySelector('.row');
    if (dashboardSection) {
        dashboardSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}
