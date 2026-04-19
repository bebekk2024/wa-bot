# wa-bot

WhatsApp Bot menggunakan Baileys

## Setup

1. Clone repository
2. `npm install`
3. Copy `.env.example` ke `.env`
4. `npm start`

## Deploy ke Heroku

```bash
heroku create app-name
heroku config:set SESSION_NAME=session
git push heroku main


# 1. Clone (jika belum)
git clone https://github.com/bebekk2024/wa-bot.git
cd wa-bot

# 2. Create app
heroku create nama-app-anda

# 3. Deploy
git push heroku main

# 4. Monitor
heroku logs --tail
