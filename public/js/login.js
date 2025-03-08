const greetingBox = document.getElementById("greeting-container");
const formContainer = document.getElementById("form-container");
const toggleFormButton = document.getElementById("toggle-form");
const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");
const loginSection = document.getElementById("login-section");
const successMessage = document.querySelector(".success-message");
const emailInput = document.getElementById("signup-email");
const emailStatus = document.getElementById("email-status");

emailStatus.textContent = "❌";
emailStatus.classList.add("error");

// Predefined users (for demonstration)
const users = {
  "admin@example.com": "admin123",
  "user@example.com": "user123",
};
let currentRole = "user123";

// Toggle between Sign-Up and Log-In forms
toggleFormButton.addEventListener("click", () => {
  const isLoginActive = greetingBox.classList.contains("active");

  if (isLoginActive) {
    // Switch to Sign-Up Mode
    greetingBox.classList.remove("active");
    formContainer.classList.remove("active");
    greetingBox.querySelector("#greeting-title").textContent = "Hello, Friend!";
    greetingBox.querySelector("#greeting-message").textContent =
      "New here? Sign up now!";
    toggleFormButton.textContent = "Already have an account";
    signupForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
  } else {
    // Switch to Log-In Mode
    greetingBox.classList.add("active");
    formContainer.classList.add("active");
    greetingBox.querySelector("#greeting-title").textContent = "Welcome Back!";
    greetingBox.querySelector("#greeting-message").textContent =
      "Already have an account? Log in here!";
    toggleFormButton.textContent = "New User";
    signupForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
  }
});

// Handle Sign-Up Form Submission
signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("signup-name").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;

  // Save user details (you can replace this with a server API call)
  if (!users[email]) {
    users[email] = password;
    verificationSection();
    // alert(`Welcome, ${name}! Your account has been created.`);
    toggleFormButton.click(); // Switch to login form
  } else {
    alert("User already exists. Please log in.");
  }
});


function verificationSection() {
  const verificationElement = document.getElementById("verification");
  const continueBtn = document.getElementById("continue-btn");
  const emailStatus = document.getElementById("email-status");
  
  greetingBox.classList.add("hidden");
  formContainer.classList.add("hidden");
  verificationElement.classList.remove("hidden");
  loginSection.classList.add("improve");

  // Add event listeners to each OTP input field
  document.querySelectorAll(".otp-input").forEach((input, index, inputs) => {
    input.addEventListener("input", (e) => {
      if (e.target.value.length === 1 && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }

      if (!/^\d$/.test(e.target.value) && e.target.value !== "") {
        e.target.value = "";
        document.getElementById("error-message").textContent =
          "Please enter a valid numeric value.";
      } else {
        document.getElementById("error-message").textContent = "";
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && e.target.value === "") {
        if (index > 0) {
          inputs[index - 1].focus();
        }
      }
    });
  });

  // Handle form submission
  document
    .getElementById("verification-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      const otp = Array.from(document.querySelectorAll(".otp-input"))
        .map((input) => input.value)
        .join("");

      const errorMessage = document.getElementById("error-message");

      if (otp.length === 4 && /^\d{4}$/.test(otp)) {
        errorMessage.textContent = "";
        success();
      } else {
        errorMessage.textContent = "Please enter a valid 4-digit OTP.";
      }
    });

  document
    .getElementById("resend-link")
    .addEventListener("click", function (e) {
      e.preventDefault();
      alert("Verification code has been resent!");
      document.querySelectorAll(".otp-input").forEach((otp) => {
        otp.value = "";
      });
    });

  function success() {
    verificationElement.classList.add("hidden");
    successMessage.classList.remove("hidden");
    emailStatus.classList.add("verified");
    emailStatus.textContent = "✔️"; // Right tick

    continueBtn.addEventListener("click", () => {
      successMessage.classList.add("hidden");
      greetingBox.classList.remove("hidden");
      formContainer.classList.remove("hidden");
      loginSection.classList.remove("improve")
    });
  }
}

// Handle Log-In Form Submission
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  // Authenticate user
  if (users[email] && users[email] === password) {
    alert("Login successful! Redirecting to your dashboard...");
  } else {
    alert("Invalid credentials. Please try again.");
  }
});


// function updateDashboardView() {
//   const resourcesSection = document.getElementById("resources");
//   const requestsSection = document.getElementById("requests");
//   const adminRequestsList = document.getElementById("admin-requests-list");
//   const pandemicSection = document.getElementById("pandemic");

//   if (currentRole === "admin123") {
//     resourcesSection.classList.remove("hidden");
//     adminRequestsList.classList.remove("hidden");
//     requestsSection.classList.add("hidden");
//     pandemicSection.classList.remove("hidden");
//   } else {
//     resourcesSection.classList.add("hidden");
//     adminRequestsList.classList.add("hidden");
//     requestsSection.classList.remove("hidden");
//     pandemicSection.classList.remove("hidden");
//   }
// }
// document.getElementById("request-form").addEventListener("submit", (e) => {
//   e.preventDefault();
//   const resource = document.getElementById("resource").value;
//   const quantity = parseInt(document.getElementById("quantity").value);
//   const availableResources = {
//     food: parseInt(document.getElementById("food-count").textContent),
//     water: parseInt(document.getElementById("water-count").textContent),
//     medicine: parseInt(document.getElementById("medicine-count").textContent),
//   };

//   if (quantity > availableResources[resource]) {
//     showError(`Only ${availableResources[resource]} units available.`);
//   } else {
//     const requestList = document.getElementById("request-list");
//     const li = document.createElement("li");
//     li.textContent = `Requested ${quantity} units of ${resource}`;
//     requestList.appendChild(li);
//     showError("");
//   }
// });

// function showError(message) {
//   const errorMessage = document.getElementById("error-message");
//   if (message) {
//     errorMessage.textContent = message;
//     errorMessage.classList.remove("hidden");
//   } else {
//     errorMessage.classList.add("hidden");
//   }
// }
// const checkPandemicBtn = document.getElementById("check-pandemic-btn");
// const displayPandemic = document.querySelector(".display-pandemic");

// checkPandemicBtn.addEventListener("click", () => {
//   checkPandemicBtn.classList.add("hidden");
//   displayPandemic.classList.add("slide-down");
//   displayPandemic.classList.remove("hidden");
// });
// document.getElementById("back-btn").addEventListener("click", () => {
//   location.reload();
// });

// document.getElementById("check-pandemic-btn").addEventListener("click", () => {
//   // alert("Fetching Pandemic Data...");
// });

// document
//   .getElementById("update-resources-form")
//   .addEventListener("submit", (e) => {
//     e.preventDefault();
//     const resourceType = document.getElementById("resource-type").value;
//     const newQuantity = parseInt(document.getElementById("new-quantity").value);
//     document.getElementById(`${resourceType}-count`).textContent = newQuantity;
//     alert("Resource updated!");
//   });

// document
//   .getElementById("request-form")
//   .addEventListener("submit", function (e) {
//     e.preventDefault();
//     const resource = document.getElementById("resource").value;
//     const quantity = parseInt(document.getElementById("quantity").value);
//     const li = document.createElement("li");
//     li.textContent = `Requested ${quantity} units of ${resource}`;
//     document.getElementById("request-list").appendChild(li);
//   });

