ALTER TABLE `empleado`
    ADD COLUMN `frecuencia_pago` ENUM('mensual', 'quincenal', 'semanal') NOT NULL DEFAULT 'mensual'
    AFTER `salario_base`;

ALTER TABLE `nomina_empleado`
    ADD COLUMN `bono` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER `monto`,
    ADD COLUMN `deduccion` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER `bono`,
    ADD COLUMN `monto_usd` DECIMAL(10, 2) DEFAULT NULL AFTER `deduccion`;
