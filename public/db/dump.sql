/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: caja
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `caja` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` int(11) NOT NULL,
  `nombre` varchar(255) DEFAULT NULL,
  `ubicacion` text DEFAULT NULL,
  `activo` tinyint(1) DEFAULT NULL,
  `creado_en` datetime NOT NULL,
  `actualizado_en` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `empresa_id` (`empresa_id`),
  CONSTRAINT `caja_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresa` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: categoria_producto
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `categoria_producto` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `creado_en` datetime NOT NULL,
  `actualizado_en` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: cliente
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `cliente` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) DEFAULT NULL,
  `apellido` varchar(255) DEFAULT NULL,
  `cedula` varchar(255) DEFAULT NULL,
  `telefono` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `direccion` text DEFAULT NULL,
  `fecha_registro` datetime DEFAULT NULL,
  `activo` tinyint(1) DEFAULT NULL,
  `creado_en` datetime NOT NULL,
  `actualizado_en` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: control_caja
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `control_caja` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `caja_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `fecha_apertura` datetime DEFAULT NULL,
  `fecha_cierre` datetime DEFAULT NULL,
  `monto_apertura` decimal(10, 2) DEFAULT NULL,
  `monto_cierre` decimal(10, 2) DEFAULT NULL,
  `estado` varchar(255) DEFAULT NULL,
  `creado_en` datetime NOT NULL,
  `actualizado_en` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `caja_id` (`caja_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `control_caja_ibfk_1` FOREIGN KEY (`caja_id`) REFERENCES `caja` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `control_caja_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: empleado
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `empleado` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` int(11) NOT NULL,
  `nombre` varchar(255) DEFAULT NULL,
  `apellido` varchar(255) DEFAULT NULL,
  `cedula` varchar(255) DEFAULT NULL,
  `telefono` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `direccion` text DEFAULT NULL,
  `fecha_ingreso` date DEFAULT NULL,
  `salario_base` decimal(10, 2) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `creado_en` datetime NOT NULL,
  `actualizado_en` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `empresa_id` (`empresa_id`),
  CONSTRAINT `empleado_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresa` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 2 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: empresa
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `empresa` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) DEFAULT NULL,
  `rif` varchar(255) DEFAULT NULL,
  `direccion` text DEFAULT NULL,
  `ciudad` varchar(255) DEFAULT NULL,
  `telefono` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `sitio_web` varchar(255) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `slogan` varchar(255) DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `creado_en` datetime NOT NULL,
  `actualizado_en` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 2 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: iva
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `iva` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `porcentaje` decimal(10, 2) NOT NULL,
  `fecha` datetime NOT NULL,
  `observacion` text DEFAULT NULL,
  `activa` tinyint(1) DEFAULT 1,
  `creado_en` datetime NOT NULL,
  `actualizado_en` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `iva_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: metodo_pago
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `metodo_pago` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `tipo` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT NULL,
  `comision` decimal(10, 2) DEFAULT NULL,
  `creado_en` datetime NOT NULL,
  `actualizado_en` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: nomina_empleado
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `nomina_empleado` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empleado_id` int(11) NOT NULL,
  `tasa_id` int(11) NOT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `monto` decimal(10, 2) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `creado_en` datetime NOT NULL,
  `actualizado_en` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `empleado_id` (`empleado_id`),
  KEY `tasa_id` (`tasa_id`),
  CONSTRAINT `nomina_empleado_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleado` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `nomina_empleado_ibfk_2` FOREIGN KEY (`tasa_id`) REFERENCES `tasa_dolar` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 2 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: pago
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `pago` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pedido_id` int(11) NOT NULL,
  `metodo_pago_id` int(11) NOT NULL,
  `fecha` datetime DEFAULT NULL,
  `monto` decimal(10, 2) DEFAULT NULL,
  `referencia_pago` varchar(255) DEFAULT NULL,
  `creado_en` datetime NOT NULL,
  `actualizado_en` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `pedido_id` (`pedido_id`),
  KEY `metodo_pago_id` (`metodo_pago_id`),
  CONSTRAINT `pago_ibfk_1` FOREIGN KEY (`pedido_id`) REFERENCES `pedido` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `pago_ibfk_2` FOREIGN KEY (`metodo_pago_id`) REFERENCES `metodo_pago` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: pago_servicio
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `pago_servicio` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `servicio_id` int(11) NOT NULL,
  `fecha_pago` date DEFAULT NULL,
  `monto` decimal(10, 2) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `creado_en` datetime NOT NULL,
  `actualizado_en` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `servicio_id` (`servicio_id`),
  CONSTRAINT `pago_servicio_ibfk_1` FOREIGN KEY (`servicio_id`) REFERENCES `servicio_empresa` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: pedido
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `pedido` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cliente_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `fecha` datetime DEFAULT NULL,
  `estado` varchar(255) DEFAULT NULL,
  `total` decimal(10, 2) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `creado_en` datetime NOT NULL,
  `actualizado_en` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `cliente_id` (`cliente_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `pedido_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `cliente` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `pedido_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: pedido_detalle
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `pedido_detalle` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pedido_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad` int(11) DEFAULT NULL,
  `precio_unitario` decimal(10, 2) DEFAULT NULL,
  `subtotal` decimal(10, 2) DEFAULT NULL,
  `creado_en` datetime NOT NULL,
  `actualizado_en` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `pedido_id` (`pedido_id`),
  KEY `producto_id` (`producto_id`),
  CONSTRAINT `pedido_detalle_ibfk_1` FOREIGN KEY (`pedido_id`) REFERENCES `pedido` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `pedido_detalle_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `producto` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: producto
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `producto` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `categoria_id` int(11) NOT NULL,
  `nombre` varchar(255) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `precio` decimal(10, 2) DEFAULT NULL,
  `stock` int(11) DEFAULT NULL,
  `creado_en` datetime NOT NULL,
  `actualizado_en` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `categoria_id` (`categoria_id`),
  CONSTRAINT `producto_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `categoria_producto` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: servicio_empresa
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `servicio_empresa` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` int(11) NOT NULL,
  `nombre` varchar(255) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `proveedor` varchar(255) DEFAULT NULL,
  `creado_en` datetime NOT NULL,
  `actualizado_en` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `empresa_id` (`empresa_id`),
  CONSTRAINT `servicio_empresa_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresa` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: tasa_dolar
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `tasa_dolar` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `tasa` decimal(10, 2) NOT NULL,
  `cambio` decimal(10, 2) DEFAULT NULL COMMENT 'Valor anterior de la tasa de cambio',
  `activa` tinyint(1) DEFAULT 1,
  `fecha` datetime NOT NULL,
  `creado_en` datetime NOT NULL,
  `actualizado_en` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `tasa_dolar_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: tipo_usuario
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `tipo_usuario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) DEFAULT NULL,
  `creado_en` datetime NOT NULL,
  `actualizado_en` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: usuario
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `usuario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empleado_id` int(11) DEFAULT NULL,
  `tipo_usuario_id` int(11) NOT NULL,
  `username` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT NULL,
  `creado_en` datetime NOT NULL,
  `actualizado_en` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `empleado_id` (`empleado_id`),
  KEY `tipo_usuario_id` (`tipo_usuario_id`),
  CONSTRAINT `usuario_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleado` (`id`) ON DELETE
  SET
  NULL ON UPDATE CASCADE,
  CONSTRAINT `usuario_ibfk_2` FOREIGN KEY (`tipo_usuario_id`) REFERENCES `tipo_usuario` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 2 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: caja
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: categoria_producto
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: cliente
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: control_caja
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: empleado
# ------------------------------------------------------------

INSERT INTO
  `empleado` (
    `id`,
    `empresa_id`,
    `nombre`,
    `apellido`,
    `cedula`,
    `telefono`,
    `email`,
    `direccion`,
    `fecha_ingreso`,
    `salario_base`,
    `activo`,
    `creado_en`,
    `actualizado_en`
  )
VALUES
  (
    1,
    1,
    'Administrador',
    'Sistema',
    '12 345 678',
    '+58 (414) 123-4567',
    'admin@admin.com',
    'Direccion',
    '2025-06-30',
    0.00,
    1,
    '2025-06-30 05:19:09',
    '2025-06-30 05:19:09'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: empresa
# ------------------------------------------------------------

INSERT INTO
  `empresa` (
    `id`,
    `nombre`,
    `rif`,
    `direccion`,
    `ciudad`,
    `telefono`,
    `email`,
    `sitio_web`,
    `descripcion`,
    `slogan`,
    `logo`,
    `creado_en`,
    `actualizado_en`
  )
VALUES
  (
    1,
    'Colores y Detalles',
    'J-12345678-1',
    'Direccion',
    'Boconó',
    '+58 (414) 123-4567',
    'email@email.com',
    'https://www.coloresydetalles.com',
    'Empresa dedicada a la venta de productos de ferretería y decoración.',
    'Venta de productos de ferretería y decoración.',
    'logo.png',
    '2025-06-30 05:19:08',
    '2025-06-30 05:19:08'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: iva
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: metodo_pago
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: nomina_empleado
# ------------------------------------------------------------

INSERT INTO
  `nomina_empleado` (
    `id`,
    `empleado_id`,
    `tasa_id`,
    `fecha_inicio`,
    `fecha_fin`,
    `monto`,
    `descripcion`,
    `creado_en`,
    `actualizado_en`
  )
VALUES
  (
    1,
    1,
    2,
    '2025-06-30',
    '2025-07-30',
    50.00,
    'Salario Junio 2025',
    '2025-06-30 06:42:36',
    '2025-06-30 06:42:36'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: pago
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: pago_servicio
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: pedido
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: pedido_detalle
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: producto
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: servicio_empresa
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: tasa_dolar
# ------------------------------------------------------------

INSERT INTO
  `tasa_dolar` (
    `id`,
    `usuario_id`,
    `tasa`,
    `cambio`,
    `activa`,
    `fecha`,
    `creado_en`,
    `actualizado_en`
  )
VALUES
  (
    1,
    1,
    107.62,
    NULL,
    0,
    '2025-06-30 06:39:18',
    '2025-06-30 06:39:18',
    '2025-06-30 06:40:36'
  );
INSERT INTO
  `tasa_dolar` (
    `id`,
    `usuario_id`,
    `tasa`,
    `cambio`,
    `activa`,
    `fecha`,
    `creado_en`,
    `actualizado_en`
  )
VALUES
  (
    2,
    1,
    106.86,
    107.62,
    1,
    '2025-06-30 06:40:36',
    '2025-06-30 06:40:36',
    '2025-06-30 06:40:36'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: tipo_usuario
# ------------------------------------------------------------

INSERT INTO
  `tipo_usuario` (`id`, `nombre`, `creado_en`, `actualizado_en`)
VALUES
  (
    1,
    'admin',
    '2025-06-30 05:19:09',
    '2025-06-30 05:19:09'
  );
INSERT INTO
  `tipo_usuario` (`id`, `nombre`, `creado_en`, `actualizado_en`)
VALUES
  (
    2,
    'user',
    '2025-06-30 05:19:09',
    '2025-06-30 05:19:09'
  );
INSERT INTO
  `tipo_usuario` (`id`, `nombre`, `creado_en`, `actualizado_en`)
VALUES
  (
    3,
    'superadmin',
    '2025-06-30 05:19:09',
    '2025-06-30 05:19:09'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: usuario
# ------------------------------------------------------------

INSERT INTO
  `usuario` (
    `id`,
    `empleado_id`,
    `tipo_usuario_id`,
    `username`,
    `password`,
    `activo`,
    `creado_en`,
    `actualizado_en`
  )
VALUES
  (
    1,
    1,
    1,
    'admin',
    'Admin.123',
    1,
    '2025-06-30 05:19:09',
    '2025-06-30 05:19:09'
  );

/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
