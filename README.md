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

### Build

```bash
npm run build
```

### Production

```bash
npm run start
```

### PM2 Process Management Quick Start

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
```

```bash
# Logs application

pm2 logs open-petition-bot
```

### Docker Compose Quick Start

```bash
# Start application

docker compose up --build -d
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
