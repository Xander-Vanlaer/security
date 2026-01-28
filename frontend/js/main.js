/**
 * Main dashboard JavaScript - Handles user info, 2FA, and data management
 */

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Load user information
    await loadUserInfo();
    
    // Load dashboard by role
    await loadDashboardByRole();
    
    // Set up event listeners
    setupEventListeners();
});

// Load user information
async function loadUserInfo() {
    try {
        currentUser = await apiClient.request('/api/auth/me');
        
        // Display user info in nav
        const userInfoElement = document.getElementById('user-info');
        const roleName = getRoleName(currentUser.role);
        userInfoElement.textContent = `Welcome, ${currentUser.username} (${roleName})`;
        
        // Display user details
        const userDetailsElement = document.getElementById('user-details');
        userDetailsElement.innerHTML = `
            <p><strong>Username:</strong> ${currentUser.username}</p>
            <p><strong>Email:</strong> ${currentUser.email}</p>
            <p><strong>Role:</strong> ${roleName}</p>
            <p><strong>Member since:</strong> ${new Date(currentUser.created_at).toLocaleDateString()}</p>
            <p><strong>Last login:</strong> ${currentUser.last_login ? new Date(currentUser.last_login).toLocaleString() : 'N/A'}</p>
        `;
        
        // Update 2FA section
        if (currentUser.is_2fa_enabled) {
            document.getElementById('2fa-disabled').style.display = 'none';
            document.getElementById('2fa-enabled').style.display = 'block';
        } else {
            document.getElementById('2fa-disabled').style.display = 'block';
            document.getElementById('2fa-enabled').style.display = 'none';
        }
    } catch (error) {
        console.error('Failed to load user info:', error);
        // If unauthorized, redirect to login
        if (error.message.includes('401')) {
            TokenManager.clearTokens();
            window.location.href = 'login.html';
        }
    }
}

// Get role name from role number
function getRoleName(role) {
    const roles = {
        1: 'Pending',
        2: 'Admin',
        3: 'Region Admin',
        4: 'Hospital User'
    };
    return roles[role] || 'Unknown';
}

// Load dashboard by role
async function loadDashboardByRole() {
    if (!currentUser) return;
    
    // Hide all role-specific sections first
    hideAllRoleSections();
    
    switch(currentUser.role) {
        case 1:
            showPendingUserView();
            break;
        case 2:
            await showAdminDashboard();
            break;
        case 3:
            await showRegionAdminDashboard();
            break;
        case 4:
            await showHospitalDashboard();
            break;
    }
}

// Hide all role-specific sections
function hideAllRoleSections() {
    const sections = [
        'pending-user-section',
        'admin-section',
        'region-admin-section',
        'hospital-user-section',
        'data-management'
    ];
    
    sections.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        }
    });
}

// Show pending user view
function showPendingUserView() {
    const section = document.getElementById('pending-user-section');
    if (section) {
        section.style.display = 'block';
    }
}

// Show admin dashboard
async function showAdminDashboard() {
    const section = document.getElementById('admin-section');
    if (section) {
        section.style.display = 'block';
        await loadAdminStats();
        await loadAdminUsers();
        await loadRegions();
        await loadHospitals();
    }
}

// Show region admin dashboard
async function showRegionAdminDashboard() {
    const section = document.getElementById('region-admin-section');
    if (section) {
        section.style.display = 'block';
        await loadRegionAdminStats();
        await loadRegionUsers();
        await loadRegionHospitals();
        await loadRegionSensorData();
    }
}

// Show hospital user dashboard
async function showHospitalDashboard() {
    const section = document.getElementById('hospital-user-section');
    if (section) {
        section.style.display = 'block';
        await loadHospitalStats();
        await loadHospitalSensorData();
    }
}

// Load admin stats
async function loadAdminStats() {
    try {
        const stats = await apiClient.request('/api/dashboard/stats');
        document.getElementById('admin-stats').innerHTML = `
            <div class="stat-item">
                <h4>Total Users</h4>
                <p class="stat-number">${stats.total_users || 0}</p>
            </div>
            <div class="stat-item">
                <h4>Pending Users</h4>
                <p class="stat-number">${stats.pending_users || 0}</p>
            </div>
            <div class="stat-item">
                <h4>Total Regions</h4>
                <p class="stat-number">${stats.total_regions || 0}</p>
            </div>
            <div class="stat-item">
                <h4>Total Hospitals</h4>
                <p class="stat-number">${stats.total_hospitals || 0}</p>
            </div>
            <div class="stat-item">
                <h4>Sensor Readings</h4>
                <p class="stat-number">${stats.total_sensor_readings || 0}</p>
            </div>
        `;
    } catch (error) {
        console.error('Failed to load admin stats:', error);
    }
}

// Load admin users list
async function loadAdminUsers() {
    try {
        const users = await apiClient.request('/api/admin/users');
        const usersList = document.getElementById('admin-users-list');
        
        if (users.length === 0) {
            usersList.innerHTML = '<p>No users found.</p>';
            return;
        }
        
        usersList.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Region</th>
                        <th>Hospital</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${escapeHtml(user.username)}</td>
                            <td>${escapeHtml(user.email)}</td>
                            <td>${getRoleName(user.role)}</td>
                            <td>${user.region_id || 'N/A'}</td>
                            <td>${user.hospital_id || 'N/A'}</td>
                            <td>
                                <button class="btn btn-small btn-primary" onclick="editUserRole(${user.id})">Edit Role</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

// Load regions
async function loadRegions() {
    try {
        const regions = await apiClient.request('/api/admin/regions');
        const regionsList = document.getElementById('regions-list');
        
        regionsList.innerHTML = regions.map(region => `
            <div class="list-item">
                <strong>${escapeHtml(region.name)}</strong> (${escapeHtml(region.code)})
            </div>
        `).join('') || '<p>No regions found.</p>';
    } catch (error) {
        console.error('Failed to load regions:', error);
    }
}

// Load hospitals
async function loadHospitals() {
    try {
        const hospitals = await apiClient.request('/api/admin/hospitals');
        const hospitalsList = document.getElementById('hospitals-list');
        
        hospitalsList.innerHTML = hospitals.map(hospital => `
            <div class="list-item">
                <strong>${escapeHtml(hospital.name)}</strong> (${escapeHtml(hospital.code)}) - Region ID: ${hospital.region_id}
            </div>
        `).join('') || '<p>No hospitals found.</p>';
    } catch (error) {
        console.error('Failed to load hospitals:', error);
    }
}

// Load region admin stats
async function loadRegionAdminStats() {
    try {
        const stats = await apiClient.request('/api/dashboard/stats');
        document.getElementById('region-admin-stats').innerHTML = `
            <div class="stat-item">
                <h4>Hospitals in Region</h4>
                <p class="stat-number">${stats.total_hospitals || 0}</p>
            </div>
            <div class="stat-item">
                <h4>Users in Region</h4>
                <p class="stat-number">${stats.total_users_in_region || 0}</p>
            </div>
            <div class="stat-item">
                <h4>Sensor Readings</h4>
                <p class="stat-number">${stats.total_sensor_readings || 0}</p>
            </div>
        `;
    } catch (error) {
        console.error('Failed to load region admin stats:', error);
    }
}

// Load region users
async function loadRegionUsers() {
    try {
        const users = await apiClient.request('/api/region/users');
        document.getElementById('region-users-list').innerHTML = users.map(user => `
            <div class="list-item">
                ${escapeHtml(user.username)} - ${getRoleName(user.role)}
            </div>
        `).join('') || '<p>No users in your region.</p>';
    } catch (error) {
        console.error('Failed to load region users:', error);
    }
}

// Load region hospitals
async function loadRegionHospitals() {
    try {
        const hospitals = await apiClient.request('/api/region/hospitals');
        document.getElementById('region-hospitals-list').innerHTML = hospitals.map(hospital => `
            <div class="list-item">
                <strong>${escapeHtml(hospital.name)}</strong> (${escapeHtml(hospital.code)})
            </div>
        `).join('') || '<p>No hospitals in your region.</p>';
    } catch (error) {
        console.error('Failed to load region hospitals:', error);
    }
}

// Load region sensor data
async function loadRegionSensorData() {
    try {
        const sensorData = await apiClient.request('/api/dashboard/sensor-data?limit=10');
        displaySensorData('region-sensor-data', sensorData);
    } catch (error) {
        console.error('Failed to load region sensor data:', error);
    }
}

// Load hospital stats
async function loadHospitalStats() {
    try {
        const stats = await apiClient.request('/api/dashboard/stats');
        document.getElementById('hospital-stats').innerHTML = `
            <div class="stat-item">
                <h4>Total Sensor Readings</h4>
                <p class="stat-number">${stats.total_sensor_readings || 0}</p>
            </div>
            <div class="stat-item">
                <h4>Unique Sensors</h4>
                <p class="stat-number">${stats.unique_sensors || 0}</p>
            </div>
        `;
    } catch (error) {
        console.error('Failed to load hospital stats:', error);
    }
}

// Load hospital sensor data
async function loadHospitalSensorData() {
    try {
        const sensorData = await apiClient.request('/api/dashboard/sensor-data?limit=20');
        displaySensorData('hospital-sensor-data', sensorData);
    } catch (error) {
        console.error('Failed to load hospital sensor data:', error);
    }
}

// Display sensor data in table
function displaySensorData(elementId, sensorData) {
    const element = document.getElementById(elementId);
    
    if (!sensorData || sensorData.length === 0) {
        element.innerHTML = '<p>No sensor data available.</p>';
        return;
    }
    
    element.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Sensor ID</th>
                    <th>Hospital ID</th>
                    <th>Temperature</th>
                    <th>Humidity</th>
                    <th>Air Quality</th>
                    <th>Timestamp</th>
                </tr>
            </thead>
            <tbody>
                ${sensorData.map(data => `
                    <tr>
                        <td>${escapeHtml(data.sensor_id)}</td>
                        <td>${data.hospital_id}</td>
                        <td>${data.temperature !== null ? data.temperature.toFixed(1) + '°C' : 'N/A'}</td>
                        <td>${data.humidity !== null ? data.humidity.toFixed(1) + '%' : 'N/A'}</td>
                        <td>${data.air_quality !== null ? data.air_quality.toFixed(0) : 'N/A'}</td>
                        <td>${new Date(data.timestamp).toLocaleString()}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Set up event listeners
function setupEventListeners() {
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
            await apiClient.request('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout request failed:', error);
        } finally {
            TokenManager.clearTokens();
            window.location.href = 'login.html';
        }
    });
    
    // Enable 2FA button
    document.getElementById('enable-2fa-btn').addEventListener('click', async () => {
        try {
            const response = await apiClient.request('/api/auth/enable-2fa', { method: 'POST' });
            
            // Display QR code
            const qrContainer = document.getElementById('qr-code-container');
            qrContainer.innerHTML = `<img src="${response.qr_code}" alt="2FA QR Code">`;
            
            // Display secret
            document.getElementById('totp-secret').textContent = response.secret;
            
            // Show setup section
            document.getElementById('2fa-disabled').style.display = 'none';
            document.getElementById('2fa-setup').style.display = 'block';
        } catch (error) {
            showError(error.message);
        }
    });
    
    // Close 2FA setup
    document.getElementById('close-2fa-setup').addEventListener('click', () => {
        document.getElementById('2fa-setup').style.display = 'none';
        loadUserInfo(); // Reload to update 2FA status
    });
    
    // Disable 2FA button
    document.getElementById('disable-2fa-btn').addEventListener('click', async () => {
        if (!confirm('Are you sure you want to disable 2FA?')) {
            return;
        }
        
        try {
            await apiClient.request('/api/auth/disable-2fa', { method: 'POST' });
            await loadUserInfo(); // Reload to update 2FA status
        } catch (error) {
            showError(error.message);
        }
    });
    
    // Add data button
    document.getElementById('add-data-btn').addEventListener('click', () => {
        document.getElementById('add-data-form').style.display = 'block';
        document.getElementById('add-data-btn').style.display = 'none';
    });
    
    // Cancel add data
    document.getElementById('cancel-data-btn').addEventListener('click', () => {
        document.getElementById('add-data-form').style.display = 'none';
        document.getElementById('add-data-btn').style.display = 'block';
        document.getElementById('data-title').value = '';
        document.getElementById('data-content').value = '';
    });
    
    // Save data
    document.getElementById('save-data-btn').addEventListener('click', async () => {
        const title = document.getElementById('data-title').value;
        const content = document.getElementById('data-content').value;
        
        if (!title || !content) {
            showError('Please fill in all fields');
            return;
        }
        
        try {
            await apiClient.request('/api/data/', {
                method: 'POST',
                body: JSON.stringify({ title, content })
            });
            
            // Clear form
            document.getElementById('data-title').value = '';
            document.getElementById('data-content').value = '';
            document.getElementById('add-data-form').style.display = 'none';
            document.getElementById('add-data-btn').style.display = 'block';
            
            // Reload data
            await loadUserData();
        } catch (error) {
            showError(error.message);
        }
    });
}

// Load user data
async function loadUserData() {
    try {
        const data = await apiClient.request('/api/data/');
        
        const dataListElement = document.getElementById('data-list');
        
        if (data.length === 0) {
            dataListElement.innerHTML = '<p style="color: #888; text-align: center; padding: 2rem;">No data items yet. Click "Add New Item" to create one.</p>';
            return;
        }
        
        dataListElement.innerHTML = data.map(item => `
            <div class="data-item" data-item-id="${item.id}">
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.content)}</p>
                <small>Created: ${new Date(item.created_at).toLocaleString()}</small>
                <br>
                <button class="btn btn-danger delete-item-btn">Delete</button>
            </div>
        `).join('');
        
        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-item-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const itemId = e.target.closest('.data-item').dataset.itemId;
                await deleteDataItem(parseInt(itemId));
            });
        });
    } catch (error) {
        showError('Failed to load data: ' + error.message);
    }
}

// Delete data item
async function deleteDataItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) {
        return;
    }
    
    try {
        await apiClient.request(`/api/data/${itemId}`, { method: 'DELETE' });
        await loadUserData();
    } catch (error) {
        showError('Failed to delete item: ' + error.message);
    }
}

// Show error message
function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

