const express = require('express');
const cors = require('cors');
const pool = require('./db');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/usuarios',      require('./routes/usuarios'));
app.use('/api/productos',     require('./routes/productos'));
app.use('/api/pedidos',       require('./routes/pedidos'));
app.use('/api/proveedores',   require('./routes/proveedores'));
app.use('/api/contacto',      require('./routes/contacto'));
app.use('/api/alertas',       require('./routes/alertas'));
app.use('/api/notificaciones', require('./routes/notificaciones'));
app.use('/api',                require('./routes/vehiculos')); // /api/marcas, /api/modelos

app.get('/', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.send('Server funcionando ✅ — Base de datos conectada 🟢');
  } catch (error) {
    res.send('Error conectando ❌: ' + error.message);
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
