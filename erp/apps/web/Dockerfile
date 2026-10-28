FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN npm install --workspaces --include-workspace-root || npm install
COPY apps/web ./apps/web
ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL
WORKDIR /app/apps/web
RUN npm run build

FROM nginx:alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
