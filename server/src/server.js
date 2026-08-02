import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

import { countUsers, getUserByEmail, getUserById, createUser, getAppData, upsertAppData } from './db.js';
import { signToken, setAuthCookie, clearAuthCookie, requireAuth } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;
// 0.0.0.0 por padrão pra não quebrar o docker-compose (o Caddy alcança o
// container pela rede interna, não por localhost). Atrás de um painel como
// CyberPanel/OpenLiteSpeed no mesmo host, defina HOST=127.0.0.1 no .env —
// só o proxy local precisa enxergar essa porta, não a internet.
const HOST = process.env.HOST || '0.0.0.0';
const STATIC_DIR = process.env.STATIC_DIR || path.join(__dirname, '../../app/dist');

const app = express();
app.set('trust proxy', 1); // atrás de Caddy/nginx, pra rate-limit e cookie secure funcionarem certo
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests' },
});

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// --- Autenticação -----------------------------------------------------

app.get('/api/setup-status', (req, res) => {
  res.json({ needsSetup: countUsers() === 0 });
});

app.post('/api/setup', authLimiter, (req, res) => {
  if (countUsers() > 0) {
    return res.status(409).json({ error: 'already_configured' });
  }
  const { email, password } = req.body ?? {};
  if (!isValidEmail(email)) return res.status(400).json({ error: 'invalid_email' });
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'weak_password' });
  }
  const hash = bcrypt.hashSync(password, 12);
  const userId = createUser(email, hash);
  setAuthCookie(res, signToken(userId));
  res.status(201).json({ email: email.trim().toLowerCase() });
});

app.post('/api/login', authLimiter, (req, res) => {
  const { email, password } = req.body ?? {};
  const user = typeof email === 'string' ? getUserByEmail(email) : null;
  if (!user || !bcrypt.compareSync(String(password ?? ''), user.password_hash)) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }
  setAuthCookie(res, signToken(user.id));
  res.json({ email: user.email });
});

app.post('/api/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

app.get('/api/me', requireAuth, (req, res) => {
  const user = getUserById(req.userId);
  if (!user) return res.status(401).json({ error: 'not_authenticated' });
  res.json({ email: user.email });
});

// --- Dados (settings + ledger, mesmo formato do export/import local) --

app.get('/api/data', requireAuth, (req, res) => {
  const row = getAppData(req.userId);
  res.json({
    settings: row ? JSON.parse(row.settings_json) : null,
    ledger: row ? JSON.parse(row.ledger_json) : null,
  });
});

app.put('/api/data', requireAuth, (req, res) => {
  const { settings, ledger } = req.body ?? {};
  if (typeof settings !== 'object' || settings === null || typeof ledger !== 'object' || ledger === null) {
    return res.status(400).json({ error: 'invalid_payload' });
  }
  upsertAppData(req.userId, JSON.stringify(settings), JSON.stringify(ledger));
  res.json({ ok: true });
});

// --- Front-end estático -------------------------------------------------

if (fs.existsSync(STATIC_DIR)) {
  app.use(express.static(STATIC_DIR));
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(STATIC_DIR, 'index.html'));
  });
} else {
  console.warn(`Aviso: ${STATIC_DIR} não existe ainda — rode "npm run build" em app/ antes de servir o front-end.`);
}

app.listen(PORT, HOST, () => {
  console.log(`Assistente Financeiro (server) ouvindo em http://${HOST}:${PORT}`);
});
