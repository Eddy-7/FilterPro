const express = require('express');
const router = express.Router();
const pool = require('../db');

// Listar todos los pedidos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.nom_usu1, u.ape_usu1
      FROM pedido p
      LEFT JOIN usuario u ON p.id_usuario = u.id_usuario
      ORDER BY p.fecha_pedido DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ⚠️ Esta ruta DEBE ir ANTES de /:id para que Express no la confunda con un ID
router.get('/reportes/mas-vendidos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.nom_producto,
             SUM(dp.cantidad_pedido) AS total_vendido,
             SUM(dp.subtotal_pedido) AS ingresos
      FROM detalle_pedido dp
      JOIN producto p ON dp.id_producto = p.id_producto
      GROUP BY p.id_producto, p.nom_producto
      ORDER BY total_vendido DESC
      LIMIT 5
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener pedido por ID con detalles
router.get('/:id', async (req, res) => {
  try {
    const pedido = await pool.query('SELECT * FROM pedido WHERE id_pedido = $1', [req.params.id]);
    const detalles = await pool.query(`
      SELECT dp.*, pr.nom_producto 
      FROM detalle_pedido dp
      LEFT JOIN producto pr ON dp.id_producto = pr.id_producto
      WHERE dp.id_pedido = $1
    `, [req.params.id]);
    if (pedido.rows.length === 0) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json({ ...pedido.rows[0], detalles: detalles.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear pedido
router.post('/', async (req, res) => {
  const { id_usuario, total_pedido, metodo_pago, detalles, id_tipo_vehiculo, id_ciudad, dir_envio } = req.body;
  const fecha_entrega_est = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const pedido = await client.query(
      `INSERT INTO pedido (id_usuario, fecha_entrega_est, total_pedido, metodo_pago, id_tipo_vehiculo, id_ciudad, dir_envio)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [id_usuario, fecha_entrega_est, total_pedido, metodo_pago, id_tipo_vehiculo, id_ciudad, dir_envio]
    );
    const id_pedido = pedido.rows[0].id_pedido;

    for (const d of detalles) {
      await client.query(
        `INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad_pedido, precio_unitario, subtotal_pedido)
         VALUES ($1,$2,$3,$4,$5)`,
        [id_pedido, d.id_producto, d.cantidad, d.precio_unitario, d.cantidad * d.precio_unitario]
      );
      // Descontar stock
      await client.query(
        `UPDATE producto SET stock_producto = stock_producto - $1 WHERE id_producto = $2`,
        [d.cantidad, d.id_producto]
      );
    }

    await client.query('COMMIT');

    // Registrar pago
    await pool.query(
      `INSERT INTO pago (id_pedido, monto, estado_pago, ref_transaccion)
       VALUES ($1, $2, 'completado', $3)`,
      [id_pedido, total_pedido, 'FP-' + id_pedido]
    );

    // Notificación al usuario
    await pool.query(
      `INSERT INTO notificacion (id_usuario, mensaje_notificacion, tipo_notificacion)
       VALUES ($1, $2, 'pedido')`,
      [id_usuario, `Pedido #${id_pedido} registrado correctamente. Total: $${Number(total_pedido).toLocaleString('es-CO')}`]
    );

    res.status(201).json(pedido.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Cambiar estado del pedido
router.put('/:id/estado', async (req, res) => {
  const { estado_pedido } = req.body;
  try {
    const result = await pool.query(
      'UPDATE pedido SET estado_pedido=$1 WHERE id_pedido=$2 RETURNING *',
      [estado_pedido, req.params.id]
    );
    const pedido = result.rows[0];

    // Notificación automática al usuario
    const mensajes = {
      'en preparacion': 'Tu pedido está siendo preparado.',
      'despachado': 'Tu pedido ha sido despachado y está en camino.',
      'entregado': 'Tu pedido ha sido entregado. ¡Gracias por tu compra!',
      'cancelado': 'Tu pedido ha sido cancelado.'
    };
    const mensaje = mensajes[estado_pedido];
    if (mensaje && pedido.id_usuario) {
      await pool.query(
        `INSERT INTO notificacion (id_usuario, mensaje_notificacion, tipo_notificacion)
         VALUES ($1, $2, 'pedido')`,
        [pedido.id_usuario, `Pedido #${pedido.id_pedido}: ${mensaje}`]
      );
    }

    res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
