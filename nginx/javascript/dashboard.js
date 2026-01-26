const API_URL = '/api';

async function loadWaterData() {
    try {
        const response = await fetch(`${API_URL}/waterdata`);
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
            displayFlashcards(data);
        } else {
            displayMessage('No water data available');
        }
    } catch (error) {
        console.error('Error loading data:', error);
        displayMessage(`Error loading data: ${error.message}`);
    }
}

function displayFlashcards(data) {
    const columns = ['column-1', 'column-2', 'column-3', 'column-4', 'column-5', 'column-6'];
    
    // Clear all columns first
    columns.forEach(colId => {
        const col = document.getElementById(colId);
        if (col) col.innerHTML = '';
    });
    
    // Distribute data across columns
    data.forEach((item, index) => {
        const columnId = columns[index % columns.length];
        const column = document.getElementById(columnId);
        
        if (column) {
            const flashcard = createFlashcard(item);
            column.appendChild(flashcard);
        }
    });
}

function createFlashcard(data) {
    const card = document.createElement('div');
    card.className = 'flashcard';
    card.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 8px;
        margin: 10px 0;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        min-height: 150px;
        display: flex;
        flex-direction: column;
        justify-content: center;
    `;
    
    card.innerHTML = `
        <h3 style="margin: 0 0 10px 0; font-size: 18px;">Water Data</h3>
        <div style="font-size: 14px; line-height: 1.6;">
            <p><strong>ID:</strong> ${data.id || 'N/A'}</p>
            <p><strong>Sensor Value:</strong> ${data.sensor_value || 'N/A'}</p>
            <p><strong>Status:</strong> ${data.status || 'N/A'}</p>
        </div>
    `;
    
    return card;
}

function displayMessage(message) {
    const column = document.getElementById('column-1');
    if (column) {
        column.innerHTML = `<p style="color: #666; padding: 20px; text-align: center;">${message}</p>`;
    }
}

// Load data when page loads
window.addEventListener('load', loadWaterData);

// Refresh data every 5 seconds
setInterval(loadWaterData, 5000);
