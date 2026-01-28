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
    hospital_id: int = None

class Hospital(BaseModel):
    name: str
    address: str = None
    city: str = None
    state: str = None
    zip_code: str = None
    phone: str = None
    email: str = None

class HospitalUpdate(BaseModel):
    name: str = None
    address: str = None
    city: str = None
    state: str = None
    zip_code: str = None
    phone: str = None
    email: str = None

class WaterData(BaseModel):
    sensor_value: float
    status: str
    location: str
    hospital_id: int = None

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
                "INSERT INTO water_data (sensor_value, status, location, hospital_id) VALUES (%s, %s, %s, %s)",
                (data.sensor_value, data.status, data.location, data.hospital_id)
            )
            db.commit()
            return {"message": "Data inserted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/waterdata")
def get_data(limit: int = 100, hospital_id: int = None):
    try:
        with get_db_connection() as db:
            cursor = db.cursor(dictionary=True)
            if hospital_id:
                cursor.execute(
                    f"SELECT * FROM water_data WHERE hospital_id = %s ORDER BY timestamp DESC LIMIT {min(limit, 1000)}",
                    (hospital_id,)
                )
            else:
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
                "INSERT INTO users (username, password_hash, hospital_id) VALUES (%s, %s, %s)",
                (user.username, password_hash, user.hospital_id)
            )
            db.commit()
            return {"message": "User created", "username": user.username}
    except mysql.connector.Error as e:
        if e.errno == 1062:
            raise HTTPException(status_code=400, detail="Username already exists")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users")
def get_users(hospital_id: int = None):
    try:
        with get_db_connection() as db:
            cursor = db.cursor(dictionary=True)
            if hospital_id:
                cursor.execute("SELECT id, username, hospital_id, created_at FROM users WHERE hospital_id = %s", (hospital_id,))
            else:
                cursor.execute("SELECT id, username, hospital_id, created_at FROM users")
            users = cursor.fetchall()
            return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login")
def login(user: User):
    try:
        with get_db_connection() as db:
            cursor = db.cursor(dictionary=True)
            cursor.execute("SELECT id, password_hash, hospital_id FROM users WHERE username = %s", (user.username,))
            result = cursor.fetchone()
            
            if not result:
                raise HTTPException(status_code=401, detail="Invalid username or password")
            
            # Verify password against hash
            if bcrypt.checkpw(user.password.encode('utf-8'), result['password_hash'].encode('utf-8')):
                return {
                    "message": "Login successful",
                    "username": user.username,
                    "user_id": result['id'],
                    "hospital_id": result['hospital_id']
                }
            else:
                raise HTTPException(status_code=401, detail="Invalid username or password")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Hospital Endpoints
@app.post("/hospitals")
def create_hospital(hospital: Hospital):
    try:
        with get_db_connection() as db:
            cursor = db.cursor()
            cursor.execute(
                """INSERT INTO hospitals (name, address, city, state, zip_code, phone, email) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (hospital.name, hospital.address, hospital.city, hospital.state, 
                 hospital.zip_code, hospital.phone, hospital.email)
            )
            db.commit()
            hospital_id = cursor.lastrowid
            return {"message": "Hospital created", "hospital_id": hospital_id}
    except mysql.connector.Error as e:
        if e.errno == 1062:
            raise HTTPException(status_code=400, detail="Hospital name already exists")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/hospitals")
def get_hospitals():
    try:
        with get_db_connection() as db:
            cursor = db.cursor(dictionary=True)
            cursor.execute("SELECT * FROM hospitals ORDER BY id ASC")
            hospitals = cursor.fetchall()
            return hospitals
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/hospitals/{hospital_id}")
def get_hospital(hospital_id: int):
    try:
        with get_db_connection() as db:
            cursor = db.cursor(dictionary=True)
            cursor.execute("SELECT * FROM hospitals WHERE id = %s", (hospital_id,))
            hospital = cursor.fetchone()
            
            if not hospital:
                raise HTTPException(status_code=404, detail="Hospital not found")
            
            return hospital
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/hospitals/{hospital_id}")
def update_hospital(hospital_id: int, hospital: HospitalUpdate):
    try:
        with get_db_connection() as db:
            cursor = db.cursor()
            
            # Build dynamic update query
            updates = []
            values = []
            for field, value in hospital.dict().items():
                if value is not None:
                    updates.append(f"{field} = %s")
                    values.append(value)
            
            if not updates:
                raise HTTPException(status_code=400, detail="No fields to update")
            
            values.append(hospital_id)
            query = f"UPDATE hospitals SET {', '.join(updates)} WHERE id = %s"
            cursor.execute(query, values)
            db.commit()
            
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Hospital not found")
            
            return {"message": "Hospital updated"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/hospitals/{hospital_id}")
def delete_hospital(hospital_id: int):
    try:
        with get_db_connection() as db:
            cursor = db.cursor()
            cursor.execute("DELETE FROM hospitals WHERE id = %s", (hospital_id,))
            db.commit()
            
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Hospital not found")
            
            return {"message": "Hospital deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))