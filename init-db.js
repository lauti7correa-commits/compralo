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

  CREATE TABLE IF NOT EXISTS stock_alerts (
    id INTEGER PRIMARY KEY,
    producto_id INTEGER NOT NULL,
    email TEXT,
    telefono TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Catálogo completo - Precios Argentina Abril 2026 (post arancel 0%)
const productos = [
  // === SAMSUNG ===
  { id:1, nombre:"Samsung Galaxy S25 Ultra", marca:"Samsung", precio:3499999, precioAnterior:3899999, categoria:"Samsung", specs:["512GB","12GB RAM","200MP","6.9\""], stock:10, destacado:1, nuevo:1, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s25-ultra.jpg" },
  { id:2, nombre:"Samsung Galaxy S25+", marca:"Samsung", precio:2699999, precioAnterior:2999999, categoria:"Samsung", specs:["256GB","12GB RAM","50MP","6.7\""], stock:12, nuevo:1, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s25-plus.jpg" },
  { id:3, nombre:"Samsung Galaxy S25", marca:"Samsung", precio:2199999, precioAnterior:null, categoria:"Samsung", specs:["256GB","8GB RAM","50MP","6.2\""], stock:15, nuevo:1, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s25.jpg" },
  { id:4, nombre:"Samsung Galaxy A55", marca:"Samsung", precio:749999, precioAnterior:849999, categoria:"Samsung", specs:["128GB","8GB RAM","50MP","6.6\""], stock:28, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a55.jpg" },
  { id:5, nombre:"Samsung Galaxy A35", marca:"Samsung", precio:549999, precioAnterior:null, categoria:"Samsung", specs:["128GB","6GB RAM","50MP","6.6\""], stock:30, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a35.jpg" },
  { id:6, nombre:"Samsung Galaxy A15", marca:"Samsung", precio:299999, precioAnterior:349999, categoria:"Samsung", specs:["128GB","4GB RAM","50MP","6.5\""], stock:25, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a15.jpg" },
  { id:7, nombre:"Samsung Galaxy Z Flip 6", marca:"Samsung", precio:2399999, precioAnterior:2699999, categoria:"Samsung", specs:["256GB","8GB RAM","50MP","6.7\""], stock:7, destacado:1, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-flip6.jpg" },
  { id:8, nombre:"Samsung Galaxy Z Fold 6", marca:"Samsung", precio:3299999, precioAnterior:null, categoria:"Samsung", specs:["512GB","12GB RAM","50MP","7.6\""], stock:5, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold6.jpg" },

  // === APPLE - iPhone 17 (NUEVOS - Abril 2026) ===
  { id:51, nombre:"iPhone 17 Pro Max 256GB", marca:"Apple", precio:2999990, precioAnterior:null, categoria:"Apple", specs:["256GB","12GB RAM","48MP","6.9\"","A19 Pro","USB-C","Titanio"], stock:6, destacado:1, nuevo:1, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-17-pro-max.jpg" },
  { id:52, nombre:"iPhone 17 Pro Max 512GB", marca:"Apple", precio:3399990, precioAnterior:null, categoria:"Apple", specs:["512GB","12GB RAM","48MP","6.9\"","A19 Pro","USB-C","Titanio"], stock:4, nuevo:1, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-17-pro-max.jpg" },
  { id:53, nombre:"iPhone 17 Pro Max 1TB", marca:"Apple", precio:3849990, precioAnterior:null, categoria:"Apple", specs:["1TB","12GB RAM","48MP","6.9\"","A19 Pro","USB-C","Titanio"], stock:3, nuevo:1, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-17-pro-max.jpg" },
  { id:54, nombre:"iPhone 17 Pro 256GB", marca:"Apple", precio:2699990, precioAnterior:null, categoria:"Apple", specs:["256GB","12GB RAM","48MP","6.3\"","A19 Pro","USB-C","Titanio"], stock:8, destacado:1, nuevo:1, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-17-pro.jpg" },
  { id:55, nombre:"iPhone 17 Pro 512GB", marca:"Apple", precio:3199990, precioAnterior:null, categoria:"Apple", specs:["512GB","12GB RAM","48MP","6.3\"","A19 Pro","USB-C","Titanio"], stock:5, nuevo:1, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-17-pro.jpg" },
  { id:56, nombre:"iPhone 17 Pro 1TB", marca:"Apple", precio:3599990, precioAnterior:null, categoria:"Apple", specs:["1TB","12GB RAM","48MP","6.3\"","A19 Pro","USB-C","Titanio"], stock:3, nuevo:1, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-17-pro.jpg" },
  { id:57, nombre:"iPhone Air 256GB", marca:"Apple", precio:2499990, precioAnterior:null, categoria:"Apple", specs:["256GB","8GB RAM","48MP","6.6\"","A19","USB-C","Ultradelgado"], stock:10, destacado:1, nuevo:1, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-air.jpg" },
  { id:58, nombre:"iPhone Air 512GB", marca:"Apple", precio:2899990, precioAnterior:null, categoria:"Apple", specs:["512GB","8GB RAM","48MP","6.6\"","A19","USB-C","Ultradelgado"], stock:6, nuevo:1, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-air.jpg" },
  { id:59, nombre:"iPhone 17 256GB", marca:"Apple", precio:1999990, precioAnterior:null, categoria:"Apple", specs:["256GB","8GB RAM","48MP","6.1\"","A19","USB-C"], stock:12, nuevo:1, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-17.jpg" },
  { id:60, nombre:"iPhone 17 512GB", marca:"Apple", precio:2299990, precioAnterior:null, categoria:"Apple", specs:["512GB","8GB RAM","48MP","6.1\"","A19","USB-C"], stock:6, nuevo:1, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-17.jpg" },
  { id:61, nombre:"iPhone 17e 256GB", marca:"Apple", precio:1499990, precioAnterior:null, categoria:"Apple", specs:["256GB","8GB RAM","48MP","6.1\"","A19","USB-C"], stock:15, nuevo:1, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-17e.jpg" },

  // === APPLE - iPhone 16 (precios actualizados post-arancel 0%) ===
  { id:62, nombre:"iPhone 16 Pro Max 256GB", marca:"Apple", precio:3099990, precioAnterior:3499990, categoria:"Apple", specs:["256GB","8GB RAM","48MP","6.9\"","A18 Pro","USB-C","Titanio"], stock:8, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro-max.jpg" },
  { id:63, nombre:"iPhone 16 Pro Max 512GB", marca:"Apple", precio:3499990, precioAnterior:3999990, categoria:"Apple", specs:["512GB","8GB RAM","48MP","6.9\"","A18 Pro","USB-C","Titanio"], stock:5, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro-max.jpg" },
  { id:64, nombre:"iPhone 16 Pro Max 1TB", marca:"Apple", precio:3999990, precioAnterior:4499990, categoria:"Apple", specs:["1TB","8GB RAM","48MP","6.9\"","A18 Pro","USB-C","Titanio"], stock:3, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro-max.jpg" },
  { id:65, nombre:"iPhone 16 Pro 256GB", marca:"Apple", precio:2799990, precioAnterior:2999990, categoria:"Apple", specs:["256GB","8GB RAM","48MP","6.3\"","A18 Pro","USB-C","Titanio"], stock:10, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro.jpg" },
  { id:66, nombre:"iPhone 16 Pro 512GB", marca:"Apple", precio:3199990, precioAnterior:3599990, categoria:"Apple", specs:["512GB","8GB RAM","48MP","6.3\"","A18 Pro","USB-C","Titanio"], stock:6, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro.jpg" },
  { id:67, nombre:"iPhone 16 Pro 1TB", marca:"Apple", precio:3599990, precioAnterior:3999990, categoria:"Apple", specs:["1TB","8GB RAM","48MP","6.3\"","A18 Pro","USB-C","Titanio"], stock:3, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro.jpg" },
  { id:68, nombre:"iPhone 16 Plus 128GB", marca:"Apple", precio:2299990, precioAnterior:2599990, categoria:"Apple", specs:["128GB","8GB RAM","48MP","6.7\"","A18","USB-C"], stock:10, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-plus.jpg" },
  { id:69, nombre:"iPhone 16 Plus 256GB", marca:"Apple", precio:2599990, precioAnterior:2799990, categoria:"Apple", specs:["256GB","8GB RAM","48MP","6.7\"","A18","USB-C"], stock:7, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-plus.jpg" },
  { id:70, nombre:"iPhone 16 128GB", marca:"Apple", precio:1699990, precioAnterior:1999990, categoria:"Apple", specs:["128GB","8GB RAM","48MP","6.1\"","A18","USB-C"], stock:15, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16.jpg" },
  { id:71, nombre:"iPhone 16 256GB", marca:"Apple", precio:1999990, precioAnterior:2299990, categoria:"Apple", specs:["256GB","8GB RAM","48MP","6.1\"","A18","USB-C"], stock:10, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16.jpg" },
  { id:72, nombre:"iPhone 16e 128GB", marca:"Apple", precio:1399990, precioAnterior:null, categoria:"Apple", specs:["128GB","8GB RAM","48MP","6.1\"","A18","USB-C"], stock:18, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16e.jpg" },
  { id:73, nombre:"iPhone 16e 256GB", marca:"Apple", precio:1599990, precioAnterior:null, categoria:"Apple", specs:["256GB","8GB RAM","48MP","6.1\"","A18","USB-C"], stock:12, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16e.jpg" },

  // === APPLE - iPhone 15 (ofertas) ===
  { id:74, nombre:"iPhone 15 128GB", marca:"Apple", precio:1399990, precioAnterior:1799990, categoria:"Apple", specs:["128GB","6GB RAM","48MP","6.1\"","A16","USB-C"], stock:15, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15.jpg" },
  { id:75, nombre:"iPhone 15 256GB", marca:"Apple", precio:1599990, precioAnterior:2099990, categoria:"Apple", specs:["256GB","6GB RAM","48MP","6.1\"","A16","USB-C"], stock:10, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15.jpg" },

  // === APPLE - iPhone 14 (ofertas) ===
  { id:76, nombre:"iPhone 14 128GB", marca:"Apple", precio:1199990, precioAnterior:1499990, categoria:"Apple", specs:["128GB","6GB RAM","12MP","6.1\"","A15","USB-C"], stock:12, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-14.jpg" },
  { id:77, nombre:"iPhone 14 256GB", marca:"Apple", precio:1399990, precioAnterior:1599990, categoria:"Apple", specs:["256GB","6GB RAM","12MP","6.1\"","A15","USB-C"], stock:8, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-14.jpg" },

  // === APPLE - iPhone 13 (entrada) ===
  { id:78, nombre:"iPhone 13 128GB", marca:"Apple", precio:999990, precioAnterior:1299990, categoria:"Apple", specs:["128GB","4GB RAM","12MP","6.1\"","A15","Lightning"], stock:15, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-13.jpg" },

  // === MOTOROLA ===
  { id:201, nombre:"Motorola Edge 50 Pro", marca:"Motorola", precio:1099999, precioAnterior:1299999, categoria:"Motorola", specs:["256GB","12GB RAM","50MP","6.7\""], stock:15, destacado:1, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/motorola-edge-50-pro.jpg" },
  { id:202, nombre:"Motorola Edge 50", marca:"Motorola", precio:849999, precioAnterior:null, categoria:"Motorola", specs:["256GB","8GB RAM","50MP","6.55\""], stock:20, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/motorola-edge-50.jpg" },
  { id:203, nombre:"Motorola Moto G84", marca:"Motorola", precio:449999, precioAnterior:499999, categoria:"Motorola", specs:["256GB","12GB RAM","50MP","6.55\""], stock:25, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/motorola-moto-g84.jpg" },
  { id:204, nombre:"Motorola Moto G54", marca:"Motorola", precio:299999, precioAnterior:null, categoria:"Motorola", specs:["128GB","8GB RAM","50MP","6.5\""], stock:30, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/motorola-moto-g54-5g.jpg" },

  // === XIAOMI ===
  { id:301, nombre:"Xiaomi 14", marca:"Xiaomi", precio:1599999, precioAnterior:null, categoria:"Xiaomi", specs:["512GB","12GB RAM","50MP Leica","6.36\""], stock:10, nuevo:1, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14.jpg" },
  { id:302, nombre:"Xiaomi 14T", marca:"Xiaomi", precio:1199999, precioAnterior:1399999, categoria:"Xiaomi", specs:["256GB","12GB RAM","50MP","6.67\""], stock:14, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14t.jpg" },
  { id:303, nombre:"Xiaomi Redmi Note 13 Pro+", marca:"Xiaomi", precio:649999, precioAnterior:749999, categoria:"Xiaomi", specs:["256GB","8GB RAM","200MP","6.67\""], stock:20, destacado:1, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13-pro-plus.jpg" },
  { id:304, nombre:"Xiaomi Redmi Note 13", marca:"Xiaomi", precio:399999, precioAnterior:null, categoria:"Xiaomi", specs:["128GB","6GB RAM","108MP","6.67\""], stock:22, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13-4g1.jpg" },
  { id:305, nombre:"Xiaomi Poco X6 Pro", marca:"Xiaomi", precio:599999, precioAnterior:699999, categoria:"Xiaomi", specs:["256GB","8GB RAM","64MP","6.67\""], stock:18, imagen_url:"https://fdn2.gsmarena.com/vv/bigpic/xiaomi-poco-x6-pro.jpg" },
];

const insert = db.prepare(`
  INSERT OR REPLACE INTO productos (id, nombre, marca, categoria, precio, precioAnterior, stock, specs, destacado, nuevo, activo, imagen_url)
  VALUES (@id, @nombre, @marca, @categoria, @precio, @precioAnterior, @stock, @specs, @destacado, @nuevo, 1, @imagen_url)
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
      imagen_url: p.imagen_url || null,
    });
  }
});

insertMany(productos);

console.log(`Base de datos inicializada en ${dbPath}`);
console.log(`${productos.length} productos insertados.`);

db.close();
