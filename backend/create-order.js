// backend/create-order.js
// Simple Express backend endpoint for Razorpay order creation

const express = require('express');
const Razorpay = require('razorpay');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID, // set in .env
  key_secret: process.env.RAZORPAY_KEY_SECRET, // set in .env
});

app.post('/create-order', async (req, res) => {
  try {
    const { amount, currency, receipt, notes } = req.body;
    const order = await razorpay.orders.create({
      amount,
      currency: currency || 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
    });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Razorpay backend running on port ${PORT}`);
});
