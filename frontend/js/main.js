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
        await loadSensorStats();
        await loadSensorsOverview();
        await loadAdminUsers();
        await loadRegions();
        await loadHospitals();
        await loadAPIKeys();
        setupAdminEventListeners();
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
        
        if (!regions || regions.length === 0) {
            regionsList.innerHTML = '<p>No regions found.</p>';
            return;
        }
        
        regionsList.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Code</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${regions.map(region => `
                        <tr>
                            <td>${region.id}</td>
                            <td><strong>${escapeHtml(region.name)}</strong></td>
                            <td><code>${escapeHtml(region.code)}</code></td>
                            <td>${new Date(region.created_at).toLocaleDateString()}</td>
                            <td>
                                <button class="btn btn-small btn-primary" onclick="editRegion(${region.id})">Edit</button>
                                <button class="btn btn-small btn-danger" onclick="deleteRegion(${region.id})">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        // Populate dropdowns after loading regions
        await populateRegionDropdowns();
    } catch (error) {
        console.error('Failed to load regions:', error);
    }
}

// Edit region - global function for onclick
async function editRegion(regionId) {
    try {
        const regions = await apiClient.request('/api/admin/regions');
        const region = regions.find(r => r.id === regionId);
        
        if (!region) {
            showError('Region not found');
            return;
        }
        
        document.getElementById('edit-region-id').value = regionId;
        document.getElementById('edit-region-name').value = region.name;
        document.getElementById('edit-region-code').value = region.code;
        document.getElementById('edit-region-form').style.display = 'block';
    } catch (error) {
        showError('Failed to load region: ' + error.message);
    }
}

// Delete region - global function for onclick
async function deleteRegion(regionId) {
    if (!confirm('Are you sure you want to delete this region? This will fail if there are hospitals or users assigned to it.')) {
        return;
    }
    
    try {
        await apiClient.request(`/api/admin/regions/${regionId}`, { method: 'DELETE' });
        showSuccess('Region deleted successfully');
        await loadRegions();
    } catch (error) {
        showError('Failed to delete region: ' + error.message);
    }
}

// Load hospitals
async function loadHospitals() {
    try {
        const hospitals = await apiClient.request('/api/admin/hospitals');
        const regions = await apiClient.request('/api/admin/regions');
        const hospitalsList = document.getElementById('hospitals-list');
        
        if (!hospitals || hospitals.length === 0) {
            hospitalsList.innerHTML = '<p>No hospitals found.</p>';
            return;
        }
        
        hospitalsList.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Code</th>
                        <th>Region</th>
                        <th>Address</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${hospitals.map(hospital => {
                        const region = regions.find(r => r.id === hospital.region_id);
                        return `
                            <tr>
                                <td>${hospital.id}</td>
                                <td><strong>${escapeHtml(hospital.name)}</strong></td>
                                <td><code>${escapeHtml(hospital.code)}</code></td>
                                <td>${region ? escapeHtml(region.name) : 'N/A'}</td>
                                <td>${escapeHtml(hospital.address || 'N/A')}</td>
                                <td>${new Date(hospital.created_at).toLocaleDateString()}</td>
                                <td>
                                    <button class="btn btn-small btn-primary" onclick="editHospital(${hospital.id})">Edit</button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        
        // Populate dropdowns after loading hospitals
        await populateHospitalDropdowns();
    } catch (error) {
        console.error('Failed to load hospitals:', error);
    }
}

// Edit hospital - global function for onclick
async function editHospital(hospitalId) {
    try {
        const hospitals = await apiClient.request('/api/admin/hospitals');
        const hospital = hospitals.find(h => h.id === hospitalId);
        
        if (!hospital) {
            showError('Hospital not found');
            return;
        }
        
        document.getElementById('edit-hospital-id').value = hospitalId;
        document.getElementById('edit-hospital-name').value = hospital.name;
        document.getElementById('edit-hospital-code').value = hospital.code;
        document.getElementById('edit-hospital-region').value = hospital.region_id;
        document.getElementById('edit-hospital-address').value = hospital.address || '';
        document.getElementById('edit-hospital-form').style.display = 'block';
    } catch (error) {
        showError('Failed to load hospital: ' + error.message);
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

// Show success message
function showSuccess(message) {
    // Create success element if it doesn't exist
    let successElement = document.getElementById('success-message');
    if (!successElement) {
        successElement = document.createElement('div');
        successElement.id = 'success-message';
        successElement.className = 'success-message';
        successElement.style.position = 'fixed';
        successElement.style.top = '20px';
        successElement.style.right = '20px';
        successElement.style.zIndex = '9999';
        successElement.style.maxWidth = '400px';
        document.body.appendChild(successElement);
    }
    
    successElement.textContent = message;
    successElement.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
        successElement.style.display = 'none';
    }, 5000);
}

// Load sensor stats
async function loadSensorStats() {
    try {
        const stats = await apiClient.request('/api/admin/sensors/stats');
        document.getElementById('sensor-stats').innerHTML = `
            <div class="stat-item">
                <h4>Total Sensors</h4>
                <p class="stat-number">${stats.total_sensors || 0}</p>
            </div>
            <div class="stat-item">
                <h4>Active Sensors</h4>
                <p class="stat-number" style="color: #4CAF50;">${stats.active_sensors || 0}</p>
            </div>
            <div class="stat-item">
                <h4>Inactive Sensors</h4>
                <p class="stat-number" style="color: #f44336;">${stats.inactive_sensors || 0}</p>
            </div>
            <div class="stat-item">
                <h4>Readings (24h)</h4>
                <p class="stat-number">${stats.readings_last_24h || 0}</p>
            </div>
        `;
    } catch (error) {
        console.error('Failed to load sensor stats:', error);
    }
}

// Load sensors overview
async function loadSensorsOverview() {
    try {
        const hospitalFilter = document.getElementById('sensor-hospital-filter')?.value || '';
        const regionFilter = document.getElementById('sensor-region-filter')?.value || '';
        const searchFilter = document.getElementById('sensor-search')?.value || '';
        
        let url = '/api/admin/sensors/overview?';
        if (hospitalFilter) url += `hospital_id=${hospitalFilter}&`;
        if (regionFilter) url += `region_id=${regionFilter}&`;
        if (searchFilter) url += `sensor_id=${searchFilter}&`;
        
        const sensors = await apiClient.request(url);
        const overviewElement = document.getElementById('sensors-overview');
        
        if (!sensors || sensors.length === 0) {
            overviewElement.innerHTML = '<p>No sensors found.</p>';
            return;
        }
        
        overviewElement.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Sensor ID</th>
                        <th>Hospital</th>
                        <th>Region</th>
                        <th>Last Reading</th>
                        <th>Temp</th>
                        <th>Humidity</th>
                        <th>Air Quality</th>
                        <th>Status</th>
                        <th>Total Readings</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${sensors.map(sensor => `
                        <tr class="sensor-row">
                            <td><strong>${escapeHtml(sensor.sensor_id)}</strong></td>
                            <td>${escapeHtml(sensor.hospital_name)}</td>
                            <td>${escapeHtml(sensor.region_name)}</td>
                            <td>${new Date(sensor.last_reading_timestamp).toLocaleString()}</td>
                            <td>${sensor.temperature !== null ? sensor.temperature.toFixed(1) + '°C' : 'N/A'}</td>
                            <td>${sensor.humidity !== null ? sensor.humidity.toFixed(1) + '%' : 'N/A'}</td>
                            <td>${sensor.air_quality !== null ? sensor.air_quality.toFixed(0) : 'N/A'}</td>
                            <td>
                                <span class="status-badge ${sensor.is_active ? 'status-active' : 'status-inactive'}">
                                    ${sensor.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td>${sensor.total_readings}</td>
                            <td>
                                <button class="btn btn-small btn-primary" onclick="viewSensorDetails('${escapeHtml(sensor.sensor_id)}', ${sensor.hospital_id})">
                                    View Details
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Failed to load sensors overview:', error);
        document.getElementById('sensors-overview').innerHTML = '<p>Failed to load sensors</p>';
    }
}

// View sensor details - global function for onclick
async function viewSensorDetails(sensorId, hospitalId) {
    try {
        const history = await apiClient.request(`/api/admin/sensors/${sensorId}/history?hospital_id=${hospitalId}&limit=50`);
        
        const modal = document.getElementById('sensor-modal');
        const content = document.getElementById('sensor-modal-content');
        
        if (history.length === 0) {
            content.innerHTML = `<p>No history found for sensor ${escapeHtml(sensorId)}</p>`;
        } else {
            content.innerHTML = `
                <h3>Sensor: ${escapeHtml(sensorId)}</h3>
                <p><strong>Hospital ID:</strong> ${hospitalId}</p>
                <p><strong>Total Records:</strong> ${history.length}</p>
                
                <h4>Recent Readings</h4>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Temperature</th>
                            <th>Humidity</th>
                            <th>Air Quality</th>
                            <th>Custom Data</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${history.map(record => `
                            <tr>
                                <td>${new Date(record.timestamp).toLocaleString()}</td>
                                <td>${record.temperature !== null ? record.temperature.toFixed(1) + '°C' : 'N/A'}</td>
                                <td>${record.humidity !== null ? record.humidity.toFixed(1) + '%' : 'N/A'}</td>
                                <td>${record.air_quality !== null ? record.air_quality.toFixed(0) : 'N/A'}</td>
                                <td><pre style="font-size: 0.8rem; max-width: 200px; overflow-x: auto;">${JSON.stringify(record.data_json, null, 2)}</pre></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
        
        modal.style.display = 'block';
    } catch (error) {
        showError('Failed to load sensor details: ' + error.message);
    }
}

// Load API keys
async function loadAPIKeys() {
    try {
        const apiKeys = await apiClient.request('/api/admin/api-keys');
        const listElement = document.getElementById('api-keys-list');
        
        if (!apiKeys || apiKeys.length === 0) {
            listElement.innerHTML = '<p>No API keys found. Generate one to get started.</p>';
            return;
        }
        
        listElement.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Key (truncated)</th>
                        <th>Hospital ID</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Last Used</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${apiKeys.map(key => `
                        <tr>
                            <td><code>${escapeHtml(key.key.substring(0, 20))}...</code></td>
                            <td>${key.hospital_id}</td>
                            <td>${escapeHtml(key.description || 'N/A')}</td>
                            <td>
                                <span class="status-badge ${key.is_active ? 'status-active' : 'status-inactive'}">
                                    ${key.is_active ? 'Active' : 'Revoked'}
                                </span>
                            </td>
                            <td>${new Date(key.created_at).toLocaleDateString()}</td>
                            <td>${key.last_used ? new Date(key.last_used).toLocaleString() : 'Never'}</td>
                            <td>
                                ${key.is_active ? `<button class="btn btn-small btn-danger" onclick="revokeAPIKey(${key.id})">Revoke</button>` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Failed to load API keys:', error);
    }
}

// Revoke API key - global function for onclick
async function revokeAPIKey(keyId) {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
        return;
    }
    
    try {
        await apiClient.request(`/api/admin/api-keys/${keyId}`, { method: 'DELETE' });
        showSuccess('API key revoked successfully');
        await loadAPIKeys();
    } catch (error) {
        showError('Failed to revoke API key: ' + error.message);
    }
}

// Setup admin event listeners
function setupAdminEventListeners() {
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(closeBtn => {
        closeBtn.onclick = function() {
            this.closest('.modal').style.display = 'none';
        };
    });
    
    // Close modals when clicking outside
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
    
    // Refresh all button
    document.getElementById('refresh-all-btn')?.addEventListener('click', async () => {
        await loadDashboardByRole();
        showSuccess('Data refreshed');
    });
    
    // Sensor filter button
    document.getElementById('sensor-filter-btn')?.addEventListener('click', async () => {
        await loadSensorsOverview();
    });
    
    // Region management buttons
    document.getElementById('add-region-btn')?.addEventListener('click', () => {
        document.getElementById('add-region-form').style.display = 'block';
        document.getElementById('add-region-btn').style.display = 'none';
    });
    
    document.getElementById('cancel-region-btn')?.addEventListener('click', () => {
        document.getElementById('add-region-form').style.display = 'none';
        document.getElementById('add-region-btn').style.display = 'block';
        document.getElementById('region-name').value = '';
        document.getElementById('region-code').value = '';
    });
    
    document.getElementById('cancel-edit-region-btn')?.addEventListener('click', () => {
        document.getElementById('edit-region-form').style.display = 'none';
    });
    
    document.getElementById('update-region-btn')?.addEventListener('click', async () => {
        const regionId = document.getElementById('edit-region-id').value;
        const name = document.getElementById('edit-region-name').value;
        const code = document.getElementById('edit-region-code').value;
        
        if (!name || !code) {
            showError('Please fill in all required fields');
            return;
        }
        
        try {
            await apiClient.request(`/api/admin/regions/${regionId}`, {
                method: 'PUT',
                body: JSON.stringify({ name, code })
            });
            
            showSuccess('Region updated successfully');
            document.getElementById('edit-region-form').style.display = 'none';
            await loadRegions();
        } catch (error) {
            showError('Failed to update region: ' + error.message);
        }
    });
    
    document.getElementById('save-region-btn')?.addEventListener('click', async () => {
        const name = document.getElementById('region-name').value;
        const code = document.getElementById('region-code').value;
        
        if (!name || !code) {
            showError('Please fill in all required fields');
            return;
        }
        
        try {
            await apiClient.request('/api/admin/regions', {
                method: 'POST',
                body: JSON.stringify({ name, code })
            });
            
            showSuccess('Region created successfully');
            document.getElementById('add-region-form').style.display = 'none';
            document.getElementById('add-region-btn').style.display = 'block';
            document.getElementById('region-name').value = '';
            document.getElementById('region-code').value = '';
            
            await loadRegions();
            await populateRegionDropdowns();
        } catch (error) {
            showError('Failed to create region: ' + error.message);
        }
    });
    
    // Hospital management buttons
    document.getElementById('add-hospital-btn')?.addEventListener('click', () => {
        document.getElementById('add-hospital-form').style.display = 'block';
        document.getElementById('add-hospital-btn').style.display = 'none';
    });
    
    document.getElementById('cancel-hospital-btn')?.addEventListener('click', () => {
        document.getElementById('add-hospital-form').style.display = 'none';
        document.getElementById('add-hospital-btn').style.display = 'block';
        clearHospitalForm();
    });
    
    document.getElementById('cancel-edit-hospital-btn')?.addEventListener('click', () => {
        document.getElementById('edit-hospital-form').style.display = 'none';
    });
    
    document.getElementById('update-hospital-btn')?.addEventListener('click', async () => {
        const hospitalId = document.getElementById('edit-hospital-id').value;
        const name = document.getElementById('edit-hospital-name').value;
        const code = document.getElementById('edit-hospital-code').value;
        const region_id = parseInt(document.getElementById('edit-hospital-region').value);
        const address = document.getElementById('edit-hospital-address').value;
        
        if (!name || !code || !region_id) {
            showError('Please fill in all required fields');
            return;
        }
        
        try {
            await apiClient.request(`/api/admin/hospitals/${hospitalId}`, {
                method: 'PUT',
                body: JSON.stringify({ name, code, region_id, address: address || null })
            });
            
            showSuccess('Hospital updated successfully');
            document.getElementById('edit-hospital-form').style.display = 'none';
            await loadHospitals();
        } catch (error) {
            showError('Failed to update hospital: ' + error.message);
        }
    });
    
    document.getElementById('save-hospital-btn')?.addEventListener('click', async () => {
        const name = document.getElementById('hospital-name').value;
        const code = document.getElementById('hospital-code').value;
        const region_id = parseInt(document.getElementById('hospital-region').value);
        const address = document.getElementById('hospital-address').value;
        
        if (!name || !code || !region_id) {
            showError('Please fill in all required fields');
            return;
        }
        
        try {
            await apiClient.request('/api/admin/hospitals', {
                method: 'POST',
                body: JSON.stringify({ name, code, region_id, address: address || null })
            });
            
            showSuccess('Hospital created successfully');
            document.getElementById('add-hospital-form').style.display = 'none';
            document.getElementById('add-hospital-btn').style.display = 'block';
            clearHospitalForm();
            
            await loadHospitals();
            await populateHospitalDropdowns();
        } catch (error) {
            showError('Failed to create hospital: ' + error.message);
        }
    });
    
    // API Key management buttons
    document.getElementById('add-api-key-btn')?.addEventListener('click', () => {
        document.getElementById('add-api-key-form').style.display = 'block';
        document.getElementById('add-api-key-btn').style.display = 'none';
    });
    
    document.getElementById('cancel-api-key-btn')?.addEventListener('click', () => {
        document.getElementById('add-api-key-form').style.display = 'none';
        document.getElementById('add-api-key-btn').style.display = 'block';
        document.getElementById('api-key-hospital').value = '';
        document.getElementById('api-key-description').value = '';
    });
    
    document.getElementById('save-api-key-btn')?.addEventListener('click', async () => {
        const hospital_id = parseInt(document.getElementById('api-key-hospital').value);
        const description = document.getElementById('api-key-description').value;
        
        if (!hospital_id) {
            showError('Please select a hospital');
            return;
        }
        
        try {
            const result = await apiClient.request('/api/admin/api-keys', {
                method: 'POST',
                body: JSON.stringify({ hospital_id, description: description || null })
            });
            
            // Show the generated key to the user
            alert(`API Key Generated!\n\nKey: ${result.key}\n\nIMPORTANT: Save this key securely. It will not be shown again!`);
            
            showSuccess('API key generated successfully');
            document.getElementById('add-api-key-form').style.display = 'none';
            document.getElementById('add-api-key-btn').style.display = 'block';
            document.getElementById('api-key-hospital').value = '';
            document.getElementById('api-key-description').value = '';
            
            await loadAPIKeys();
        } catch (error) {
            showError('Failed to generate API key: ' + error.message);
        }
    });
}

// Helper to clear hospital form
function clearHospitalForm() {
    document.getElementById('hospital-name').value = '';
    document.getElementById('hospital-code').value = '';
    document.getElementById('hospital-region').value = '';
    document.getElementById('hospital-address').value = '';
}

// Populate region dropdowns
async function populateRegionDropdowns() {
    try {
        const regions = await apiClient.request('/api/admin/regions');
        
        // Populate hospital form region dropdown
        const hospitalRegionSelect = document.getElementById('hospital-region');
        if (hospitalRegionSelect) {
            hospitalRegionSelect.innerHTML = '<option value="">Select a region...</option>' +
                regions.map(r => `<option value="${r.id}">${escapeHtml(r.name)}</option>`).join('');
        }
        
        // Populate edit hospital form region dropdown
        const editHospitalRegionSelect = document.getElementById('edit-hospital-region');
        if (editHospitalRegionSelect) {
            editHospitalRegionSelect.innerHTML = '<option value="">Select a region...</option>' +
                regions.map(r => `<option value="${r.id}">${escapeHtml(r.name)}</option>`).join('');
        }
        
        // Populate sensor filter region dropdown
        const sensorRegionFilter = document.getElementById('sensor-region-filter');
        if (sensorRegionFilter) {
            sensorRegionFilter.innerHTML = '<option value="">All Regions</option>' +
                regions.map(r => `<option value="${r.id}">${escapeHtml(r.name)}</option>`).join('');
        }
    } catch (error) {
        console.error('Failed to populate region dropdowns:', error);
    }
}

// Populate hospital dropdowns
async function populateHospitalDropdowns() {
    try {
        const hospitals = await apiClient.request('/api/admin/hospitals');
        
        // Populate API key hospital dropdown
        const apiKeyHospitalSelect = document.getElementById('api-key-hospital');
        if (apiKeyHospitalSelect) {
            apiKeyHospitalSelect.innerHTML = '<option value="">Select a hospital...</option>' +
                hospitals.map(h => `<option value="${h.id}">${escapeHtml(h.name)}</option>`).join('');
        }
        
        // Populate sensor filter hospital dropdown
        const sensorHospitalFilter = document.getElementById('sensor-hospital-filter');
        if (sensorHospitalFilter) {
            sensorHospitalFilter.innerHTML = '<option value="">All Hospitals</option>' +
                hospitals.map(h => `<option value="${h.id}">${escapeHtml(h.name)}</option>`).join('');
        }
    } catch (error) {
        console.error('Failed to populate hospital dropdowns:', error);
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

// Edit user role - global function for onclick
async function editUserRole(userId) {
    try {
        // Get user details
        const users = await apiClient.request('/api/admin/users');
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            showError('User not found');
            return;
        }

        // Get regions and hospitals for dropdowns
        const regions = await apiClient.request('/api/admin/regions');
        const hospitals = await apiClient.request('/api/admin/hospitals');

        // Show modal with edit form
        const modal = document.getElementById('user-role-modal');
        const content = document.getElementById('user-role-modal-content');
        
        content.innerHTML = `
            <div class="form-group">
                <label><strong>User:</strong> ${escapeHtml(user.username)} (${escapeHtml(user.email)})</label>
            </div>
            <div class="form-group">
                <label for="edit-user-role">Role *</label>
                <select id="edit-user-role" required>
                    <option value="1" ${user.role === 1 ? 'selected' : ''}>Pending</option>
                    <option value="2" ${user.role === 2 ? 'selected' : ''}>Admin</option>
                    <option value="3" ${user.role === 3 ? 'selected' : ''}>Region Admin</option>
                    <option value="4" ${user.role === 4 ? 'selected' : ''}>Hospital User</option>
                </select>
            </div>
            <div class="form-group">
                <label for="edit-user-region">Region</label>
                <select id="edit-user-region">
                    <option value="">None</option>
                    ${regions.map(r => `<option value="${r.id}" ${user.region_id === r.id ? 'selected' : ''}>${escapeHtml(r.name)}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="edit-user-hospital">Hospital</label>
                <select id="edit-user-hospital">
                    <option value="">None</option>
                    ${hospitals.map(h => `<option value="${h.id}" ${user.hospital_id === h.id ? 'selected' : ''}>${escapeHtml(h.name)}</option>`).join('')}
                </select>
            </div>
            <button id="save-user-role-btn" class="btn btn-success">Save Changes</button>
        `;

        modal.style.display = 'block';

        // Save button handler
        document.getElementById('save-user-role-btn').addEventListener('click', async () => {
            const newRole = parseInt(document.getElementById('edit-user-role').value);
            const newRegionId = document.getElementById('edit-user-region').value;
            const newHospitalId = document.getElementById('edit-user-hospital').value;

            try {
                // Update role
                await apiClient.request(`/api/admin/users/${userId}/role`, {
                    method: 'POST',
                    body: JSON.stringify({ role: newRole })
                });

                // Update assignment
                await apiClient.request(`/api/admin/users/${userId}/assign`, {
                    method: 'POST',
                    body: JSON.stringify({
                        region_id: newRegionId ? parseInt(newRegionId) : null,
                        hospital_id: newHospitalId ? parseInt(newHospitalId) : null
                    })
                });

                showSuccess('User updated successfully');
                modal.style.display = 'none';
                await loadAdminUsers();
            } catch (error) {
                showError('Failed to update user: ' + error.message);
            }
        });
    } catch (error) {
        showError('Failed to load user data: ' + error.message);
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

