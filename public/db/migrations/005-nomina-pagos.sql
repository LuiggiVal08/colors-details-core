CREATE TABLE nomina_pago (
    id INT NOT NULL AUTO_INCREMENT,
    nomina_id INT NOT NULL,
    movimiento_caja_id INT NOT NULL,
    usuario_id INT NOT NULL,
    monto DECIMAL(12, 2) NOT NULL,
    medio_pago ENUM('efectivo', 'digital') NOT NULL DEFAULT 'efectivo',
    referencia VARCHAR(120) NULL,
    cuenta_receptora VARCHAR(160) NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY nomina_pago_movimiento_uq (movimiento_caja_id),
    KEY nomina_pago_nomina_idx (nomina_id),
    KEY nomina_pago_usuario_idx (usuario_id),
    CONSTRAINT nomina_pago_nomina_fk
        FOREIGN KEY (nomina_id) REFERENCES nomina (id)
        ON DELETE NO ACTION ON UPDATE CASCADE,
    CONSTRAINT nomina_pago_movimiento_fk
        FOREIGN KEY (movimiento_caja_id) REFERENCES movimiento_caja (id)
        ON DELETE NO ACTION ON UPDATE CASCADE,
    CONSTRAINT nomina_pago_usuario_fk
        FOREIGN KEY (usuario_id) REFERENCES usuario (id)
        ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE nomina_pago_detalle (
    id INT NOT NULL AUTO_INCREMENT,
    nomina_pago_id INT NOT NULL,
    nomina_detalle_id INT NOT NULL,
    monto DECIMAL(12, 2) NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY nomina_pago_detalle_pago_empleado_uq (nomina_pago_id, nomina_detalle_id),
    KEY nomina_pago_detalle_nomina_detalle_idx (nomina_detalle_id),
    CONSTRAINT nomina_pago_detalle_pago_fk
        FOREIGN KEY (nomina_pago_id) REFERENCES nomina_pago (id)
        ON DELETE NO ACTION ON UPDATE CASCADE,
    CONSTRAINT nomina_pago_detalle_nomina_detalle_fk
        FOREIGN KEY (nomina_detalle_id) REFERENCES nomina_detalle (id)
        ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
