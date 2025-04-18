

const response = await fetch("https://stratoslux-backend.onrender.com/api/bookings", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookingData)
  });


console.log(response)