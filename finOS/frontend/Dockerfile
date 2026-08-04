FROM node:18-alpine AS base  
WORKDIR /app  
COPY package*.json ./  
RUN npm install  
  
FROM base AS development  
COPY . .  
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]  
  
FROM base AS builder  
COPY . .  
ARG VITE_API_URL=/api  
ARG VITE_RESELLER_API_URL=https://reseller.thecomparisonengine.com  
ENV VITE_API_URL=${VITE_API_URL}  
ENV VITE_RESELLER_API_URL=${VITE_RESELLER_API_URL}  
RUN npm run build  
  
FROM nginx:alpine AS production  
COPY --from=builder /app/dist /usr/share/nginx/html  
COPY nginx.conf /etc/nginx/conf.d/default.conf  
EXPOSE 80  
CMD ["nginx", "-g", "daemon off;"]
