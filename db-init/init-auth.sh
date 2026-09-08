#!/bin/bash
# En volumen fresco: fuerza mysql_native_password para root.
# Necesario para que los clientes CLI (mysql/mysqldump de Alpine/MariaDB)
# puedan autenticarse contra MySQL 8.4 dentro de /api/setup/db/{dump,restore}.
set -e

mysql -uroot <<'SQL'
ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY '';
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';
FLUSH PRIVILEGES;
SQL
