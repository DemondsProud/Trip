const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected to:', process.env.MONGODB_URI);
  })
  .catch(err => {
    console.log('❌ MongoDB Error:', err.message);
    process.exit(1);
  });

app.use('/api/auth', require('./routes/auth'));
app.use('/api/trips', require('./routes/trips'));

app.use('/api/admin', require('./routes/admin'));
app.use('/api/search', require('./routes/search'));
app.use('/api/weather', require('./routes/weather'));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
