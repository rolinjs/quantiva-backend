import { pool } from '../config/db.js';

export const checkDb = async () => {
  const { rows } = await pool.query(
    'SELECT current_database(), inet_server_addr()'
  );
  return rows[0];
};
