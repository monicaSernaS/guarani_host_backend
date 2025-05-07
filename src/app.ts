import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas base (se agregarán después)
// app.use('/api/users', userRoutes);
// app.use('/api/homes', homeRoutes);
// app.use('/api/tours', tourRoutes);

export default app;
