USE waterdb;

CREATE TABLE IF NOT EXISTS water_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sensor_value FLOAT NOT NULL,
    status VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_timestamp (timestamp DESC)
);

CREATE INDEX IF NOT EXISTS idx_status ON water_data(status);
