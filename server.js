require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const SibApiV3Sdk = require("sib-api-v3-sdk");

const app = express();

app.use(cors({ origin: ['https://stratosluxdetailing.com', 'https://www.stratosluxdetailing.com'] }));

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

const sendEmail = async (booking) => {
  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  const apiKey = defaultClient.authentications['api-key'];
  apiKey.apiKey = process.env.SENDINBLUE_API_KEY;

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  const sendSmtpEmail = {
    to: [
      { email: booking.customerEmail, name: booking.customerName },
      { email: "stratoslux@gmail.com", name: "StratosLux" }
    ],
    sender: { email: process.env.SENDINBLUE_SENDER_EMAIL, name: "StratosLux" },
    subject: "Booking Confirmation",
    htmlContent: `<html>
       <body>
           <h1>Booking Confirmed</h1>
           <p>Dear ${booking.customerName},</p>
           <p>Thank you for booking our service.</p>
           <p>Your booking details:</p>
           <ul>
             <li>Service: ${booking.serviceType}</li>
             <li>Location: ${booking.preferredLocation}</li>
             <li>Date: ${booking.preferredDate}</li>
             <li>Time: ${booking.preferredTime}</li>
           </ul>
           <p>Starting 03/21/2025 we will require a 30$ deposit to confirm the booking. This can be paid up to 12 hour before the scheduled appointment.</p>
           <p>We look forward to serving you.</p>
       </body>
       </html>`
  };

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Email sent successfully:", data);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

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
    console.log('Results:', result)
    console.log("Received booking:", result.rows[0]);

    sendEmail(result.rows[0]);

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
