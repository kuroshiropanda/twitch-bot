'use strict';

const dotenv = require('dotenv');
dotenv.config();

const TwitchClient = require('twitch').default;
const ChatClient = require('twitch-chat-client').default;
const PubSubClient = require('twitch-pubsub-client').default;
const express = require('express');
const axios = require('axios');

const OBSWebSocket = require('obs-websocket-js');

const say = require('say');
const { Howl, Howler } = require('howler');
const fs = require('fs');

const obs = new OBSWebSocket();

obs.connect({
    address: process.env.obs_address || 'localhost:4444',
    password: process.env.obs_password || '042394'
}).then(() => {
    console.log(`OBSWEBSocket: Success! We're connected & authenticated.`);
}).catch(err => {
    console.log(err);
});

const clientId = process.env.TWITCH_CLIENT_ID;
const clientSecret = process.env.TWITCH_CLIENT_SECRET;
const redirectURI = process.env.TWITCH_CALLBACK_URI;

const scopes = [
    'bits:read',
    'channel:edit:commercial',
    'channel:moderate',
    'channel:read:subscriptions',
    'channel:read:redemptions',
    'clips:edit',
    'chat:edit',
    'chat:read',
    'user:edit:broadcast',
    'channel_commercial',
    'channel_subscriptions',
    'channel_editor'
];

const ClientOnRefresh = ({ accessToken, refreshToken, expiryDate }) => {
    const newTokenData = {
        accessToken,
        refreshToken,
        expiryTimestamp: expiryDate === null ? null : expiryDate.getTime()
    };

    fs.writeFileSync('./token.json', JSON.stringify(newTokenData, null, 4), { encoding: 'UTF8' });
};

const channel = 'kuroshiropanda';

const dance = () => Math.random() < 0.25;

const tokenData = JSON.parse(fs.readFileSync('./token.json', { encoding: 'UTF8' }));

const twitch = TwitchClient.withCredentials(clientId, tokenData.accessToken, scopes, {
    clientSecret,
    refreshToken: tokenData.refreshToken,
    expiry: tokenData.expiryTimestamp === null ? null : new Date(tokenData.expiryTimestamp),
    onRefresh: ClientOnRefresh
});

const chat = ChatClient.forTwitchClient(twitch, { channels: ['kuroshiropanda'], });
chat.connect().then(() => {
    console.log('bot connected successfully');
}).catch((e) => {
    console.log(e);
});

chat.onPrivmsg((channel, user, message, msg) => {
    console.log(`${user} : ${message}`);

    if (msg.tags.get('msg-id') === 'highlighted-message') {
        say.speak(message);
    }

    const command = message.trim();

    if(command === '!ss') {
        say.stop();
    } else if(command === '!dance') {
        chat.say(channel, `${channel} will ${dance() ? 'dance' : 'not dance'}`);
    }
});

const pubsub = new PubSubClient();
pubsub.registerUserListener(twitch, channel).then(() => {
    console.log('PubSub connected successfully');
}).catch((e) => {
    console.log(e);
});

pubsub.onRedemption(channel, (msg) => {
    console.log(`${msg.userName} redeemed ${msg.rewardId} : ${msg.rewardName}`);

    // ad time
    if (msg.rewardId === '48ec132b-10d4-4d89-80f2-79e89108ea53') {
        chat.runCommercial(channel, 30).catch((e) => {
            console.log(e);
        });
    }

    // to be continued
    if (msg.rewardId === '0b21ea53-344a-4ac1-9dd1-b11b3ff50726') {
        obs.send('GetCurrentScene').then(data => {
            obs.send('SetCurrentScene', {
                "scene-name": 'freeze frame'
            });

            setTimeout(() => {
                obs.send('SetSourceFilterVisibility', {
                    sourceName: 'IRL',
                    filterName: 'Freeze',
                    filterEnabled: true
                });

                obs.send('SetSourceFilterVisibility', {
                    sourceName: 'IRL',
                    filterName: 'Vintage',
                    filterEnabled: true
                });
            }, 3800);

            setTimeout(() => {
                obs.send('SetCurrentScene', {
                    'scene-name': data.name
                });
            }, 12000);

            setTimeout(() => {
                obs.send('SetSourceFilterVisibility', {
                    sourceName: 'IRL',
                    filterName: 'Freeze',
                    filterEnabled: false
                });

                obs.send('SetSourceFilterVisibility', {
                    sourceName: 'IRL',
                    filterName: 'Vintage',
                    filterEnabled: false
                });
            }, 13000);
        });
    }

    // brain power reward
    if (msg.rewardId === '051716ec-4ef1-47fd-9a2d-05cdcbf3cf42') {
        obs.send('SetSourceSettings', {
            sourceName: 'BRAIN POWER',
            sourceSettings: {
                sourceEnabled: true
            }
        });
    }

    // shout out
    if (msg.rewardId === 'ec633702-a265-4ae5-bb67-acd4c5204c3b') {
        say.speak(`Shout out to ${msg.userName}`);
    }

    // time out
    if (msg.rewardId === 'c13eb27a-4581-438d-8076-b1c7db68bc57') {
        chat.timeout(channel, msg.message, 180, `${msg.userDisplayName} redeemed ${msg.rewardName}`);
    }

    var stopStream;
    var currentScene;

    // stop stream
    if (msg.rewardId === '853b6498-800e-486a-a475-4db03e45bc5c') {
        obs.send('GetCurrentScene').then(data => {
            currentScene = data.name;
        });

        obs.send('SetCurrentScene', {
            'scene-name': 'outro'
        });

        stopStream = setTimeout(() => {
            obs.send('StopStreaming');
        }, 30 * 1000);
    }

    // cancel stop stream
    if (msg.rewardId === '1da0e924-a4fa-4056-8261-68dbf477fa07') {
        obs.send('SetCurrentScene', {
            'scene-name': currentScene ? currentScene : 'main display'
        }).catch(e => {
            console.log(e);
        });

        clearTimeout(stopStream);
    }
});

pubsub.onSubscription(channel, (msg) => {
    chat.say(channel, `${channel} will ${dance() ? 'dance' : 'not dance'}`);
});

pubsub.onBits(channel, (msg) => {
    if (msg.bits >= 500) {
        chat.say(channel, `${channel} will ${dance() ? 'dance' : 'not dance'}`);
    }
});

const app = express();

app.get('/', (req, res) => {
    res.redirect(`https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectURI}&response_type=code&scope=${scopes.join(' ')}&force_verify=true`);
});

app.get('/callback', (req, res) => {
    axios({
        method: 'POST',
        url: `https://id.twitch.tv/oauth2/token`,
        params: {
            client_id: clientId,
            client_secret: clientSecret,
            code: req.query.code,
            grant_type: 'authorization_code',
            redirect_uri: redirectURI
        }
    }).then((res) => {
        console.log(res.data);
        const accessToken = res.data.access_token;
        const refreshToken = res.data.refresh_token;
        const expiryDate = res.data.expires_in;
        const newTokenData = {
            accessToken,
            refreshToken,
            expiryTimestamp: expiryDate
        };

        fs.writeFileSync('./token.json', JSON.stringify(newTokenData, null, 4), { encoding: 'UTF8' });
    }).catch((e) => {
        console.error(e.message);
    });
});

app.listen(3000, () => {
    console.log(`app listening at http://localhost:3000`);
});