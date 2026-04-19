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
