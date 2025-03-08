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

const popup = document.getElementById("popup");
const popupText = document.getElementById("popup-text");
const closePopupButton = document.getElementById("close-popup");

closePopupButton.addEventListener("click", () => {
  popup.style.display = "none";
});

function showPopupMessage(message) {
  popupText.textContent = message;
  popup.style.display = "flex";
}

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

  const signupNameError = document.getElementById("signup-name-error");
  const signupEmailError = document.getElementById("signup-email-error");
  const signupPasswordError = document.getElementById("signup-password-error");

  let isValid = true;

  if (!name) {
    signupNameError.textContent = "Name is required";
    isValid = false;
  } else {
    signupNameError.textContent = "";
  }

  if (!email) {
    signupEmailError.textContent = "Email is required";
    isValid = false;
  } else {
    signupEmailError.textContent = "";
  }

  if (!password) {
    signupPasswordError.textContent = "Password is required";
    isValid = false;
  } else {
    signupPasswordError.textContent = "";
  }

  if (isValid) {
    if (!users[email]) {
      users[email] = password;
      verificationSection();
      showPopupMessage(`Welcome, ${name}! Your account has been created.`);
      toggleFormButton.click(); // Switch to login form
    } else {
      showPopupMessage("User already exists. Please log in.");
    }
  }
});

//   function verificationSection() {
//     const verificationElement = document.getElementById("verification");
//     const continueBtn = document.getElementById("continue-btn");
//     const emailStatus = document.getElementById("email-status");

//     greetingBox.classList.add("hidden");
//     formContainer.classList.add("hidden");
//     verificationElement.classList.remove("hidden");
//     loginSection.classList.add("improve");

//   }
function verificationSection() {
  const verificationElement = document.getElementById("verification");
  const continueBtn = document.getElementById("continue-btn");
  const emailStatus = document.getElementById("email-status");

  greetingBox.classList.add("hidden");
  formContainer.classList.add("hidden");
  verificationElement.classList.remove("hidden");
  loginSection.classList.add("improve");

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
      showPopupMessage("Verification code has been resent!");
      document.querySelectorAll(".otp-input").forEach((otp) => {
        otp.value = "";
      });
    });

  function success() {
    verificationElement.classList.add("hidden");
    successMessage.classList.remove("hidden");
    emailStatus.classList.add("verified");
    emailStatus.textContent = "✔️";

    continueBtn.addEventListener("click", () => {
      successMessage.classList.add("hidden");
      greetingBox.classList.remove("hidden");
      formContainer.classList.remove("hidden");
      loginSection.classList.remove("improve");
    });
  }
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  const loginEmailError = document.getElementById("login-email-error");
  const loginPasswordError = document.getElementById("login-password-error");

  let isValid = true;

  if (!email) {
    loginEmailError.textContent = "Email is required";
    isValid = false;
  } else {
    loginEmailError.textContent = "";
  }

  if (!password) {
    loginPasswordError.textContent = "Password is required";
    isValid = false;
  } else {
    loginPasswordError.textContent = "";
  }

  if (isValid) {
    if (users[email] && users[email] === password) {
      showPopupMessage("Login successful! Redirecting to your dashboard...");
    } else {
      showPopupMessage("Invalid credentials. Please try again.");
    }
  }
});
