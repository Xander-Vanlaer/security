from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import mysql.connector
import os

app = FastAPI()

class WaterData(BaseModel):
    sensor_value: float
    status: str | None = None

def get_db():
    return mysql.connector.connect(
        user=os.environ.get("DB_USER", "wateruser"),
        password=os.environ.get("DB_PASS", "waterpass"),
        host=os.environ.get("DB_HOST", "db"),
        database=os.environ.get("DB_NAME", "waterdb"),
    )

@app.post("/waterdata")
def insert_data(data: WaterData):
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            """
            INSERT INTO water_data (sensor_value, status)
            VALUES (%s, %s)
            """,
            (data.sensor_value, data.status)
        )
        db.commit()
        return {"message": "Data inserted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()

@app.get("/waterdata")
def get_data():
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT * FROM water_data")
        data = cursor.fetchall()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()
