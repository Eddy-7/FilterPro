const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const { id_marca, id_modelo, id_tipo_vehiculo, id_tipo_filtro, solo_activos } = req.query;

    let query = `
      SELECT DISTINCT p.*, tf.nom_filtro, tv.nom_vehiculo
      FROM producto p
      LEFT JOIN tipo_filtro tf ON p.id_tipo_filtro = tf.id_tipo_filtro
      LEFT JOIN tipo_vehiculo tv ON p.id_tipo_vehiculo = tv.id_tipo_vehiculo
    `;

    const conditions = [];
    const params = [];

    if (solo_activos === 'true') {
      conditions.push(`p.est_producto = 'activo'`);
    }

    if (id_marca || id_modelo) {
      query += ` JOIN compatibilidad_producto cp ON cp.id_producto = p.id_producto`;
      if (id_marca) {
        params.push(id_marca);
        conditions.push(`cp.id_marca = $${params.length}`);
      }
      if (id_modelo) {
        params.push(id_modelo);
        conditions.push(`cp.id_modelo = $${params.length}`);
      }
    }

    if (id_tipo_vehiculo) {
      params.push(id_tipo_vehiculo);
      conditions.push(`p.id_tipo_vehiculo = $${params.length}`);
    }

    if (id_tipo_filtro) {
      params.push(id_tipo_filtro);
      conditions.push(`p.id_tipo_filtro = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY p.id_producto ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM producto WHERE id_producto = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { nom_producto, des_producto, pre_producto, stock_producto, est_producto, id_tipo_filtro, id_tipo_vehiculo } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO producto (nom_producto, des_producto, pre_producto, stock_producto, est_producto, id_tipo_filtro, id_tipo_vehiculo)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [nom_producto, des_producto, pre_producto, stock_producto || 0, est_producto || 'activo', id_tipo_filtro, id_tipo_vehiculo]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const { nom_producto, des_producto, pre_producto, stock_producto, est_producto } = req.body;
  try {
    const result = await pool.query(
      `UPDATE producto SET nom_producto=$1, des_producto=$2, pre_producto=$3,
       stock_producto=$4, est_producto=$5 WHERE id_producto=$6 RETURNING *`,
      [nom_producto, des_producto, pre_producto, stock_producto, est_producto, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM producto WHERE id_producto = $1', [req.params.id]);
    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;