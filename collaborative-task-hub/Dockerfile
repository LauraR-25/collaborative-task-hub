FROM node:20-alpine AS build

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# Copiar el resto del código fuente
COPY . .

# Argumento para la URL de la API (se pasa en build time)
# OJO: Vite “hornea” estas vars en build time. Si no se pasa este build-arg,
# el frontend quedaría apuntando al valor por defecto.
ARG VITE_API_GATEWAY_URL=https://api.tasksflowcenter.online
ENV VITE_API_GATEWAY_URL=$VITE_API_GATEWAY_URL

# Construir la aplicación
RUN pnpm run build

# Production stage
FROM nginx:alpine

# Copiar los archivos construidos
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Healthcheck opcional (ya lo tienes)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]