const express = require('express');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Connection URL and database name
const url = 'mongodb+srv://dhinakaran75493:dhinakaran75493@login-register.lkjv8kv.mongodb.net/Loginpage?retryWrites=true&w=majority';
const dbName = 'Loginpage';

// Create a reusable MongoDB Atlas client
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

// Helper function to connect to the MongoDB Atlas cluster
async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
  } catch (error) {
    console.error('Failed to connect to MongoDB Atlas', error);
  }
}

// Signup endpoint
app.post('/signup', async (req, res) => {
    try {
      const { firstName, lastName, email, password  } = req.body;
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Connect to the database
      const db = client.db(dbName);
  
      // Check if the email already exists
      const user = await db.collection('users').findOne({ email });
      if (user) {
        return res.status(400).json({ message: 'Email already exists' });
      }
  
      // Create a new user
      await db.collection('users').insertOne({ email, password: hashedPassword, firstName, lastName });
  
      res.status(200).json({ message: 'User created successfully' });
    } catch (error) {
      console.error('Error during signup', error);
      res.status(500).json({ message: 'Error during signup' });
    }
});
  

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Connect to the database
    const db = client.db(dbName);

    // Find the user by email
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email not found' });
    }

    // Check if the password is correct
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error('Error during login', error);
    res.status(500).json({ message: 'Error during login' });
  }
});

// Forgot password endpoint
// Forgot password endpoint
app.post('/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
  
      // Connect to the database
      const db = client.db(dbName);
  
      // Find the user by email
      const user = await db.collection('users').findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Email not found' });
      }
  
      // Generate a unique password reset token
      const resetToken = generateResetToken();
  
      // Store the reset token in the database
      await db.collection('users').updateOne({ email }, { $set: { resetToken } });
  
      // Generate the password reset link
      const resetLink = `http://localhost:3000/update-password?email=${email}&token=${resetToken}`;
  
      // Send the password reset email
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: "gokudhinakaran@gmail.com",
            pass: "prikruyyuhjhozhk",
          },
      });
  
      const mailOptions = {
        from: "gokudhinakaran@gmail.com",
        to: email,
        subject: 'Password Reset',
        text: `Click the following link to reset your password: ${resetLink}`,
      };
  
      await transporter.sendMail(mailOptions);
  
      res.status(200).json({ message: 'Password reset link sent' });
    } catch (error) {
      console.error('Error during password reset', error);
      res.status(500).json({ message: 'Error during password reset' });
    }
  });
  
  // Function to generate a random reset token
  function generateResetToken() {
    // Generate a random string of desired length
    const length = 16;
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let resetToken = '';
    for (let i = 0; i < length; i++) {
      resetToken += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return resetToken;
  }
  

// Password update endpoint
app.post('/update-password', async (req, res) => {
    try {
      const { newPassword, confirmPassword } = req.body;
  
      // Check if the new password and confirm password match
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'New password and confirm password do not match' });
      }
  
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
  
      // Connect to the database
      const db = client.db(dbName);
  
      // Update the user's password (you may need to identify the user by some unique identifier like their email or user ID)
      await db.collection('users').updateOne({ email: 'example@example.com' }, { $set: { password: hashedPassword } });
  
      res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error during password update', error);
      res.status(500).json({ message: 'Error during password update' });
    }
  });
  
  

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
  connectToDatabase();
});
