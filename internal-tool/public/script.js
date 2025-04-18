document.addEventListener("DOMContentLoaded", async () => {
    const bookingsTableBody = document.querySelector("#bookingsTable tbody");
    const statusFilter = document.querySelector("#statusFilter");

    let bookings = [];

    // Fetch bookings from the API
    async function fetchBookings() {
        try {
            const response = await fetch("https://stratoslux-backend.onrender.com/api/bookings");
            bookings = await response.json();
            displayBookings(bookings);
        } catch (error) {
            console.error("Error fetching bookings:", error);
        }
    }

    // Display bookings in the table
    function displayBookings(filteredBookings) {
        bookingsTableBody.innerHTML = ""; // Clear existing rows

        filteredBookings.forEach(booking => {
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
    }

    // Filter bookings based on the selected status
    statusFilter.addEventListener("change", () => {
        const selectedStatus = statusFilter.value;

        if (selectedStatus === "all") {
            displayBookings(bookings);
        } else {
            const filteredBookings = bookings.filter(booking => booking.status === selectedStatus);
            displayBookings(filteredBookings);
        }
    });

    // Fetch and display bookings on page load
    fetchBookings();
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