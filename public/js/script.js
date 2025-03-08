const signupForm = document.getElementById("signup-form");
const verificationSection = document.getElementById("verification");
const otpForm = document.getElementById("otp-form");
const otpInputs = document.querySelectorAll(".otp-input");
const signupError = document.getElementById("signup-error");
const otpError = document.getElementById("otp-error");

// Send OTP (Sign-Up Form Submission)
signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value.trim();

    if (!name || !email || !password) {
        signupError.textContent = "All fields are required.";
        return;
    }

    try {
        const response = await fetch("http://localhost:5000/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message); // Show success message
            localStorage.setItem("signupEmail", email); // Save email temporarily
            switchToVerification();
        } else {
            signupError.textContent = data.error || "Failed to send OTP.";
        }
    } catch (error) {
        console.error("Error:", error);
        signupError.textContent = "Something went wrong. Please try again.";
    }
});

// Switch to OTP Verification Section
function switchToVerification() {
    signupForm.classList.add("hidden");
    verificationSection.classList.remove("hidden");
    signupError.textContent = "";
}

// OTP Verification
otpForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = localStorage.getItem("signupEmail"); // Retrieve email
    const otp = [...otpInputs].map((input) => input.value).join("");

    if (otp.length !== 6) {
        otpError.textContent = "Please enter a valid 6-digit OTP.";
        return;
    }

    try {
        const response = await fetch("http://localhost:5000/validate-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp }),
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            localStorage.removeItem("signupEmail"); // Clear stored email
            window.location.href = "/login"; // Redirect to login page or dashboard
        } else {
            otpError.textContent = data.error || "OTP verification failed.";
        }
    } catch (error) {
        console.error("Error verifying OTP:", error);
        otpError.textContent = "Error verifying OTP. Please try again.";
    }
});

// Auto-focus OTP inputs
otpInputs.forEach((input, index, inputs) => {
    input.addEventListener("input", (e) => {
        if (e.target.value.length === 1 && index < inputs.length - 1) {
            inputs[index + 1].focus();
        }
    });
});
