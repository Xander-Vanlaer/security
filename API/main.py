from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import contextmanager
import mysql.connector
from mysql.connector import pooling
import os
import bcrypt

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class User(BaseModel):
    username: str
    password: str

class WaterData(BaseModel):
    sensor_value: float
    status: str
    location: str

db_config = {
    "user": os.environ.get("DB_USER", "wateruser"),
    "password": os.environ.get("DB_PASS", "waterpass"),
    "host": os.environ.get("DB_HOST", "db"),
    "database": os.environ.get("DB_NAME", "waterdb"),
}

try:
    connection_pool = pooling.MySQLConnectionPool(pool_name="waterdb_pool", pool_size=5, **db_config)
except Exception as e:
    print(f"Failed to create connection pool: {e}")
    connection_pool = None

@contextmanager
def get_db_connection():
    if connection_pool:
        conn = connection_pool.get_connection()
    else:
        conn = mysql.connector.connect(**db_config)
    try:
        yield conn
    finally:
        conn.close()

@app.post("/waterdata")
def insert_data(data: WaterData):
    try:
        with get_db_connection() as db:
            cursor = db.cursor()
            cursor.execute(
                "INSERT INTO water_data (sensor_value, status, location) VALUES (%s, %s, %s)",
                (data.sensor_value, data.status, data.location)
            )
            db.commit()
            return {"message": "Data inserted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/waterdata")
def get_data(limit: int = 100):
    try:
        with get_db_connection() as db:
            cursor = db.cursor(dictionary=True)
            cursor.execute(f"SELECT * FROM water_data ORDER BY timestamp DESC LIMIT {min(limit, 1000)}")
            data = cursor.fetchall()
            return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/users")
def create_user(user: User):
    try:
        # Hash password with bcrypt
        password_hash = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        with get_db_connection() as db:
            cursor = db.cursor()
            cursor.execute(
                "INSERT INTO users (username, password_hash) VALUES (%s, %s)",
                (user.username, password_hash)
            )
            db.commit()
            return {"message": "User created", "username": user.username}
    except mysql.connector.Error as e:
        if e.errno == 1062:
            raise HTTPException(status_code=400, detail="Username already exists")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users")
def get_users():
    try:
        with get_db_connection() as db:
            cursor = db.cursor(dictionary=True)
            cursor.execute("SELECT id, username, created_at FROM users")
            users = cursor.fetchall()
            return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login")
def login(user: User):
    try:
        with get_db_connection() as db:
            cursor = db.cursor(dictionary=True)
            cursor.execute("SELECT password_hash FROM users WHERE username = %s", (user.username,))
            result = cursor.fetchone()
            
            if not result:
                raise HTTPException(status_code=401, detail="Invalid username or password")
            
            # Verify password against hash
            if bcrypt.checkpw(user.password.encode('utf-8'), result['password_hash'].encode('utf-8')):
                return {"message": "Login successful", "username": user.username}
            else:
                raise HTTPException(status_code=401, detail="Invalid username or password")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))