import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 4000;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true, service: 'auth-backend' });
});

app.use('/api/auth', authRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Auth backend running on http://localhost:${port}`);
});
