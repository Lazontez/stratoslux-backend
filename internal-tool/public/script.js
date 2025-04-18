document.addEventListener("DOMContentLoaded", async () => {
  const bookingsTableBody = document.querySelector("#bookingsTable tbody");

  try {
      const response = await fetch("https://stratoslux-backend.onrender.com/api/bookings");
      const bookings = await response.json();

      bookings.forEach(booking => {
          const row = document.createElement("tr");

          row.innerHTML = `
              <td>${booking.id}</td>
              <td>${booking.customername}</td>
              <td>${booking.customeremail}</td>
              <td>${booking.customerphone}</td>
              <td>${booking.servicetype}</td>
              <td>${booking.preferredlocation}</td>
              <td>${new Date(booking.preferreddate).toLocaleDateString()}</td>
              <td>${booking.preferredtime}</td>
              <td>${booking.status || "Pending"}</td>
              <td>
                  <button onclick="updateStatus(${booking.id}, 'Completed')">Mark as Completed</button>
              </td>
          `;

          bookingsTableBody.appendChild(row);
      });
  } catch (error) {
      console.error("Error fetching bookings:", error);
  }
});

async function updateStatus(id, status) {
  try {
      const response = await fetch(`https://stratoslux-backend.onrender.com/api/bookings/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status })
      });

      if (response.ok) {
          alert("Status updated successfully!");
          location.reload(); 
      } else {
          alert("Failed to update status.");
      }
  } catch (error) {
      console.error("Error updating status:", error);
  }
}