FROM node:24-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

RUN corepack enable
RUN corepack prepare pnpm@12.3.4 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY extensions ./extensions

RUN pnpm install --frozen-lockfile

COPY . .

RUN mkdir -p public
RUN pnpm prisma generate
RUN pnpm build

FROM node:24-alpine AS runtime

RUN apk add --no-cache openssl

WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["./node_modules/.bin/react-router-serve", "build/server/index.js"]
