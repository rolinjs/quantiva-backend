import { Router } from 'express';
import { healthDb } from '../controller/health.controller.js';

const router = Router();

router.get('/db', healthDb);

export default router;
