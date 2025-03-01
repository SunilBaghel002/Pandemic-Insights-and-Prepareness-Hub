const email = localStorage.getItem("email");
const requests = []; //global array of requests

async function getRequestsFromAPI() {
  try {
    const response = await fetch("http://localhost:5000/requests"); // Replace with your actual API URL
    const data = await response.json();

    // Transform the data to match the expected structure
    const transformedData = data.map((item) => ({
      request_id: item.request_id,
      name: item.name, // Assuming the API provides the user's name
      user_id: item.contactInformation, // Assuming contactInformation is the email
      status: item.status || "Pending", // Default to 'Pending' if status is not provided
      description: item.description,
      createdOn: item.createdAt, // Using createdAt to store the creation date
    }));

    // Update the global requests array
    requests.push(...transformedData);

    // Log the updated requests array here
    console.log(requests); // You should see the array populated now

    // Now call displayRequests() after the data is fetched and requests is updated
    displayRequests();
  } catch (error) {
    console.error("Error fetching requests:", error);
  }
}

// Display requests in the table
function displayRequests() {
  const tableBody = document.querySelector("#requestTable tbody");
  tableBody.innerHTML = ""; // Clear the table before appending new data

  requests.forEach((request) => {
    const row = document.createElement("tr");
    const createdDate = new Date(request.createdOn).toLocaleDateString(); // Format date as needed

    row.innerHTML = `
            <td>${request.request_id}</td>
            <td>${request.name}</td>
            <td>${request.user_id}</td>
            <td>${request.status}</td>
            <td>${createdDate}</td>  <!-- Added 'Created On' column -->
            <td>
                <button class="button" onclick="viewRequest(${request.request_id})">View</button>
                <button class="button" onclick="openUpdateModal(${request.request_id})">Update</button>
            </td>
        `;
    tableBody.appendChild(row);
  });
}

// Call the function to fetch and update the requests array
getRequestsFromAPI();

// Rest of the code remains unchanged

// Approve request and update status

// Filter requests based on user ID input
function filterRequests() {
  const searchInput = document.getElementById("search").value.toLowerCase();
  const filteredRequests = requests.filter((request) =>
    request.user_id.toLowerCase().includes(searchInput)
  );

  const tableBody = document.querySelector("#requestTable tbody");
  tableBody.innerHTML = "";

  filteredRequests.forEach((request) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${request.request_id}</td>
            <td>${request.user_id}</td>
            <td>${request.status}</td>
            <td>
                <button class="button" onclick="viewRequest(${request.request_id})">View</button>
                <button class="button" onclick="openUpdateModal(${request.request_id})">Update</button>
            </td>
        `;
    tableBody.appendChild(row);
  });
}

// View request details
function viewRequest(requestId) {
  const request = requests.find((req) => req.request_id === requestId);
  if (request) {
    const details = `
            <strong>Request ID:</strong> ${request.request_id}<br>
            <strong>User ID:</strong> ${request.user_id}<br>
            <strong>Status:</strong> ${request.status}<br>
            <strong>Description:</strong> ${request.description}
        `;
    document.getElementById("requestDetails").innerHTML = details;
    document.getElementById("viewRequestModal").style.display = "flex";
  }
}

// Open the update modal for changing status (approve/reject)
function openUpdateModal(requestId) {
  const request = requests.find((req) => req.request_id === requestId);
  if (request) {
    const details = `
            <strong>Request ID:</strong> ${request.request_id}<br>
            <strong>User ID:</strong> ${request.user_id}<br>
            <strong>Status:</strong> ${request.status}<br>
            <strong>Description:</strong> ${request.description}
        `;
    document.getElementById("requestDetails").innerHTML = details;

    // Show approve/reject buttons
    document.getElementById("updateButtons").style.display = "flex";
    document.getElementById("viewRequestModal").style.display = "flex";

    // Assign requestId for updating
    document
      .getElementById("viewRequestModal")
      .setAttribute("data-request-id", requestId);
  }
}

// Approve request and update status
// Approve request and update status
// Approve request and update status
async function approveRequest() {
  const requestId = document
    .getElementById("viewRequestModal")
    .getAttribute("data-request-id");
  const request = requests.find((req) => req.request_id === Number(requestId));

  if (request) {
    // Send a PUT request to update the request status to 'Approved'
    try {
      const response = await fetch(
        `http://localhost:5000/requests/${requestId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "Approved", email: email }), // Update status to Approved
        }
      );

      if (response.ok) {
        const updatedRequest = await response.json();
        // Update the status in the frontend after successful update
        request.status = updatedRequest.status;
        displayRequests(); // Refresh the requests table
        closeModal("viewRequestModal"); // Close modal
        location.reload(); // Reload the page
      } else {
        console.error("Failed to approve the request");
      }
    } catch (error) {
      console.error("Error approving request:", error);
    }
  }
}

// Reject request and update status
async function rejectRequest() {
  const requestId = document
    .getElementById("viewRequestModal")
    .getAttribute("data-request-id");
  const request = requests.find((req) => req.request_id === Number(requestId));

  if (request) {
    // Send a PUT request to update the request status to 'Rejected'
    try {
      const response = await fetch(
        `http://localhost:5000/requests/${requestId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "Rejected", email: email }), // Update status to Rejected
        }
      );

      if (response.ok) {
        const updatedRequest = await response.json();
        // Update the status in the frontend after successful update
        request.status = updatedRequest.status;
        displayRequests(); // Refresh the requests table
        closeModal("viewRequestModal"); // Close modal
        location.reload(); // Reload the page
      } else {
        console.error("Failed to reject the request");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  }
}

// Open the modal to add a new request
function openAddRequestModal() {
  document.getElementById("addRequestModal").style.display = "block";
}

// Close the modal
function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

// Handle adding a new request
document
  .getElementById("addRequestForm")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent form submission

    const userId = document.getElementById("userId").value;
    const description = document.getElementById("description").value;

    const newRequest = {
      request_id: requests.length + 1,
      user_id: userId,
      status: "Pending",
      description: description,
    };

    requests.push(newRequest); // Add the new request to the list
    displayRequests(); // Refresh the requests table
    closeModal("addRequestModal"); // Close the modal
    document.getElementById("addRequestForm").reset(); // Reset the form
  });

// Show the request form when clicking the "Manage Requests" button
document
  .getElementById("showFormButton")
  .addEventListener("click", function () {
    const formContainer = document.getElementById("requestFormContainer");
    formContainer.style.display = "block";
    formContainer.classList.add("slide-down");
    this.style.display = "none";
  });

// Close modals if clicking outside
window.onclick = function (event) {
  const modals = document.querySelectorAll(".modal");
  modals.forEach((modal) => {
    if (event.target === modal) {
      closeModal(modal.id);
    }
  });
};

// Initially display requests
displayRequests();

document
  .getElementById("showFormButton")
  .addEventListener("click", function () {
    const formContainer = document.getElementById("requestFormContainer");
    const manageRequestElement = document.querySelector(".manage-request");
    formContainer.style.display = "block";
    formContainer.classList.add("slide-down");
    this.style.display = "none";
    manageRequestElement.style.display = "none";
  });
