require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const contentHandler = require('./api/content');
const loginHandler = require('./api/login');
const { isAuthorized } = require('./api/auth-util');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Endpoints
app.all('/api/content', (req, res) => contentHandler(req, res));
app.all('/api/login', (req, res) => loginHandler(req, res));

// Auth Check Endpoint
app.get('/api/auth/check', (req, res) => {
  const authorized = isAuthorized(req);
  return res.json({ authenticated: authorized });
});

// Admin Route handlers
app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Serve static assets and files
app.use(express.static(path.join(__dirname)));

// Root handler
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 fallback for admin
app.use('/admin/*', (req, res) => {
  res.redirect('/admin');
});

// Start Server
app.listen(PORT, () => {
  console.log('==================================================');
  console.log(`🚀 MHP Web Sitesi & Yönetim Paneli Yayında!`);
  console.log(`🌐 Ana Sayfa:     http://localhost:${PORT}`);
  console.log(`🔒 Admin Paneli:  http://localhost:${PORT}/admin`);
  console.log(`🔑 Giriş Şifresi: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
  console.log('==================================================');
});
