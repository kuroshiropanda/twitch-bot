'use strict';

import PubSubClient from 'twitch-pubsub-client';

const twitch = require('../../modules/twitch');

export const pubsub = new PubSubClient();
pubsub.registerUserListener(twitch, channel).then(() => {
    console.log('PubSub connected successfully');
}).catch((e) => {
    console.log(e);
});