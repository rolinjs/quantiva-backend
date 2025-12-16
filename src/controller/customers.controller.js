import {
    createCustomersModel,
    findCustomerByEmail,
    verifyCustomerCodeModel,
    obtenerClienteIDModel,
    obtenerClientePorIdModel,
    saveResetTokenModel,
    updatePasswordById,
    findCustomerByResetToken,
    getAllCustomersModel
} from '../model/customers.model.js';

import { transporter } from '../config/mailer.js'
import { generateCode } from '../utils/generateCode.js'
import crypto from 'crypto';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

//Controlador para crear nuevo cliente

export const createCustomersController = async (req, res) => {
  try {
    const { nombres, apellidos, email, password_hash } = req.body;

    // VALIDACIÓN (con return)
    if (
      !nombres?.trim() ||
      !apellidos?.trim() ||
      !email?.trim() ||
      !password_hash?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos por completar'
      });
    }

    const clientEmail = await findCustomerByEmail(email);

    if(clientEmail) {
        return res.status(400).json({
            success: false,
            message: 'El email ya se encuentra registrado, intenta otro',
        });
    }

    const hashedPassword = await bcrypt.hash(password_hash, 10);
    const code = generateCode();
    const expiration = new Date(Date.now() + 10 * 60 * 1000);

    // GUARDAR CLIENTE
    const cliente = await createCustomersModel({
      nombres,
      apellidos,
      email: email.toLowerCase(),
      password_hash: hashedPassword,
      verification_code: code,
      verification_expires: expiration
    });

    // ENVIAR EMAIL EN SEGUNDO PLANO (SIN await)
    await transporter.sendMail({
      from: `"Quantiva" <TuCorreo@gmail.com>`,
      to: email,
      subject: "Código de verificación",
      html: `
        <h2>Bienvenido a Quantiva</h2>
        <p>Tu código de verificación es:</p>
        <h1>${code}</h1>
        <p>Este código expira en 10 minutos.</p>
      `
    })

    // RESPONDER AL FRONT PRIMERO
    res.status(201).json({
      success: true,
      message: 'Cliente registrado correctamente',
      data: cliente
    });

  } catch (error) {
    console.error("ERROR REGISTRO:", error);
    return res.status(500).json({
      success: false,
      message: 'Hubo un error en el servicio' + error.message
    });
  }
};


//Controlador para verificar codigo

export const verifyCodeController  = async (req, res) => {

    try {
        const { email, codigo } = req.body;
        if(!email || !codigo) {
            return res.status(400).json({
                success: false,
                message: 'Correo y código son obligatorio'
            });
        }

        //buscar cliente

        const cliente = await findCustomerByEmail(email);

        
        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: "El correo no está registrado"
            });
        }

        //Ya verificado?

        if (cliente.verified) {
            return res.status(400).json({
                success: false,
                message: "Este correo ya fue verificado"
            });
        }

        //Código correcto?

        if (cliente.verification_code !== codigo) {
            return res.status(400).json({
                success: false,
                message: "Código incorrecto"
            });
        }

        //Expiración

        const now = new Date();
        const exp = new Date(cliente.verification_expires);

        if (now > exp) {
            return res.status(400).json({
                success: false,
                message: "El código ha expirado"
            });
        }

        //Actualizar como verificado (USANDO EL MODELO)

        const updated = await verifyCustomerCodeModel(email);

        return res.status(200).json({
            success: true,
            message: "Correo verificado correctamente",
            data: updated
        });

    } catch (error) {
        console.log("ERROR VERIFICACIÓN:", error);
        return res.status(500).json({
            success: false,
            message: "Error en el servidor"
        });
    }

}

//controlador para obterner ID cliente

export  const obtenerClienteIDController = async (req, res) => {

    try {
        const { id } = req.params;

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        if(!id || !uuidRegex.test(id)) {
            res.status(400).json({
                success: false,
                message: 'El ID Proporcionado es incorrecto'
            })
        }

        const cliente = await obtenerClienteIDModel(id);

        if(!cliente) {
            res.status(404).json({
                success: false,
                message: 'El Cliente no existe'
            })
        }

        res.status(200).json({
            success: true,
            message: 'Cliente encontrado correctamente',
            data: cliente
        })
    } catch (error) {
        console.log('Hubo un error en el servidor');
        res.status(500).json({
            success: false,
            message: 'Hubo un error'
        })
    }

}

//controlador del login clientes

export  const loginCustomerController = async (req, res) => {
    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Correo y contraseña son incorrectos'
            })
        }

        const cliente = await findCustomerByEmail(email);

        if(!cliente) {
            return  res.status(404).json({
                success: false,
                message: 'Correo no registrado'
            });
        }

        if(!cliente.verified) {
            return  res.status(403).json({
                success: false,
                message: 'Correo no verificado'
            });
        }

        const match = await  bcrypt.compare(password, cliente.password_hash);

        if(!match) {
            return res.status(401).json({
                success: false,
                message: 'Contraseña Incorrecta'
            });
        }

        //Generar JWT
        const token = jwt.sign(
            { id_uuid: cliente.id_uuid, email: cliente.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );

        res.status(200).json({
            success: true,
            message: 'Login exitoso',
            data: {
                id_uuid: cliente.id_uuid,
                nombres: cliente.nombres,
                apellidos: cliente.apellidos,
                email: cliente.email,
                token //aqui envio el token al frontend
            }
        })
    }catch (error) {
        console.error('ERROR LOGIN:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
}

//Controlador para obtener Perfil de cliente

export const obtenerPerfilClienteController = async (req, res) => {
    try {
        // El UUID viene del token
        const { id_uuid } = req.user;

        const cliente = await obtenerClienteIDModel(id_uuid);

        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        return res.json({
            success: true,
            message: 'Perfil obtenido correctamente',
            data: cliente
        });

    } catch (error) {
        console.error('Error al obtener perfil:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno en el servidor'
        });
    }
};

export const forgotPasswordController = async (req, res) => {
    try {

        let { email } = req.body;

        //Respuesta Genérica siempre

        const genericResponse = {
            success: true,
            message: 'Si el correo existe, se enviarán instrucciones para restablecer la contraseña.'
        };

        if(!email) {
            return res.status(200).json(genericResponse);
        }

        email = email.toLowerCase().trim();

        //Buscar cliente

        const cliente = await findCustomerByEmail(email);

        //si no existe responde igual

        if(!cliente) {
            return res.status(200).json(genericResponse);
        }

        //generar token seguro

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        const expiration = new Date(Date.now() + 15 * 60 * 1000); // 15 min

        // Guardar token en BD
        await saveResetTokenModel(
            cliente.email,
            resetTokenHash,
            expiration
        );

        // Link al FRONT (NO backend)
        const resetLink = `${process.env.FRONTEND_URL}/restablecer.html?token=${resetToken}`;

        // Enviar email
        await transporter.sendMail({
            from: `"Quantiva" <rolindeveloper@gmail.com>`,
            to: cliente.email,
            subject: "Restablecer contraseña - Quantiva",
            html: `
                <h2>Recuperación de contraseña</h2>
                <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
                <p>Haz clic en el siguiente enlace:</p>
                <a href="${resetLink}">Restablecer contraseña</a>
                <p>Este enlace expirará en 15 minutos.</p>
                <p>Si no solicitaste este cambio, ignora este mensaje.</p>
            `
        });

        return res.status(200).json(genericResponse);

    } catch (error) {
        console.error('ERROR forgotPassword:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

export const resetPasswordController = async (req, res) => {
    try {
        const { token, password, confirmPassword } = req.body;

        if (!token || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Datos incompletos'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Las contraseñas no coinciden'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 8 caracteres'
            });
        }

        // HASHEAR EL TOKEN (IGUAL QUE EN VALIDATE)
        const tokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const cliente = await findCustomerByResetToken(tokenHash);

        if (!cliente) {
            return res.status(400).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }

        if (new Date() > new Date(cliente.reset_token_expires)) {
            return res.status(400).json({
                success: false,
                message: 'El token ha expirado'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await updatePasswordById(cliente.id_uuid, hashedPassword);

        return res.status(200).json({
            success: true,
            message: 'Contraseña actualizada correctamente'
        });

    } catch (error) {
        console.error('ERROR RESET PASSWORD:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};


export const validateResetTokenController = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token requerido'
            });
        }

        // Hashear token recibido
        const tokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const cliente = await findCustomerByResetToken(tokenHash);

        if (!cliente) {
            return res.status(400).json({
                success: false,
                message: 'El enlace no es válido o ha expirado'
            });
        }

        if (new Date() > new Date(cliente.reset_token_expires)) {
            return res.status(400).json({
                success: false,
                message: 'El enlace ha expirado'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Token válido'
        });

    } catch (error) {
        console.error('ERROR validateResetToken:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

export const getAllCustomersController = async (req, res) => {
  try {
    const customers = await getAllCustomersModel();
    res.json(customers);
  } catch (error) {
    console.error('ERROR getAllCustomers:', error.message);
    res.status(500).json({ message: 'Error al obtener clientes' });
  }
};