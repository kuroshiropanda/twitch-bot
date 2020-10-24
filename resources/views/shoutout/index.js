'use strict';

const socket = io();

socket.on('connect', () => console.log('socketio: connected'));

const shoutout = document.getElementById('shoutout');
const player = document.getElementById('clip');
const title = document.getElementById('username');
player.volume = 0.5;
player.autoplay = true;

let clips = [];

socket.on('onShoutout', (data) => {
  console.log(data);
  shoutout.style.display = 'block';
  const num = randNum(data.clips.length - 1);
  const user = `twitch.tv/${data.user}`;
  if (!player.paused && !player.ended) {
    clips.push({
      user: user,
      clip: data.clips[num]
    });
  } else {
    title.innerHTML = user;
    player.src = data.clips[num];
    player.play();
  }
});

function randNum(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function checkQueue() {
  if (clips.length > 0) {
    const queue = clips.shift();
    title.innerHTML = queue.user;
    player.src = queue.clip;
    player.play();
  } else {
    removeVideo();
  }
}

function removeVideo() {
  shoutout.style.display = 'none';
  title.innerHTML = '';
  player.src = '';
}