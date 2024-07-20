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

```
npm run start:dev
```

### Build

```
npm run build
```

### Production

```
npm run start
```

### Run the application

```
docker compose up --build -d
```

```
docker ps -a
```

```
docker logs -f open-petition-bot
```

In the terminal, run the following command to stop the application.

```
docker compose down
```

## Лицензия

[MIT](LICENSE)
