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
    customername TEXT NOT NULL,
    customeremail TEXT NOT NULL,
    customerphone TEXT NOT NULL,
    preferredlocation TEXT NOT NULL,
    servicetype TEXT NOT NULL,
    preferreddate DATE NOT NULL,
    preferredtime TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

pool.query(createTableQuery)
  .then(() => console.log("Bookings table ensured"))
  .catch((err) => console.error("Error creating bookings table:", err));

const sendCustomerEmail = async (booking) => {
  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  const apiKey = defaultClient.authentications['api-key'];
  apiKey.apiKey = process.env.SENDINBLUE_API_KEY;

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  const sendSmtpEmail = {
    to: [
      { email: booking.customeremail, name: booking.customername }
    ],
    sender: { email: process.env.SENDINBLUE_SENDER_EMAIL, name: "StratosLux" },
    subject: "Booking Confirmation",
    htmlContent: `<html>
       <body>
           <h1>Booking Confirmed</h1>
           <p>Dear ${booking.customername},</p>
           <p>Thank you for booking our service.</p>
           <p>Your booking details:</p>
           <ul>
             <li>Service: ${booking.servicetype}</li>
             <li>Location: ${booking.preferredlocation}</li>
             <li>Date: ${new Date(booking.preferreddate).toLocaleDateString()}</li>
             <li>Time: ${booking.preferredtime}</li>
           </ul>
           <p>Starting 03/21/2025 we will require a $30 deposit to confirm the booking. This can be paid up to 12 hours before the scheduled appointment.</p>
           <p>We look forward to serving you.</p>
       </body>
       </html>`
  };

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Customer email sent successfully:", data);
  } catch (error) {
    console.error("Error sending customer email:", error);
  }
};

const sendBusinessNotificationEmail = async (booking) => {
  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  const apiKey = defaultClient.authentications['api-key'];
  apiKey.apiKey = process.env.SENDINBLUE_API_KEY;

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  const sendSmtpEmail = {
    to: [
      { email: "stratoslux@gmail.com", name: "StratosLux" }
    ],
    sender: { email: process.env.SENDINBLUE_SENDER_EMAIL, name: "StratosLux" },
    subject: "New Booking Notification",
    htmlContent: `<html>
       <body>
           <h1>New Booking Received</h1>
           <p>A new booking has been submitted with the following details:</p>
           <ul>
             <li>Name: ${booking.customername}</li>
             <li>Email: ${booking.customeremail}</li>
             <li>Phone: ${booking.customerphone}</li>
             <li>Service: ${booking.servicetype}</li>
             <li>Location: ${booking.preferredlocation}</li>
             <li>Date: ${new Date(booking.preferreddate).toLocaleDateString()}</li>
             <li>Time: ${booking.preferredtime}</li>
           </ul>
       </body>
       </html>`
  };

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Business notification email sent successfully:", data);
  } catch (error) {
    console.error("Error sending business notification email:", error);
  }
};

app.post("/api/bookings", async (req, res) => {
  const {
    customername,
    customeremail,
    customerphone,
    preferredlocation,
    servicetype,
    preferreddate,
    preferredtime
  } = req.body;

  if (!customername || !customeremail || !customerphone || !preferredlocation || !servicetype || !preferreddate || !preferredtime) {
    return res.status(400).json({ message: "Missing required booking fields" });
  }

  try {
    const insertQuery = `
      INSERT INTO bookings (customername, customeremail, customerphone, preferredlocation, servicetype, preferreddate, preferredtime)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [customername, customeremail, customerphone, preferredlocation, servicetype, preferreddate, preferredtime];
    const result = await pool.query(insertQuery, values);

    const booking = result.rows[0]; // Booking details from the database

    console.log("Received booking:", booking);

    // Send confirmation email to the customer
    sendCustomerEmail(booking);
    // Send notification email to the business
    sendBusinessNotificationEmail(booking);

    res.status(200).json({
      message: "Booking received successfully",
      booking: {
        id: booking.id,
        customername: booking.customername,
        customeremail: booking.customeremail,
        customerphone: booking.customerphone,
        preferredlocation: booking.preferredlocation,
        servicetype: booking.servicetype,
        preferreddate: booking.preferreddate,
        preferredtime: booking.preferredtime
      }
    });
  } catch (error) {
    console.error("Error saving booking:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
