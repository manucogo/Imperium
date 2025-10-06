-- database/schema.sql
-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS imperium_box CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE imperium_box;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    primer_apellido VARCHAR(100) NOT NULL,
    segundo_apellido VARCHAR(100) DEFAULT NULL,
    dni VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(150) DEFAULT NULL,
    telefono VARCHAR(20) DEFAULT NULL,
    direccion TEXT DEFAULT NULL,
    codigo_postal VARCHAR(10) DEFAULT NULL,
    localidad VARCHAR(100) DEFAULT 'Granada',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dni (dni),
    INDEX idx_nombre (nombre, primer_apellido)
);

-- Tabla de facturas
CREATE TABLE IF NOT EXISTS facturas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    numero_factura VARCHAR(50) NOT NULL UNIQUE,
    tipo_servicio VARCHAR(50) NOT NULL,
    descripcion TEXT NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    precio_sin_iva DECIMAL(10,2) NOT NULL,
    iva DECIMAL(10,2) NOT NULL,
    forma_pago ENUM('tarjeta', 'efectivo', 'transferencia') NOT NULL,
    fecha_pago DATE NOT NULL,
    fecha_factura DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_fecha_pago (fecha_pago),
    INDEX idx_fecha_factura (fecha_factura),
    INDEX idx_numero_factura (numero_factura)
);

-- Tabla de administradores
CREATE TABLE IF NOT EXISTS administradores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de configuración
CREATE TABLE IF NOT EXISTS configuracion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    descripcion TEXT DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar datos iniciales
INSERT INTO administradores (username, password, nombre, email) VALUES 
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador', 'admin@imperiumbox.com');
-- Nota: La contraseña hash corresponde a 'imperium2024'

-- Insertar configuración inicial
INSERT INTO configuracion (clave, valor, descripcion) VALUES 
('prefijo_factura', 'IMPERIUMBOXGR', 'Prefijo para numeración de facturas'),
('iva_porcentaje', '21', 'Porcentaje de IVA aplicado'),
('empresa_nombre', 'Ruben Hinojosa Valle', 'Nombre de la empresa'),
('empresa_nif', '31725301K', 'NIF de la empresa'),
('empresa_direccion', 'Arabial 45, CC NEPTUNO. IMPERIUM, Local 79', 'Dirección de la empresa'),
('empresa_localidad', '18004, Granada, España', 'Localidad de la empresa'),
('empresa_email', 'hello@imperiumcrosstraining.com', 'Email de contacto');

-- Insertar usuarios de prueba
INSERT INTO usuarios (nombre, primer_apellido, segundo_apellido, dni, email, telefono, direccion, codigo_postal, localidad) VALUES
('Juan', 'Pérez', 'García', '12345678A', 'juan@email.com', '666777888', 'Calle Real 123', '18001', 'Granada'),
('María', 'López', 'Martín', '87654321B', 'maria@email.com', '666777999', 'Avenida Andalucía 456', '18002', 'Granada'),
('Carlos', 'Rodríguez', 'Sánchez', '11223344C', 'carlos@email.com', '666777000', 'Plaza Nueva 789', '18003', 'Granada');

-- Insertar facturas de prueba
INSERT INTO facturas (usuario_id, numero_factura, tipo_servicio, descripcion, precio, precio_sin_iva, iva, forma_pago, fecha_pago, fecha_factura) VALUES
(1, 'IMPERIUMBOXGR/1', '3wod_1mes', '1 mes de 3 wod / semana', 60.00, 49.59, 10.41, 'tarjeta', '2024-01-15', '2024-01-31'),
(2, 'IMPERIUMBOXGR/2', 'libre_1mes', '1 mes libre', 80.00, 66.12, 13.88, 'efectivo', '2024-01-20', '2024-01-31'),
(3, 'IMPERIUMBOXGR/3', '3wod_3meses', '3 meses de 3 wod / semana', 165.00, 136.36, 28.64, 'transferencia', '2024-02-10', '2024-02-29'),
(1, 'IMPERIUMBOXGR/4', 'libre_1mes', '1 mes libre', 80.00, 66.12, 13.88, 'tarjeta', '2024-02-15', '2024-02-29');

-- Crear vista para facturas con datos de usuario
CREATE VIEW vista_facturas_completas AS
SELECT 
    f.id,
    f.numero_factura,
    f.tipo_servicio,
    f.descripcion,
    f.precio,
    f.precio_sin_iva,
    f.iva,
    f.forma_pago,
    f.fecha_pago,
    f.fecha_factura,
    u.id as usuario_id,
    u.nombre,
    u.primer_apellido,
    u.segundo_apellido,
    u.dni,
    u.email,
    u.telefono,
    u.direccion,
    u.codigo_postal,
    u.localidad,
    f.created_at
FROM facturas f
JOIN usuarios u ON f.usuario_id = u.id
ORDER BY f.fecha_factura DESC, f.numero_factura DESC;