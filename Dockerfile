FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production || npm install --only=production
COPY . .
RUN npm run build || true
ENV PORT 3000
EXPOSE 3000
CMD ["npm", "run", "start"]
