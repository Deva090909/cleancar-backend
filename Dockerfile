FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
RUN npm install -g @nestjs/cli
COPY prisma ./prisma/
RUN npx --yes prisma generate
COPY . .
RUN nest build
RUN ls -la dist/ && echo "BUILD SUCCESS"
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
