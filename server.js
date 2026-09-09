const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const SHA7NAWY_API_KEY = process.env.SHA7NAWY_API_KEY;
const SHA7NAWY_BASE_URL = process.env.SHA7NAWY_BASE_URL || 'https://api.sha7nawy.com/v1';

app.get('/', (req, res) => {
  res.send('TukTuk Server Running 🚀');
});

app.post('/api/create-charge', async (req, res) => {
  try {
    const { driverPhone, amount } = req.body;
    if (!driverPhone || !amount) {
      return res.status(400).json({ error: 'بيانات ناقصة: الهاتف أو المبلغ' });
    }

    const response = await axios.post(`${SHA7NAWY_BASE_URL}/payments/create`, {
      amount: parseFloat(amount),
      currency: 'EGP',
      phone: driverPhone,
      callback_url: `https://${req.get('host')}/api/webhook/sha7nawy`,
      metadata: { driverPhone, amount }
    }, {
      headers: {
        'Authorization': `Bearer ${SHA7NAWY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const paymentUrl = response.data?.payment_url || response.data?.data?.payment_url || response.data?.url;
    res.json({ success: true, paymentUrl, raw: response.data });
  } catch (err) {
    // إرجاع رسالة الخطأ القادمة من شحنناوي مباشرة
    const errorDetails = err.response ? err.response.data : err.message;
    console.error('Sha7nawy Error:', errorDetails);
    res.status(500).json({
      error: 'فشل إنشاء الدفع',
      details: errorDetails
    });
  }
});

app.post('/api/webhook/sha7nawy', (req, res) => {
  console.log('Webhook received:', req.body);
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on ${PORT}`));
