FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN npm install --workspaces --include-workspace-root || npm install
COPY apps/api ./apps/api
WORKDIR /app/apps/api
RUN npx prisma generate && npm run build
EXPOSE 4000
CMD ["sh", "-c", "npx prisma db push && node dist/server.js"]
