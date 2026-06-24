FROM node:24-alpine AS build

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY tsconfig.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate
RUN npm run build

FROM node:24-alpine AS runtime

WORKDIR /app

RUN apk add --no-cache libstdc++

ENV NODE_ENV=production
ENV DATABASE_URL=file:/app/data/dev.db

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist

RUN mkdir -p /app/data

EXPOSE 5300/udp

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/index.js"]
