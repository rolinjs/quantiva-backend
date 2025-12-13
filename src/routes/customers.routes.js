import { Router } from 'express'

import {
    createCustomersController,
    verifyCodeController,
    obtenerClienteIDController,
    loginCustomerController,
    obtenerPerfilClienteController,
    forgotPasswordController,
    resetPasswordController,
    validateResetTokenController,
    getAllCustomersController
} from '../controller/customers.controller.js'
import { authenticateToken } from '../middleware/auth.js';


const router = Router();

// Registrar cliente + enviar código
//OBtener todos
router.get('/all', getAllCustomersController);

router.post('/created', createCustomersController);
// Verificar código recibido por correo
router.post('/verify-code', verifyCodeController);
//Obtener un solo ID
router.get('/one/:id', obtenerClienteIDController);
//Login
router.post('/login', loginCustomerController);
router.post('/forgot-password', forgotPasswordController);
router.post('/reset-password', resetPasswordController);
router.post('/validate-reset-token', validateResetTokenController);
// Ruta protegida
router.get('/perfil', authenticateToken, obtenerPerfilClienteController);

export default router;