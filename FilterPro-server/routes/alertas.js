const express = require('express');
const router = express.Router();
const pool = require('../db');

// Listar todas las alertas (panel admin)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, u.nom_usu1, u.correo_usu, p.nom_producto, p.stock_producto
      FROM alerta_stock a
      JOIN usuario u ON a.id_usuario = u.id_usuario
      JOIN producto p ON a.id_producto = p.id_producto
      ORDER BY a.fecha_solicitud DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear una alerta de stock para un usuario
router.post('/', async (req, res) => {
  const { id_usuario, id_producto } = req.body;
  try {
    const existe = await pool.query(
      'SELECT id_alerta FROM alerta_stock WHERE id_usuario=$1 AND id_producto=$2 AND notificado=false',
      [id_usuario, id_producto]
    );
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'Ya tienes una alerta para este producto.' });
    }
    const result = await pool.query(
      'INSERT INTO alerta_stock (id_usuario, id_producto) VALUES ($1,$2) RETURNING *',
      [id_usuario, id_producto]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
