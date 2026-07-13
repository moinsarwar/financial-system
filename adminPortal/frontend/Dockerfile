FROM node:20-alpine

WORKDIR /app

COPY package.json .
# We will use npm install instead of copying lock file just in case it doesn't exist
RUN npm install

COPY . .

EXPOSE 5174

# Run vite dev server for local dev (in production we would build and serve)
CMD ["npm", "run", "dev"]
