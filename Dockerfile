FROM node:26-alpine

# Actualiza el gestor de paquetes (apk) y aplica parches de seguridad a los binarios del sistema
RUN apk update && apk upgrade --no-cache

# Cliente MySQL para las funciones de copia de seguridad/restauración (/api/setup/db/*)
RUN apk add --no-cache mysql-client

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
