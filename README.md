# kuroshiropanda's custom twitch bot

A custom twitch bot to automate most interactions on kuroshiropanda's twitch channel

## To do

+ Command Handler
+ A page maybe for signup
+ A better readme
+ changelogs
+ ...

## Installation

```bash
git clone https://github.com/kuroshiropanda/kuroshiropanda-twitch-bot.git
npm install
npm start
```

## Usage

copy .env.example and create a .env file
environment variables
| Variable                | Description |
|-------------------------|-------------|
| OBS_ADDRESS             |obs-websocket address|
| OBS_PASSWORD            |obs-websocket password|
| TWITCH_CLIENT_ID        |twitch api client id|
| TWITCH_CLIENT_SECRET    |twitch api client secret
| TWITCH_CALLBACK_URI     |twitch api callback url|
| SL_CLIENT_ID            |streamlabs api client id|
| SL_CLIENT_SECRET        |streamlabs api client secret|
| SL_CALLBACK_URI         |streamlabs api callback url|
| MONGODB_URL             |mongodb database url|
| MONGODB_USER            |mongodb database username|
| MONGODB_PASS            |mongodb database password|
