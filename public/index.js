const express = require('express');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const crypto = require('crypto');
const mongoose = require('mongoose');
const app = express();
dotenv.config();
const path = require('path');

// Middleware
app.use(express.json());
app.use(express.static('public'));

// MongoDB Setup
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err));

// MongoDB Schema and Model
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});
 
const User = mongoose.model('User', userSchema);

let otpStorage = {}; // Temporary storage for OTP

// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

// Routes

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Register Route (send OTP)
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    const otp = generateOTP();

    // Store OTP temporarily in the otpStorage object
    otpStorage[email] = otp;

    
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        return res.status(400).json({ error: 'User already exists with this email' });
    }


    // Send OTP via email
    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'Registration OTP',
        text: `Your OTP for registration is: ${otp}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).json({ error: 'Failed to send OTP' });
        }
        res.json({ message: 'OTP sent! Please verify.' });
    });
});

// OTP Verification and Registration
app.post('/register/verify', async (req, res) => {
    const { email, otp, password } = req.body;

    // Check if OTP is valid
    if (otpStorage[email] !== otp) {
        return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user and save to MongoDB
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    // Remove OTP from storage after successful verification
    delete otpStorage[email];

    res.json({ message: 'Registration successful' });
});

// Login Route (send OTP)
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ error: 'User not found' });
    }

    // Verify password
    bcrypt.compare(password, user.password, (err, result) => {
        if (err) return res.status(500).json({ error: 'Internal error' });
        if (!result) return res.status(400).json({ error: 'Invalid credentials' });

        // Create JWT token for session management
        const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Login successful', token });
    });
});

// Utility function to generate OTP
function generateOTP() {
    return crypto.randomInt(100000, 999999).toString(); // Random 6-digit OTP
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
