const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'compralo.db');
const db = new Database(dbPath);

// Habilitar WAL para mejor rendimiento
db.pragma('journal_mode = WAL');

// Crear tablas
db.exec(`
  CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    marca TEXT,
    categoria TEXT,
    precio INTEGER,
    precioAnterior INTEGER,
    stock INTEGER DEFAULT 0,
    specs TEXT,
    destacado INTEGER DEFAULT 0,
    nuevo INTEGER DEFAULT 0,
    activo INTEGER DEFAULT 1,
    imagen_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY,
    items TEXT,
    total INTEGER,
    cliente_nombre TEXT,
    cliente_tel TEXT,
    estado TEXT DEFAULT 'pendiente',
    fecha TEXT DEFAULT CURRENT_TIMESTAMP,
    notas TEXT
  );

  CREATE TABLE IF NOT EXISTS configuracion (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Productos extraidos del index.html
const productos = [
  // === SAMSUNG ===
  { id:101, nombre:"Samsung Galaxy S25 Ultra", marca:"Samsung", precio:3499999, precioAnterior:3899999, categoria:"Samsung", specs:["512GB","12GB RAM","200MP","6.9\""], stock:10, destacado:1, nuevo:1 },
  { id:102, nombre:"Samsung Galaxy S25+", marca:"Samsung", precio:2699999, precioAnterior:2999999, categoria:"Samsung", specs:["256GB","12GB RAM","50MP","6.7\""], stock:12, nuevo:1 },
  { id:103, nombre:"Samsung Galaxy S25", marca:"Samsung", precio:2199999, precioAnterior:null, categoria:"Samsung", specs:["256GB","8GB RAM","50MP","6.2\""], stock:15, nuevo:1 },
  { id:104, nombre:"Samsung Galaxy A55", marca:"Samsung", precio:749999, precioAnterior:849999, categoria:"Samsung", specs:["128GB","8GB RAM","50MP","6.6\""], stock:28 },
  { id:105, nombre:"Samsung Galaxy A35", marca:"Samsung", precio:549999, precioAnterior:null, categoria:"Samsung", specs:["128GB","6GB RAM","50MP","6.6\""], stock:30 },
  { id:106, nombre:"Samsung Galaxy A15", marca:"Samsung", precio:299999, precioAnterior:349999, categoria:"Samsung", specs:["128GB","4GB RAM","50MP","6.5\""], stock:25 },
  { id:107, nombre:"Samsung Galaxy Z Flip 6", marca:"Samsung", precio:2399999, precioAnterior:2699999, categoria:"Samsung", specs:["256GB","8GB RAM","50MP","6.7\""], stock:7, destacado:1 },
  { id:108, nombre:"Samsung Galaxy Z Fold 6", marca:"Samsung", precio:3299999, precioAnterior:null, categoria:"Samsung", specs:["512GB","12GB RAM","50MP","7.6\""], stock:5 },
  // === APPLE - Línea iPhone 16 ===
  { id:9, nombre:"iPhone 16 Pro Max", marca:"Apple", precio:3499999, precioAnterior:3799999, categoria:"Apple", specs:["256GB","8GB RAM","48MP","6.9\""], stock:8, destacado:1, nuevo:1 },
  { id:10, nombre:"iPhone 16 Pro Max 512GB", marca:"Apple", precio:4099999, precioAnterior:null, categoria:"Apple", specs:["512GB","8GB RAM","48MP","6.9\""], stock:5, nuevo:1 },
  { id:11, nombre:"iPhone 16 Pro Max 1TB", marca:"Apple", precio:4899999, precioAnterior:null, categoria:"Apple", specs:["1TB","8GB RAM","48MP","6.9\""], stock:3, nuevo:1 },
  { id:12, nombre:"iPhone 16 Pro", marca:"Apple", precio:2999999, precioAnterior:null, categoria:"Apple", specs:["256GB","8GB RAM","48MP","6.3\""], stock:10, nuevo:1 },
  { id:13, nombre:"iPhone 16 Pro 512GB", marca:"Apple", precio:3599999, precioAnterior:null, categoria:"Apple", specs:["512GB","8GB RAM","48MP","6.3\""], stock:6, nuevo:1 },
  { id:14, nombre:"iPhone 16 Pro 1TB", marca:"Apple", precio:4299999, precioAnterior:null, categoria:"Apple", specs:["1TB","8GB RAM","48MP","6.3\""], stock:3, nuevo:1 },
  { id:15, nombre:"iPhone 16 Plus", marca:"Apple", precio:2599999, precioAnterior:2799999, categoria:"Apple", specs:["256GB","8GB RAM","48MP","6.7\""], stock:12, nuevo:1 },
  { id:16, nombre:"iPhone 16 Plus 512GB", marca:"Apple", precio:3099999, precioAnterior:null, categoria:"Apple", specs:["512GB","8GB RAM","48MP","6.7\""], stock:7, nuevo:1 },
  { id:17, nombre:"iPhone 16", marca:"Apple", precio:2299999, precioAnterior:2499999, categoria:"Apple", specs:["128GB","8GB RAM","48MP","6.1\""], stock:14, nuevo:1 },
  { id:18, nombre:"iPhone 16 256GB", marca:"Apple", precio:2599999, precioAnterior:null, categoria:"Apple", specs:["256GB","8GB RAM","48MP","6.1\""], stock:10, nuevo:1 },
  { id:19, nombre:"iPhone 16 512GB", marca:"Apple", precio:2999999, precioAnterior:null, categoria:"Apple", specs:["512GB","8GB RAM","48MP","6.1\""], stock:5, nuevo:1 },
  { id:20, nombre:"iPhone 16e", marca:"Apple", precio:1399999, precioAnterior:null, categoria:"Apple", specs:["128GB","8GB RAM","48MP","6.1\""], stock:20, nuevo:1 },
  { id:21, nombre:"iPhone 16e 256GB", marca:"Apple", precio:1599999, precioAnterior:null, categoria:"Apple", specs:["256GB","8GB RAM","48MP","6.1\""], stock:15, nuevo:1 },
  // === APPLE - Línea iPhone 15 ===
  { id:22, nombre:"iPhone 15 Pro Max", marca:"Apple", precio:2799999, precioAnterior:3299999, categoria:"Apple", specs:["256GB","8GB RAM","48MP","6.7\""], stock:10, destacado:1 },
  { id:23, nombre:"iPhone 15 Pro Max 512GB", marca:"Apple", precio:3299999, precioAnterior:3699999, categoria:"Apple", specs:["512GB","8GB RAM","48MP","6.7\""], stock:6 },
  { id:24, nombre:"iPhone 15 Pro Max 1TB", marca:"Apple", precio:3899999, precioAnterior:4299999, categoria:"Apple", specs:["1TB","8GB RAM","48MP","6.7\""], stock:3 },
  { id:25, nombre:"iPhone 15 Pro", marca:"Apple", precio:2399999, precioAnterior:2799999, categoria:"Apple", specs:["256GB","8GB RAM","48MP","6.1\""], stock:12 },
  { id:26, nombre:"iPhone 15 Pro 512GB", marca:"Apple", precio:2899999, precioAnterior:3199999, categoria:"Apple", specs:["512GB","8GB RAM","48MP","6.1\""], stock:7 },
  { id:27, nombre:"iPhone 15 Pro 1TB", marca:"Apple", precio:3499999, precioAnterior:3899999, categoria:"Apple", specs:["1TB","8GB RAM","48MP","6.1\""], stock:3 },
  { id:28, nombre:"iPhone 15 Plus", marca:"Apple", precio:1999999, precioAnterior:2299999, categoria:"Apple", specs:["256GB","6GB RAM","48MP","6.7\""], stock:14 },
  { id:29, nombre:"iPhone 15 Plus 512GB", marca:"Apple", precio:2399999, precioAnterior:2699999, categoria:"Apple", specs:["512GB","6GB RAM","48MP","6.7\""], stock:8 },
  { id:30, nombre:"iPhone 15", marca:"Apple", precio:1799999, precioAnterior:2099999, categoria:"Apple", specs:["128GB","6GB RAM","48MP","6.1\""], stock:18 },
  { id:31, nombre:"iPhone 15 256GB", marca:"Apple", precio:2099999, precioAnterior:2299999, categoria:"Apple", specs:["256GB","6GB RAM","48MP","6.1\""], stock:12 },
  { id:32, nombre:"iPhone 15 512GB", marca:"Apple", precio:2499999, precioAnterior:2699999, categoria:"Apple", specs:["512GB","6GB RAM","48MP","6.1\""], stock:6 },
  // === APPLE - Línea iPhone 14 ===
  { id:33, nombre:"iPhone 14 Plus", marca:"Apple", precio:1599999, precioAnterior:1899999, categoria:"Apple", specs:["128GB","6GB RAM","12MP","6.7\""], stock:15 },
  { id:34, nombre:"iPhone 14 Plus 256GB", marca:"Apple", precio:1799999, precioAnterior:2099999, categoria:"Apple", specs:["256GB","6GB RAM","12MP","6.7\""], stock:10 },
  { id:35, nombre:"iPhone 14", marca:"Apple", precio:1399999, precioAnterior:1699999, categoria:"Apple", specs:["128GB","6GB RAM","12MP","6.1\""], stock:20 },
  { id:36, nombre:"iPhone 14 256GB", marca:"Apple", precio:1599999, precioAnterior:1899999, categoria:"Apple", specs:["256GB","6GB RAM","12MP","6.1\""], stock:12 },
  // === APPLE - Línea iPhone 13 ===
  { id:37, nombre:"iPhone 13", marca:"Apple", precio:1099999, precioAnterior:1399999, categoria:"Apple", specs:["128GB","4GB RAM","12MP","6.1\""], stock:22 },
  { id:38, nombre:"iPhone 13 256GB", marca:"Apple", precio:1299999, precioAnterior:1499999, categoria:"Apple", specs:["256GB","4GB RAM","12MP","6.1\""], stock:14 },
  // === MOTOROLA ===
  { id:201, nombre:"Motorola Edge 50 Pro", marca:"Motorola", precio:1099999, precioAnterior:1299999, categoria:"Motorola", specs:["256GB","12GB RAM","50MP","6.7\""], stock:15, destacado:1 },
  { id:202, nombre:"Motorola Edge 50", marca:"Motorola", precio:849999, precioAnterior:null, categoria:"Motorola", specs:["256GB","8GB RAM","50MP","6.55\""], stock:20 },
  { id:203, nombre:"Motorola Moto G84", marca:"Motorola", precio:449999, precioAnterior:499999, categoria:"Motorola", specs:["256GB","12GB RAM","50MP","6.55\""], stock:25 },
  { id:204, nombre:"Motorola Moto G54", marca:"Motorola", precio:299999, precioAnterior:null, categoria:"Motorola", specs:["128GB","8GB RAM","50MP","6.5\""], stock:30 },
  // === XIAOMI ===
  { id:301, nombre:"Xiaomi 14", marca:"Xiaomi", precio:1599999, precioAnterior:null, categoria:"Xiaomi", specs:["512GB","12GB RAM","50MP Leica","6.36\""], stock:10, nuevo:1 },
  { id:302, nombre:"Xiaomi 14T", marca:"Xiaomi", precio:1199999, precioAnterior:1399999, categoria:"Xiaomi", specs:["256GB","12GB RAM","50MP","6.67\""], stock:14 },
  { id:303, nombre:"Xiaomi Redmi Note 13 Pro+", marca:"Xiaomi", precio:649999, precioAnterior:749999, categoria:"Xiaomi", specs:["256GB","8GB RAM","200MP","6.67\""], stock:20, destacado:1 },
  { id:304, nombre:"Xiaomi Redmi Note 13", marca:"Xiaomi", precio:399999, precioAnterior:null, categoria:"Xiaomi", specs:["128GB","6GB RAM","108MP","6.67\""], stock:22 },
  { id:305, nombre:"Xiaomi Poco X6 Pro", marca:"Xiaomi", precio:599999, precioAnterior:699999, categoria:"Xiaomi", specs:["256GB","8GB RAM","64MP","6.67\""], stock:18 },
];

const insert = db.prepare(`
  INSERT OR REPLACE INTO productos (id, nombre, marca, categoria, precio, precioAnterior, stock, specs, destacado, nuevo, activo)
  VALUES (@id, @nombre, @marca, @categoria, @precio, @precioAnterior, @stock, @specs, @destacado, @nuevo, 1)
`);

const insertMany = db.transaction((items) => {
  for (const p of items) {
    insert.run({
      id: p.id,
      nombre: p.nombre,
      marca: p.marca,
      categoria: p.categoria,
      precio: p.precio,
      precioAnterior: p.precioAnterior || null,
      stock: p.stock,
      specs: JSON.stringify(p.specs),
      destacado: p.destacado || 0,
      nuevo: p.nuevo || 0,
    });
  }
});

insertMany(productos);

console.log(`Base de datos inicializada en ${dbPath}`);
console.log(`${productos.length} productos insertados.`);

db.close();
