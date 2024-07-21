# OPEN PETITION BOT

єПетиція - цей бот призначений для автоматичної агрегації та оновлення інформації про найактуальніші петиції, що подані на розгляд президенту. Він допомагає користувачам бути в курсі найважливіших громадських ініціатив та легко знаходити петиції, які відповідають їхнім інтересам та поглядам.

### Telegram bot : [єПетиція](https://t.me/OpenPetitionBot)

## Project setup

```
npm install
```

## Project variables

| Key         | Comment                              |
| ----------- | ------------------------------------ |
| `PORT`      | API Port (optional)                  |
| `HOST`      | API Host (optional)                  |
| `NODE_ENV`  | Operating mode (default: production) |
| `SECRET`    | Secret key (optional)                |
| `MONGO_URI` | Mongo connection string              |
| `BOT_TOKEN` | Telegram bot token                   |
| `WEB_HOOK`  | Telegram Web Hook URL (optional)     |
| `PROXY`     | Proxy server (optional)              |
| `DONATE`    | URL for donate (optional)            |

### Development

```bash
npm run start:dev
```

### Build Production

```bash
npm run build
```

### Build Docker images

```bash
# Build docker image
docker compose build

# Build docker multiplatform images
docker compose build --builder multibuilder

# Pushes images to the repository
docker compose push
```

If your cloud uses a different CPU architecture than your development
machine (e.g., you are on a Mac M1 and your cloud provider is amd64),
you'll want to build the image for that platform, e.g.:

```bash
# Make sure you have buildx installed. If it is not installed, install it as follows
docker buildx install

# Build and switch to buildx builder
docker buildx create --platform linux/amd64,linux/i386,linux/arm/v5,linux/arm/v6,linux/arm/v7,linux/arm64,linux/ppc64le,linux/s390x --name multibuilder --use

# Start the builder instance
docker buildx inspect --bootstrap
```

```bash
# Use Docker registry
docker login
```

### Quick Start

```bash
npm run start
```

### PM2 Quick Start

```bash
# Start application
pm2 start ecosystem.config.js

# Stop application
pm2 stop ecosystem.config.js

# Restart application
pm2 restart ecosystem.config.js

# Reload application
pm2 reload ecosystem.config.js

# Delete application
pm2 delete ecosystem.config.js

# Logs application
pm2 logs open-petition-bot
```

### Docker Quick Start

```bash
# Create custom docker compose file `compose.yaml`
services:
  app:
    image: baklai/open-petition-bot:latest
    env_file: .env
    environment:
      - NODE_ENV=production
    ports:
      - 3000:3000
    restart: unless-stopped
    container_name: open-petition-bot
```

```bash
# Start application
docker compose up -d
```

```bash
# Logs application
docker logs -f open-petition-bot
```

In the terminal, run the following command to stop the application.

```bash
# Delete application
docker compose down
```

## Лицензия

[MIT](LICENSE)
