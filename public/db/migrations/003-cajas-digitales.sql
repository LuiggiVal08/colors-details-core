ALTER TABLE caja
    ADD COLUMN tipo ENUM('fisica', 'digital') NOT NULL DEFAULT 'fisica',
    ADD COLUMN cuenta_receptora VARCHAR(160) NULL;

ALTER TABLE movimiento_caja
    MODIFY COLUMN control_caja_id INT NULL,
    ADD COLUMN caja_id INT NULL,
    ADD COLUMN medio_pago ENUM('efectivo', 'digital') NOT NULL DEFAULT 'efectivo',
    ADD COLUMN metodo_pago_id INT NULL,
    ADD COLUMN referencia VARCHAR(120) NULL,
    ADD COLUMN cuenta_receptora VARCHAR(160) NULL;

UPDATE movimiento_caja mc
INNER JOIN control_caja cc ON cc.id = mc.control_caja_id
SET mc.caja_id = cc.caja_id
WHERE mc.caja_id IS NULL;

ALTER TABLE movimiento_caja
    MODIFY COLUMN caja_id INT NULL,
    ADD CONSTRAINT movimiento_caja_caja_fk
        FOREIGN KEY (caja_id) REFERENCES caja (id)
        ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE movimiento_caja
    ADD CONSTRAINT movimiento_caja_metodo_pago_fk
        FOREIGN KEY (metodo_pago_id) REFERENCES metodo_pago (id)
        ON DELETE NO ACTION ON UPDATE CASCADE;
