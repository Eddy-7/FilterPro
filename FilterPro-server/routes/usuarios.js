const express = require('express');
const router = express.Router();
const pool = require('../db');

// Listar todos los usuarios
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuario ORDER BY id_usuario ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener un usuario por ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuario WHERE id_usuario = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear usuario
router.post('/', async (req, res) => {
  const { nom_usu1, nom_usu2, ape_usu1, ape_usu2, correo_usu, dir_usu, cel_usu, n_ident, tipo_usu, id_tipo_doc } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO usuario (nom_usu1, nom_usu2, ape_usu1, ape_usu2, correo_usu, dir_usu, cel_usu, n_ident, tipo_usu, id_tipo_doc)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [nom_usu1, nom_usu2, ape_usu1, ape_usu2, correo_usu, dir_usu, cel_usu, n_ident, tipo_usu || 'cliente', id_tipo_doc]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Editar usuario
router.put('/:id', async (req, res) => {
  const { nom_usu1, nom_usu2, ape_usu1, ape_usu2, correo_usu, dir_usu, cel_usu, estado_usu } = req.body;
  try {
    const result = await pool.query(
      `UPDATE usuario SET nom_usu1=$1, nom_usu2=$2, ape_usu1=$3, ape_usu2=$4,
       correo_usu=$5, dir_usu=$6, cel_usu=$7, estado_usu=$8
       WHERE id_usuario=$9 RETURNING *`,
      [nom_usu1, nom_usu2, ape_usu1, ape_usu2, correo_usu, dir_usu, cel_usu, estado_usu, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar usuario
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM usuario WHERE id_usuario = $1', [req.params.id]);
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Cambiar estado del usuario (activar / desactivar)
router.put('/:id/estado', async (req, res) => {
  const { estado_usu } = req.body;
  if (!['activo', 'inactivo'].includes(estado_usu)) {
    return res.status(400).json({ error: 'Estado inválido. Usa "activo" o "inactivo".' });
  }
  try {
    const result = await pool.query(
      'UPDATE usuario SET estado_usu=$1 WHERE id_usuario=$2 RETURNING id_usuario, nom_usu1, ape_usu1, correo_usu, tipo_usu, estado_usu',
      [estado_usu, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;