const pool = require('./db');

async function crearTablas() {
  try {
    await pool.query(`

      -- UBICACIÓN
      CREATE TABLE IF NOT EXISTS pais (
        id_pais SERIAL PRIMARY KEY,
        nom_pais VARCHAR(60),
        des_pais VARCHAR(60)
      );

      CREATE TABLE IF NOT EXISTS depto (
        id_depto SERIAL PRIMARY KEY,
        nom_depto VARCHAR(60),
        cod_depto VARCHAR(10),
        id_pais INTEGER REFERENCES pais(id_pais)
      );

      CREATE TABLE IF NOT EXISTS ciudad (
        id_ciudad SERIAL PRIMARY KEY,
        nom_ciudad VARCHAR(60),
        cod_ciudad VARCHAR(10),
        id_depto INTEGER REFERENCES depto(id_depto)
      );

      -- USUARIOS
      CREATE TABLE IF NOT EXISTS tipo_documento (
        id_tipo_doc SERIAL PRIMARY KEY,
        des_tipo_doc VARCHAR(80),
        nom_tipo_doc VARCHAR(20)
      );

      CREATE TABLE IF NOT EXISTS usuario (
        id_usuario SERIAL PRIMARY KEY,
        nom_usu1 VARCHAR(40),
        nom_usu2 VARCHAR(40),
        ape_usu1 VARCHAR(40),
        ape_usu2 VARCHAR(40),
        correo_usu VARCHAR(40) UNIQUE NOT NULL,
        dir_usu VARCHAR(40),
        cel_usu VARCHAR(10),
        fec_nac_usu DATE,
        n_ident VARCHAR(20) UNIQUE NOT NULL,
        tipo_usu VARCHAR(20) DEFAULT 'cliente',
        id_rol INTEGER,
        estado_usu VARCHAR(20) DEFAULT 'activo',
        fecha_usu TIMESTAMP DEFAULT NOW(),
        id_tipo_doc INTEGER REFERENCES tipo_documento(id_tipo_doc),
        id_procedencia INTEGER REFERENCES ciudad(id_ciudad),
        password VARCHAR(255)
      );

      -- VEHÍCULOS
      CREATE TABLE IF NOT EXISTS tipo_vehiculo (
        id_tipo_vehiculo SERIAL PRIMARY KEY,
        nom_vehiculo VARCHAR(20)
      );

      CREATE TABLE IF NOT EXISTS marca_vehiculo (
        id_marca SERIAL PRIMARY KEY,
        nom_marca VARCHAR(30),
        id_tipo_vehiculo INTEGER REFERENCES tipo_vehiculo(id_tipo_vehiculo)
      );

      CREATE TABLE IF NOT EXISTS modelo_vehiculo (
        id_modelo SERIAL PRIMARY KEY,
        nom_modelo VARCHAR(50),
        des_modelo VARCHAR(50),
        id_marca INTEGER REFERENCES marca_vehiculo(id_marca)
      );

      -- FILTROS Y PRODUCTOS
      CREATE TABLE IF NOT EXISTS tipo_filtro (
        id_tipo_filtro SERIAL PRIMARY KEY,
        nom_filtro VARCHAR(20),
        des_filtro VARCHAR(50)
      );

      CREATE TABLE IF NOT EXISTS producto (
        id_producto SERIAL PRIMARY KEY,
        nom_producto VARCHAR(20),
        des_producto VARCHAR(50),
        pre_producto DOUBLE PRECISION,
        stock_producto INTEGER DEFAULT 0,
        est_producto VARCHAR(20) DEFAULT 'activo',
        id_tipo_filtro INTEGER REFERENCES tipo_filtro(id_tipo_filtro),
        id_tipo_vehiculo INTEGER REFERENCES tipo_vehiculo(id_tipo_vehiculo),
        imagen VARCHAR(200),
        referencia VARCHAR(20)
      );

      CREATE TABLE IF NOT EXISTS compatibilidad_producto (
        id_compatibilidad SERIAL PRIMARY KEY,
        id_producto INTEGER REFERENCES producto(id_producto),
        id_marca INTEGER REFERENCES marca_vehiculo(id_marca),
        id_modelo INTEGER REFERENCES modelo_vehiculo(id_modelo)
      );

      -- PROVEEDORES E INVENTARIO
      CREATE TABLE IF NOT EXISTS proveedor (
        id_proveedor SERIAL PRIMARY KEY,
        nom_proveedor VARCHAR(20),
        cont_proveedor VARCHAR(20),
        tel_proveedor VARCHAR(10),
        cor_proveedor VARCHAR(40),
        dir_proveedor VARCHAR(40),
        estado VARCHAR(20) DEFAULT 'activo'
      );

      CREATE TABLE IF NOT EXISTS producto_proveedor (
        id_producto_proveedor SERIAL PRIMARY KEY,
        id_producto INTEGER REFERENCES producto(id_producto),
        id_proveedor INTEGER REFERENCES proveedor(id_proveedor),
        precio_compra DOUBLE PRECISION,
        fecha_suministro DATE
      );

      CREATE TABLE IF NOT EXISTS inventario (
        id_inventario SERIAL PRIMARY KEY,
        id_producto INTEGER REFERENCES producto(id_producto),
        can_disponible INTEGER DEFAULT 0,
        stock_minimo INTEGER DEFAULT 0,
        fec_actualizacion TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS alerta_stock (
        id_alerta SERIAL PRIMARY KEY,
        id_usuario INTEGER REFERENCES usuario(id_usuario),
        id_producto INTEGER REFERENCES producto(id_producto),
        fecha_solicitud TIMESTAMP DEFAULT NOW(),
        notificado BOOLEAN DEFAULT FALSE
      );

      -- PEDIDOS Y PAGOS
      CREATE TABLE IF NOT EXISTS metodo_pago (
        id_metodo_pago SERIAL PRIMARY KEY,
        nom_metodo VARCHAR(40),
        des_metodo VARCHAR(40),
        estado_metodo_pago VARCHAR(20) DEFAULT 'activo',
        estado_pago VARCHAR(20),
        ref_transaccion VARCHAR(40)
      );

      CREATE TABLE IF NOT EXISTS pedido (
        id_pedido SERIAL PRIMARY KEY,
        id_usuario INTEGER REFERENCES usuario(id_usuario),
        fecha_pedido TIMESTAMP DEFAULT NOW(),
        fecha_entrega_est DATE,
        estado_pedido VARCHAR(20) DEFAULT 'pendiente',
        total_pedido DOUBLE PRECISION,
        metodo_pago VARCHAR(40),
        id_tipo_vehiculo INTEGER REFERENCES tipo_vehiculo(id_tipo_vehiculo),
        id_ciudad INTEGER REFERENCES ciudad(id_ciudad),
        dir_envio VARCHAR(200)
      );

      CREATE TABLE IF NOT EXISTS detalle_pedido (
        id_detalle SERIAL PRIMARY KEY,
        id_pedido INTEGER REFERENCES pedido(id_pedido),
        id_producto INTEGER REFERENCES producto(id_producto),
        cantidad_pedido INTEGER,
        precio_unitario DOUBLE PRECISION,
        subtotal_pedido DOUBLE PRECISION
      );

      CREATE TABLE IF NOT EXISTS pago (
        id_pago SERIAL PRIMARY KEY,
        id_pedido INTEGER REFERENCES pedido(id_pedido),
        monto DOUBLE PRECISION,
        fecha_pago TIMESTAMP DEFAULT NOW(),
        estado_pago VARCHAR(20) DEFAULT 'pendiente',
        ref_transaccion VARCHAR(40)
      );

      -- NOTIFICACIONES
      CREATE TABLE IF NOT EXISTS notificacion (
        id_notificacion SERIAL PRIMARY KEY,
        id_usuario INTEGER REFERENCES usuario(id_usuario),
        mensaje_notificacion TEXT,
        tipo_notificacion VARCHAR(40),
        fecha_envio TIMESTAMP DEFAULT NOW(),
        leida BOOLEAN DEFAULT FALSE
      );

    `);

    console.log('Tablas creadas/actualizadas correctamente ✅');
    process.exit(0);
  } catch (error) {
    console.error('Error creando tablas ❌:', error.message);
    process.exit(1);
  }
}

crearTablas();
