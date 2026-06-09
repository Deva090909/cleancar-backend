FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
RUN npm install -g @nestjs/cli
COPY . .
RUN npx prisma generate
RUN nest build
RUN ls -la dist/ && echo "BUILD SUCCESS"
EXPOSE 3000
CMD ["node", "dist/main"]

# CORS fix rebuild 2026-06-09 16:33
