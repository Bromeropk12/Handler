import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import marketLineRoutes from './routes/marketLines.js';
import shelfRoutes from './routes/shelves.js';
import globalSampleRoutes from './routes/globalSamples.js';
import dispensedSampleRoutes from './routes/dispensedSamples.js';
import movementRoutes from './routes/movements.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/market-lines', marketLineRoutes);
app.use('/api/shelves', shelfRoutes);
app.use('/api/global-samples', globalSampleRoutes);
app.use('/api/dispensed-samples', dispensedSampleRoutes);
app.use('/api/movements', movementRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

export default app;