require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors({
  origin: "http://stratosluxdetailing.com" 
}));

app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    customerName TEXT NOT NULL,
    customerEmail TEXT NOT NULL,
    customerPhone TEXT NOT NULL,
    preferredLocation TEXT NOT NULL,
    serviceType TEXT NOT NULL,
    preferredDate DATE NOT NULL,
    preferredTime TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

pool.query(createTableQuery)
  .then(() => console.log("Bookings table ensured"))
  .catch((err) => console.error("Error creating bookings table:", err));

app.post("/api/bookings", async (req, res) => {
  const {
    customerName,
    customerEmail,
    customerPhone,
    preferredLocation,
    serviceType,
    preferredDate,
    preferredTime
  } = req.body;

  if (!customerName || !customerEmail || !customerPhone || !preferredLocation || !serviceType || !preferredDate || !preferredTime) {
    return res.status(400).json({ message: "Missing required booking fields" });
  }

  try {
    const insertQuery = `
      INSERT INTO bookings (customerName, customerEmail, customerPhone, preferredLocation, serviceType, preferredDate, preferredTime)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [customerName, customerEmail, customerPhone, preferredLocation, serviceType, preferredDate, preferredTime];
    const result = await pool.query(insertQuery, values);
    
    console.log("Received booking:", result.rows[0]);
    res.status(200).json({ message: "Booking received successfully", booking: result.rows[0] });
  } catch (error) {
    console.error("Error saving booking:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
