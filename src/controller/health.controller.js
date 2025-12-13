import { checkDb } from '../model/health.model.js';

export const healthDb = async (req, res) => {
  try {
    const data = await checkDb();
    res.json({
      status: 'ok',
      database: data.current_database,
      server_ip: data.inet_server_addr
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed'
    });
  }
};
