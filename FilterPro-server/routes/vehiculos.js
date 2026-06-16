const express = require('express');
const router = express.Router();
const pool = require('../db');

// Marcas por tipo de vehículo
router.get('/marcas', async (req, res) => {
  try {
    const { tipo_vehiculo } = req.query;
    let query = `
      SELECT m.id_marca, m.nom_marca 
      FROM marca_vehiculo m
      JOIN tipo_vehiculo tv ON m.id_tipo_vehiculo = tv.id_tipo_vehiculo
    `;
    const params = [];
    if (tipo_vehiculo) {
      query += ` WHERE tv.nom_vehiculo = $1`;
      params.push(tipo_vehiculo);
    }
    query += ` ORDER BY m.nom_marca ASC`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Modelos por marca
router.get('/modelos', async (req, res) => {
  try {
    const { id_marca } = req.query;
    if (!id_marca) return res.json([]);
    const result = await pool.query(
      `SELECT id_modelo, nom_modelo FROM modelo_vehiculo WHERE id_marca = $1 ORDER BY nom_modelo ASC`,
      [id_marca]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;