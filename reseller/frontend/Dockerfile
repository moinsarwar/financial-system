# Build stage  
FROM node:18-alpine as build  
  
WORKDIR /app  
  
# Copy package files and install dependencies  
COPY package*.json ./  
RUN npm ci --silent || npm install
  
# Copy source and build  
COPY . .  
RUN npm run build  
  
# Production stage with nginx  
FROM nginx:alpine  
  
# Copy built files to nginx serve directory  
COPY --from=build /app/build /usr/share/nginx/html  
  
# Copy custom nginx config  
COPY nginx.conf /etc/nginx/conf.d/default.conf  
  
EXPOSE 80  
  
CMD ["nginx", "-g", "daemon off;"]
