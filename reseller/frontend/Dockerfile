# Build stage  
FROM node:18-alpine as build  
  
WORKDIR /app  
  
# Copy package files and install dependencies  
COPY package*.json ./  
RUN npm ci --silent || npm install
  
# Copy source and build  
COPY . .  
ARG REACT_APP_API_URL=/api
ARG REACT_APP_FINOS_PUBLIC_HOST=thecomparisonengine.com
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_FINOS_PUBLIC_HOST=$REACT_APP_FINOS_PUBLIC_HOST
RUN npm run build  
  
# Production stage with nginx  
FROM nginx:alpine  
  
# Copy built files to nginx serve directory  
COPY --from=build /app/build /usr/share/nginx/html  
  
# Copy custom nginx config  
COPY nginx.conf /etc/nginx/conf.d/default.conf  
  
EXPOSE 80  
  
CMD ["nginx", "-g", "daemon off;"]
