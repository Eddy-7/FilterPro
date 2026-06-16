const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM proveedor ORDER BY id_proveedor ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { nom_proveedor, cont_proveedor, tel_proveedor, cor_proveedor, dir_proveedor } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO proveedor (nom_proveedor, cont_proveedor, tel_proveedor, cor_proveedor, dir_proveedor)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [nom_proveedor, cont_proveedor, tel_proveedor, cor_proveedor, dir_proveedor]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const { nom_proveedor, cont_proveedor, tel_proveedor, cor_proveedor, dir_proveedor, estado } = req.body;
  try {
    const result = await pool.query(
      `UPDATE proveedor SET nom_proveedor=$1, cont_proveedor=$2, tel_proveedor=$3,
       cor_proveedor=$4, dir_proveedor=$5, estado=$6 WHERE id_proveedor=$7 RETURNING *`,
      [nom_proveedor, cont_proveedor, tel_proveedor, cor_proveedor, dir_proveedor, estado, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM proveedor WHERE id_proveedor = $1', [req.params.id]);
    res.json({ mensaje: 'Proveedor eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;