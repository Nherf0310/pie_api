import express from 'express';
import pieRoutes from './pieRoutes';
import dotenv from 'dotenv';
import authRoutes from './authRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/pies', pieRoutes);
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Pie API server running on http://localhost:${PORT}`);
});