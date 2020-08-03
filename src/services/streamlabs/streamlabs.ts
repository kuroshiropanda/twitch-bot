'use strict';

const axios = require('axios').default;
const fs = require('fs');

const SLData = JSON.parse(fs.readFileSync('./streamlabs.json', { encoding: 'utf8' }));

const streamlabs = {
    credits: () => {
        axios.post('https://streamlabs.com/api/v1.0/credits/roll', {
            access_token: SLData.access_token
        }).catch((e) => {
            console.error(e);
        });
    },

    alerts: () => {
        axios.post('https://streamlabs.com/api/v1.0/alerts', {
            access_token: SLData.access_token,
            type: 'donation',
            message: 'Test alert',
            duration: '8000'
        }).catch((e) => {
            console.error(e);
        });
    },

    testAlert: () => {
        axios.post('https://streamlabs.com/api/v1.0/alerts/send_test_alert', {
            access_token: SLData.access_token,
            type: 'donation',
            platform: 'twitch'
        });
    }
}

module.exports = streamlabs;