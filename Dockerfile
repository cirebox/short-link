FROM node:25

WORKDIR /home/app/short-link-teddy
COPY package.json ./
RUN npm install --legacy-peer-deps
COPY . .
CMD npx prisma generate && npx prisma db push && npx prisma db seed && npm run start:dev