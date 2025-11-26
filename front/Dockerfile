FROM node:20

WORKDIR /app

# Copiamos package* primero para cache
COPY package.json package-lock.json* ./
RUN npm install

# Copiamos el resto del front
COPY . .

# Por defecto, para desarrollo lanzamos Vite
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
