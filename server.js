const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// استخدام المفتاح العام للإنشاء كما هو محدد في التوثيق
const SHA7NAWY_PUBLIC_KEY = process.env.SHA7NAWY_PUBLIC_KEY;
const SHA7NAWY_URL = 'https://gate.sha7nawy.com/api/payment/create';

app.get('/', (req, res) => {
  res.send('TukTuk Server Running 🚀');
});

app.post('/api/create-charge', async (req, res) => {
  try {
    const { driverPhone, amount, method } = req.body;

    if (!driverPhone || !amount) {
      return res.status(400).json({ error: 'يرجى إدخال رقم الهاتف والمبلغ' });
    }

    // تحديد نوع المحفظة تلقائياً إذا لم يتم إرسالها
    let walletMethod = method || 'vf_cash';
    if (!method && driverPhone.startsWith('011')) walletMethod = 'et_cash';
    if (!method && driverPhone.startsWith('012')) walletMethod = 'or_cash';

    const payload = {
      number: driverPhone,
      amount: parseFloat(amount),
      method: walletMethod,
      client: driverPhone,
      details: `شحن محفظة توك توك - ${driverPhone}`,
      webhook_url: `https://${req.get('host')}/api/webhook/sha7nawy`
    };

    const response = await axios.post(SHA7NAWY_URL, payload, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': SHA7NAWY_PUBLIC_KEY
      }
    });

    res.json(response.data);
  } catch (err) {
    const errorData = err.response ? err.response.data : { message: err.message };
    console.error('Sha7nawy Error:', errorData);
    res.status(500).json({ error: 'فشل إنشاء الدفع', details: errorData });
  }
});

app.post('/api/webhook/sha7nawy', (req, res) => {
  console.log('Webhook payload:', req.body);
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on ${PORT}`));

