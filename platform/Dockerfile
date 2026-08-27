FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY tsconfig.json ./
COPY server ./server
COPY web ./web
COPY public ./public
RUN npm run build && npm run typecheck

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
EXPOSE 8800
CMD ["node", "node_modules/tsx/dist/cli.mjs", "server/index.ts"]
