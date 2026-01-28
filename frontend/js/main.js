/**
 * Main dashboard JavaScript - Handles user info, 2FA, and data management
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Load user information
    await loadUserInfo();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load user data
    await loadUserData();
});

// Load user information
async function loadUserInfo() {
    try {
        const user = await apiClient.request('/api/auth/me');
        
        // Display user info in nav
        const userInfoElement = document.getElementById('user-info');
        userInfoElement.textContent = `Welcome, ${user.username}`;
        
        // Display user details
        const userDetailsElement = document.getElementById('user-details');
        userDetailsElement.innerHTML = `
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Member since:</strong> ${new Date(user.created_at).toLocaleDateString()}</p>
            <p><strong>Last login:</strong> ${user.last_login ? new Date(user.last_login).toLocaleString() : 'N/A'}</p>
        `;
        
        // Update 2FA section
        if (user.is_2fa_enabled) {
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

