import { pool } from "../config/db.js";

export const createCustomersModel = async (data) => {
    const {
        nombres,
        apellidos,
        email,
        password_hash,
        verification_code,
        verification_expires
    } = data;

    const query = `
        INSERT INTO clientes 
        (nombres, apellidos, email, password_hash, verification_code, verified, verification_expires)
        VALUES ($1, $2, $3, $4, $5, false, $6)
        RETURNING *;
    `;

    const values = [
        nombres,
        apellidos,
        email,
        password_hash,
        verification_code,
        verification_expires
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
};

//Modelo para comprobar cliente

export const findCustomerByEmail = async (email) => {
    const sql = `SELECT * FROM clientes WHERE email = $1`;
    const { rows } = await pool.query(sql, [email]);
    return rows[0];
}


//Verificar cliente modelo
export const verifyCustomerCodeModel = async (email) => {
    const query = `
        UPDATE clientes 
        SET verified = true,
            verification_code = NULL,
            verification_expires = NULL
        WHERE email = $1
        RETURNING *;
    `;

    const result = await pool.query(query, [email]);
    return result.rows[0];
};

//model para obtener un solo rgeistro de cliente

export  const obtenerClienteIDModel = async (id) => {
    const sql = 'SELECT * FROM clientes WHERE id_uuid = $1';
    const { rows } = await pool.query(sql, [id]);
    return rows[0];
}

//Modelo para obtener cliente por ID

export const obtenerClientePorIdModel = async (id_uuid) => {
    const query = `
        SELECT id_uuid, nombres, apellidos, email, telefono, direccion 
        FROM clientes 
        WHERE id_uuid = $1
    `;

    const result = await pool.query(query, [id_uuid]);
    return result.rows[0];
};

export const saveResetTokenModel = async (email, tokenHash, expires) => {
    const query = `
        UPDATE clientes
        SET reset_token_hash = $1,
            reset_token_expires = $2
        WHERE email = $3
    `;
    return pool.query(query, [tokenHash, expires, email]);
};

export const findCustomerByResetToken = async (token) => {
    const query = `
        SELECT id_uuid, reset_token_expires
        FROM clientes
        WHERE reset_token_hash = $1
        LIMIT 1
    `;
    const { rows } = await pool.query(query, [token]);
    return rows[0];
};

export const updatePasswordById = async (id_uuid, password_hash) => {
    const query = `
        UPDATE clientes
        SET password_hash = $1,
            reset_token_hash = NULL,
            reset_token_expires = NULL
        WHERE id_uuid = $2
        RETURNING id_uuid;
    `;
    const { rows } = await pool.query(query, [password_hash, id_uuid]);
    return rows[0];
};

export const getAllCustomersModel = async () => {
    const sql = `SELECT * FROM clientes`;
    const { rows } = await pool.query(sql);
    return rows;
}