const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;
const ADMIN_KEY = process.env.ADMIN_KEY || 'Compralo2026!Adm';
const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || '5491112345678';

// Base de datos
const db = new Database(path.join(__dirname, 'compralo.db'));
db.pragma('journal_mode = WAL');

// =============================
// MIDDLEWARES
// =============================

// Helmet: security headers (desactivar CSP para servir HTML estático sin problemas)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Admin-Key']
}));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiadas solicitudes, intente de nuevo más tarde' }
});
app.use(globalLimiter);

// Rate limiting estricto para pedidos (evitar spam)
const pedidosLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiados pedidos, intente de nuevo más tarde' }
});

// Body parser con límite de tamaño
app.use(express.json({ limit: '1mb' }));

// Archivos estáticos (no-cache para HTML)
app.use(express.static(__dirname, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// =============================
// UTILIDADES
// =============================

/** Sanitizar string: trim y eliminar tags HTML */
function sanitize(value) {
  if (typeof value !== 'string') return value;
  return value.trim().replace(/<[^>]*>/g, '');
}

/** Respuesta exitosa */
function successResponse(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

/** Respuesta de error */
function errorResponse(res, message, statusCode = 400) {
  return res.status(statusCode).json({ success: false, error: message });
}

/** Parsear specs JSON de un producto */
function parseProductSpecs(producto) {
  if (producto && producto.specs) {
    try {
      return { ...producto, specs: JSON.parse(producto.specs) };
    } catch {
      return { ...producto, specs: null };
    }
  }
  return producto;
}

/** Parsear specs de una lista de productos */
function parseProductList(productos) {
  return productos.map(parseProductSpecs);
}

/** Parsear items JSON de un pedido */
function parseOrderItems(pedido) {
  if (pedido && pedido.items) {
    try {
      return { ...pedido, items: JSON.parse(pedido.items) };
    } catch {
      return { ...pedido, items: [] };
    }
  }
  return pedido;
}

// =============================
// MIDDLEWARE AUTH ADMIN
// =============================

function adminAuth(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (key !== ADMIN_KEY) {
    return errorResponse(res, 'No autorizado', 401);
  }
  next();
}

// =============================
// API PUBLICA
// =============================

// Listar productos activos (devuelve array directo para el frontend)
app.get('/api/productos', (req, res) => {
  try {
    const productos = db.prepare('SELECT * FROM productos WHERE activo = 1 ORDER BY id').all();
    return res.json(parseProductList(productos));
  } catch (err) {
    return errorResponse(res, 'Error al obtener productos', 500);
  }
});

// Productos destacados
app.get('/api/productos/destacados', (req, res) => {
  try {
    const productos = db.prepare('SELECT * FROM productos WHERE activo = 1 AND destacado = 1 ORDER BY id').all();
    return successResponse(res, parseProductList(productos));
  } catch (err) {
    return errorResponse(res, 'Error al obtener productos destacados', 500);
  }
});

// Productos en oferta (tienen precioAnterior)
app.get('/api/productos/ofertas', (req, res) => {
  try {
    const productos = db.prepare('SELECT * FROM productos WHERE activo = 1 AND precioAnterior IS NOT NULL AND precioAnterior > precio ORDER BY id').all();
    return successResponse(res, parseProductList(productos));
  } catch (err) {
    return errorResponse(res, 'Error al obtener ofertas', 500);
  }
});

// Buscar productos
app.get('/api/productos/buscar', (req, res) => {
  try {
    const query = sanitize(req.query.q || '');
    if (!query || query.length < 2) {
      return errorResponse(res, 'El término de búsqueda debe tener al menos 2 caracteres');
    }

    const searchTerm = `%${query}%`;
    const productos = db.prepare(
      `SELECT * FROM productos WHERE activo = 1
       AND (nombre LIKE ? OR marca LIKE ? OR categoria LIKE ?)
       ORDER BY id`
    ).all(searchTerm, searchTerm, searchTerm);

    return successResponse(res, parseProductList(productos));
  } catch (err) {
    return errorResponse(res, 'Error al buscar productos', 500);
  }
});

// Categorías disponibles
app.get('/api/categorias', (req, res) => {
  try {
    const categorias = db.prepare(
      'SELECT DISTINCT categoria FROM productos WHERE activo = 1 AND categoria IS NOT NULL ORDER BY categoria'
    ).all().map(row => row.categoria);

    return successResponse(res, categorias);
  } catch (err) {
    return errorResponse(res, 'Error al obtener categorías', 500);
  }
});

// Producto individual
app.get('/api/productos/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return errorResponse(res, 'ID de producto inválido');
    }

    const producto = db.prepare('SELECT * FROM productos WHERE id = ? AND activo = 1').get(id);
    if (!producto) return errorResponse(res, 'Producto no encontrado', 404);

    return successResponse(res, parseProductSpecs(producto));
  } catch (err) {
    return errorResponse(res, 'Error al obtener producto', 500);
  }
});

// Crear pedido
app.post('/api/pedidos', pedidosLimiter, (req, res) => {
  try {
    const items = req.body.items;
    const total = req.body.total;
    const clienteNombre = sanitize(req.body.cliente_nombre || '');
    const clienteTel = sanitize(req.body.cliente_tel || '');
    const notas = sanitize(req.body.notas || '');

    if (!items || !Array.isArray(items) || items.length === 0) {
      return errorResponse(res, 'Los items del pedido son obligatorios');
    }
    if (!total || typeof total !== 'number' || total <= 0) {
      return errorResponse(res, 'El total debe ser un número mayor a 0');
    }

    const result = db.prepare(
      'INSERT INTO pedidos (items, total, cliente_nombre, cliente_tel, notas) VALUES (?, ?, ?, ?, ?)'
    ).run(
      JSON.stringify(items),
      total,
      clienteNombre || null,
      clienteTel || null,
      notas || null
    );

    return successResponse(res, {
      id: result.lastInsertRowid,
      mensaje: 'Pedido creado correctamente'
    }, 201);
  } catch (err) {
    return errorResponse(res, 'Error al crear pedido', 500);
  }
});

// Crear pedido + WhatsApp redirect URL
app.post('/api/pedidos/whatsapp', pedidosLimiter, (req, res) => {
  try {
    const items = req.body.items;
    const total = req.body.total;
    const clienteNombre = sanitize(req.body.cliente_nombre || '');
    const clienteTel = sanitize(req.body.cliente_tel || '');
    const notas = sanitize(req.body.notas || '');

    if (!items || !Array.isArray(items) || items.length === 0) {
      return errorResponse(res, 'Los items del pedido son obligatorios');
    }
    if (!total || typeof total !== 'number' || total <= 0) {
      return errorResponse(res, 'El total debe ser un número mayor a 0');
    }

    const result = db.prepare(
      'INSERT INTO pedidos (items, total, cliente_nombre, cliente_tel, notas) VALUES (?, ?, ?, ?, ?)'
    ).run(
      JSON.stringify(items),
      total,
      clienteNombre || null,
      clienteTel || null,
      notas || null
    );

    const pedidoId = result.lastInsertRowid;

    // Construir mensaje para WhatsApp
    const itemLines = items.map(item => {
      const nombre = sanitize(item.nombre || 'Producto');
      const cantidad = item.cantidad || 1;
      const precio = item.precio || 0;
      return `• ${nombre} x${cantidad} - $${precio.toLocaleString('es-AR')}`;
    }).join('\n');

    const mensaje = [
      `🛒 *Nuevo Pedido #${pedidoId}*`,
      '',
      itemLines,
      '',
      `*Total: $${total.toLocaleString('es-AR')}*`,
      clienteNombre ? `👤 ${clienteNombre}` : '',
      clienteTel ? `📞 ${clienteTel}` : '',
      notas ? `📝 ${notas}` : ''
    ].filter(Boolean).join('\n');

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;

    return successResponse(res, {
      id: pedidoId,
      mensaje: 'Pedido creado correctamente',
      whatsappUrl
    }, 201);
  } catch (err) {
    return errorResponse(res, 'Error al crear pedido', 500);
  }
});

// =============================
// API ADMIN (protegida)
// =============================

// Todos los productos (incluidos inactivos)
app.get('/api/admin/productos', adminAuth, (req, res) => {
  try {
    const productos = db.prepare('SELECT * FROM productos ORDER BY id').all();
    return successResponse(res, parseProductList(productos));
  } catch (err) {
    return errorResponse(res, 'Error al obtener productos', 500);
  }
});

// Crear producto
app.post('/api/admin/productos', adminAuth, (req, res) => {
  try {
    const nombre = sanitize(req.body.nombre || '');
    const marca = sanitize(req.body.marca || '');
    const categoria = sanitize(req.body.categoria || '');
    const precio = req.body.precio;
    const precioAnterior = req.body.precioAnterior;
    const stock = req.body.stock;
    const specs = req.body.specs;
    const destacado = req.body.destacado;
    const nuevo = req.body.nuevo;
    const imagenUrl = sanitize(req.body.imagen_url || '');

    if (!nombre || !precio) {
      return errorResponse(res, 'Nombre y precio son obligatorios');
    }

    const result = db.prepare(
      `INSERT INTO productos (nombre, marca, categoria, precio, precioAnterior, stock, specs, destacado, nuevo, imagen_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      nombre,
      marca || null,
      categoria || null,
      precio,
      precioAnterior || null,
      stock || 0,
      specs ? JSON.stringify(specs) : null,
      destacado ? 1 : 0,
      nuevo ? 1 : 0,
      imagenUrl || null
    );

    return successResponse(res, { id: result.lastInsertRowid, mensaje: 'Producto creado' }, 201);
  } catch (err) {
    return errorResponse(res, 'Error al crear producto', 500);
  }
});

// Editar producto
app.put('/api/admin/productos/:id', adminAuth, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return errorResponse(res, 'ID de producto inválido');
    }

    const { nombre, marca, categoria, precio, precioAnterior, stock, specs, destacado, nuevo, activo, imagen_url } = req.body;

    const existing = db.prepare('SELECT * FROM productos WHERE id = ?').get(id);
    if (!existing) return errorResponse(res, 'Producto no encontrado', 404);

    db.prepare(
      `UPDATE productos SET nombre=?, marca=?, categoria=?, precio=?, precioAnterior=?, stock=?, specs=?, destacado=?, nuevo=?, activo=?, imagen_url=? WHERE id=?`
    ).run(
      nombre !== undefined ? sanitize(nombre) : existing.nombre,
      marca !== undefined ? sanitize(marca) : existing.marca,
      categoria !== undefined ? sanitize(categoria) : existing.categoria,
      precio !== undefined ? precio : existing.precio,
      precioAnterior !== undefined ? precioAnterior : existing.precioAnterior,
      stock !== undefined ? stock : existing.stock,
      specs !== undefined ? JSON.stringify(specs) : existing.specs,
      destacado !== undefined ? (destacado ? 1 : 0) : existing.destacado,
      nuevo !== undefined ? (nuevo ? 1 : 0) : existing.nuevo,
      activo !== undefined ? (activo ? 1 : 0) : existing.activo,
      imagen_url !== undefined ? sanitize(imagen_url) : existing.imagen_url,
      id
    );

    return successResponse(res, { mensaje: 'Producto actualizado' });
  } catch (err) {
    return errorResponse(res, 'Error al actualizar producto', 500);
  }
});

// Desactivar producto (soft delete)
app.delete('/api/admin/productos/:id', adminAuth, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return errorResponse(res, 'ID de producto inválido');
    }

    const existing = db.prepare('SELECT * FROM productos WHERE id = ?').get(id);
    if (!existing) return errorResponse(res, 'Producto no encontrado', 404);

    db.prepare('UPDATE productos SET activo = 0 WHERE id = ?').run(id);
    return successResponse(res, { mensaje: 'Producto desactivado' });
  } catch (err) {
    return errorResponse(res, 'Error al desactivar producto', 500);
  }
});

// Listar pedidos
app.get('/api/admin/pedidos', adminAuth, (req, res) => {
  try {
    const pedidos = db.prepare('SELECT * FROM pedidos ORDER BY fecha DESC').all();
    return successResponse(res, pedidos.map(parseOrderItems));
  } catch (err) {
    return errorResponse(res, 'Error al obtener pedidos', 500);
  }
});

// Actualizar estado de pedido
app.put('/api/admin/pedidos/:id', adminAuth, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return errorResponse(res, 'ID de pedido inválido');
    }

    const { estado, notas } = req.body;
    const existing = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(id);
    if (!existing) return errorResponse(res, 'Pedido no encontrado', 404);

    const validEstados = ['pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado'];
    if (estado && !validEstados.includes(estado)) {
      return errorResponse(res, `Estado inválido. Valores permitidos: ${validEstados.join(', ')}`);
    }

    if (estado) db.prepare('UPDATE pedidos SET estado = ? WHERE id = ?').run(sanitize(estado), id);
    if (notas !== undefined) db.prepare('UPDATE pedidos SET notas = ? WHERE id = ?').run(sanitize(notas), id);

    return successResponse(res, { mensaje: 'Pedido actualizado' });
  } catch (err) {
    return errorResponse(res, 'Error al actualizar pedido', 500);
  }
});

// Estadísticas
app.get('/api/admin/stats', adminAuth, (req, res) => {
  try {
    const totalProductos = db.prepare('SELECT COUNT(*) as total FROM productos WHERE activo = 1').get().total;
    const hoy = new Date().toISOString().split('T')[0];
    const pedidosHoy = db.prepare("SELECT COUNT(*) as total FROM pedidos WHERE fecha LIKE ?").get(hoy + '%').total;
    const inicioMes = hoy.substring(0, 7);
    const ingresosMes = db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM pedidos WHERE fecha LIKE ? AND estado != 'cancelado'").get(inicioMes + '%').total;
    const stockBajo = db.prepare('SELECT COUNT(*) as total FROM productos WHERE activo = 1 AND stock < 5').get().total;

    return successResponse(res, {
      totalProductos,
      pedidosHoy,
      ingresosMes,
      stockBajo
    });
  } catch (err) {
    return errorResponse(res, 'Error al obtener estadísticas', 500);
  }
});

// Servir index.html con patches aplicados en runtime
const fs = require('fs');
let cachedHtml = null;
function getHtml() {
  if (!cachedHtml) {
    let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    html = html.replace(
      'allProducts = await res.json()',
      'const _json = await res.json(); allProducts = Array.isArray(_json) ? _json : (_json.data || [])'
    );
    html = html.replace(/max="3000000" value="3000000"/g, 'max="5000000" value="5000000"');
    html = html.replace('let maxPrice = 3000000', 'let maxPrice = 5000000');
    cachedHtml = html;
  }
  return cachedHtml;
}
app.get('/', (req, res) => {
  res.type('html').send(getHtml());
});
app.get('/{0,}', (req, res) => {
  res.type('html').send(getHtml());
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  return errorResponse(res, err.message || 'Error interno del servidor', statusCode);
});

app.listen(PORT, () => {
  console.log(`Compralo backend corriendo en puerto ${PORT}`);
});
