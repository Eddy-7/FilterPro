const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Registro
router.post('/registro', async (req, res) => {
  const { nom_usu1, ape_usu1, correo_usu, n_ident, password, tipo_usu, cel_usu, dir_usu, id_tipo_doc } = req.body;
  try {
    const existe = await pool.query('SELECT id_usuario FROM usuario WHERE correo_usu = $1', [correo_usu]);
    if (existe.rows.length > 0) return res.status(400).json({ error: 'El correo ya está registrado' });

    const hash = await bcrypt.hash(password, 10);
    const id_rol = (tipo_usu === 'admin') ? 2 : 1;

    const result = await pool.query(
      `INSERT INTO usuario (nom_usu1, ape_usu1, correo_usu, n_ident, password, tipo_usu, cel_usu, dir_usu, id_tipo_doc, id_rol)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id_usuario, nom_usu1, ape_usu1, correo_usu, tipo_usu`,
      [nom_usu1, ape_usu1, correo_usu, n_ident, hash, tipo_usu || 'cliente', cel_usu, dir_usu, parseInt(id_tipo_doc), id_rol]
    );
    res.status(201).json({ mensaje: 'Usuario registrado correctamente', usuario: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { correo_usu, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM usuario WHERE correo_usu = $1', [correo_usu]);
    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });

    const usuario = result.rows[0];

    // ✅ Verificar que la cuenta esté activa
    if (usuario.estado_usu === 'inactivo') {
      return res.status(403).json({ error: 'Tu cuenta ha sido desactivada. Contacta al administrador.' });
    }

    const valido = await bcrypt.compare(password, usuario.password);
    if (!valido)
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });

    const token = jwt.sign(
      { id: usuario.id_usuario, tipo: usuario.tipo_usu },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id_usuario,
        nombre: usuario.nom_usu1 + ' ' + usuario.ape_usu1,
        correo: usuario.correo_usu,
        tipo: usuario.tipo_usu
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
