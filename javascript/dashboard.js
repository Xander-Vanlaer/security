const API_URL = '/api';
const COLUMNS = ['column-1', 'column-2', 'column-3', 'column-4', 'column-5', 'column-6'];
const REFRESH_INTERVAL = 5000;
const CARD_STYLES = `background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin: 10px 0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); height: 280px; display: flex; flex-direction: column;`;

let refreshTimer = null;

async function loadWaterData() {
    try {
        const response = await fetch(`${API_URL}/waterdata?limit=6`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        Array.isArray(data) && data.length > 0 ? displayFlashcards(data) : displayMessage('No water data available');
    } catch (error) {
        console.error('Error loading data:', error);
        displayMessage(`Error: ${error.message}`);
    }
}

function clearColumns() {
    COLUMNS.forEach(colId => {
        const col = document.getElementById(colId);
        if (col) col.innerHTML = '';
    });
}

function displayFlashcards(data) {
    clearColumns();
    data.forEach((item, index) => {
        const columnId = COLUMNS[index % COLUMNS.length];
        const column = document.getElementById(columnId);
        if (column) column.appendChild(createFlashcard(item));
    });
}

function createFlashcard(data) {
    const card = document.createElement('div');
    card.className = 'flashcard';
    card.style.cssText = CARD_STYLES;
    card.innerHTML = `<h3 style="margin: 0 0 10px 0; font-size: 18px;">Water Data</h3><div style="font-size: 14px; line-height: 1.6;"><p><strong>ID:</strong> ${data.id || 'N/A'}</p><p><strong>Location:</strong> ${data.location || 'N/A'}</p><p><strong>Quality:</strong> ${data.sensor_value || 'N/A'}/10</p><p><strong>Status:</strong> ${data.status || 'N/A'}</p><p style="font-size: 12px; opacity: 0.8; margin-top: 10px;">${new Date(data.timestamp).toLocaleString()}</p></div>`;
    return card;
}

function displayMessage(message) {
    const column = document.getElementById('column-1');
    if (column) column.innerHTML = `<p style="color: #666; padding: 20px; text-align: center;">${message}</p>`;
}

async function submitSensorData(sensorValue, status, location) {
    const messageEl = document.getElementById('formMessage');
    try {
        const response = await fetch(`${API_URL}/waterdata`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sensor_value: parseFloat(sensorValue), status, location })
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        messageEl.textContent = '✓ Data submitted successfully!';
        messageEl.style.color = '#28a745';
        messageEl.style.display = 'block';
        document.getElementById('sensorForm').reset();
        setTimeout(() => loadWaterData(), 300);
        setTimeout(() => { messageEl.style.display = 'none'; }, 3000);
    } catch (error) {
        console.error('Error submitting data:', error);
        messageEl.textContent = `✗ Error: ${error.message}`;
        messageEl.style.color = '#dc3545';
        messageEl.style.display = 'block';
    }
}

function startAutoRefresh() {
    loadWaterData();
    refreshTimer = setInterval(loadWaterData, REFRESH_INTERVAL);
}

function stopAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        startAutoRefresh();
        document.getElementById('sensorForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const sensorValue = document.getElementById('sensorValue').value;
            const status = document.getElementById('statusSelect').value;
            const location = document.getElementById('location').value;
            if (sensorValue && status && location) submitSensorData(sensorValue, status, location);
        });
    });
} else {
    startAutoRefresh();
    document.getElementById('sensorForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const sensorValue = document.getElementById('sensorValue').value;
        const status = document.getElementById('statusSelect').value;
        const location = document.getElementById('location').value;
        if (sensorValue && status && location) submitSensorData(sensorValue, status, location);
    });
}

window.addEventListener('beforeunload', stopAutoRefresh);
