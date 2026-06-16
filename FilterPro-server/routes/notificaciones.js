const express = require('express');
const router = express.Router();
const pool = require('../db');

// Notificaciones de un usuario específico
router.get('/:id_usuario', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notificacion WHERE id_usuario = $1 ORDER BY fecha_envio DESC`,
      [req.params.id_usuario]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
