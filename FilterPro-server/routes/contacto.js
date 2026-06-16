const express = require('express');
const router = express.Router();
const pool = require('../db');

// Recibir mensaje del formulario de contacto
router.post('/', async (req, res) => {
  const { nombre, correo, asunto, mensaje } = req.body;
  if (!nombre || !correo || !mensaje) {
    return res.status(400).json({ error: 'Nombre, correo y mensaje son obligatorios.' });
  }
  try {
    await pool.query(
      `INSERT INTO notificacion (mensaje_notificacion, tipo_notificacion)
       VALUES ($1, 'contacto')`,
      [`De: ${nombre} (${correo}) | Asunto: ${asunto} | ${mensaje}`]
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar mensajes de contacto recibidos (para el panel admin)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notificacion WHERE tipo_notificacion = 'contacto' ORDER BY fecha_envio DESC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
