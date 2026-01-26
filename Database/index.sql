USE waterdb;

CREATE TABLE water_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sensor_value FLOAT NOT NULL,
    status VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
