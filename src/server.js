import express, { json } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

//Routes

import routesCustomers from './routes/customers.routes.js';
import healthRoutes from './routes/health.routes.js';

dotenv.config();

const app = express();

// Permitir CORS
app.use(cors());

app.use(json());

// app.use('/bienvenido', (req, res) => {
//     res.json({msg: 'Bienvenido'})
// })

app.use('/api/customers', routesCustomers);

app.use('/health', healthRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
    console.log(`Servidor corriendo en puerto: http://localhost:${PORT}`)
    
)
