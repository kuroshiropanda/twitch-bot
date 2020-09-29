var counter = 0;
var clipLength;
var clipList;
var clipCursor;
var vol = 1.0;
var clipDisplay = document.getElementById('clips');
var clipTitle = document.getElementById('title');
var overlay = document.getElementById('overlay');
clipDisplay.volume = vol;
clipDisplay.autoplay = true;
var numArr = [];
var numShuff = [];

var param = new URLSearchParams(location.search);

var period = param.get('p'); // valid values: day, week, month, all
var channel = param.get('c');
var shuffle = param.get('shuffle');
var title = param.get('notitle');
var controls = param.get('controls');
var clientId = 'jwk8u0pwwxd37s6tcddynxxj2zk0rp';

var xhttp1 = new XMLHttpRequest();
var xhttp2 = new XMLHttpRequest();

if (period == undefined || period == '') period = 'month'; // if not specified default to month
if (channel == undefined || channel == '') channel = 'kuroshiropanda'; // if not specified default to own channel

function genArray(l) {
    for (i = 0; i < l; i++) {
        numArr.push(i);
    }
}

function shuffNum(o) {
    for (var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

function keyEvent(e){
    if(e.keyCode === 37) previous();
    if(e.keyCode === 39) next();
    if(e.keyCode === 38) volumeUp();
    if(e.keyCode === 40) volumeDown();
    if(e.keyCode === 32) playPause();
}

function initialize() {
    xhttp1.addEventListener('load', initializeClips);
    // xhttp1.open('GET', 'https://api.twitch.tv/kraken/clips/top?period=' + period + '&limit=100&channel=' + channel);
    xhttp1.open('GET', 'https://api.twitch.tv/helix/clips?broadcaster_id=119828736&first=100&started_at=2016-01-01T00:00:00Z&ended_at=2019-12-31T23:59:59Z');
    xhttp1.setRequestHeader('Client-ID', clientId);
    // xhttp1.setRequestHeader('Accept', 'application/vnd.twitchtv.v5+json');
    xhttp1.send();
}

function initializeClips() {
    clipList = JSON.parse(xhttp1.responseText);
    clipLength = clipList.data.length;
    clipCursor = clipList.pagination.cursor;

    genArray(clipLength);
    numShuff = shuffNum(numArr);

    tc = localStorage.getItem('channel');
    pr = localStorage.getItem('period');
    c = localStorage.getItem('counter');

    if (channel !== tc || period !== pr) { i = 0; counter = 0; localStorage.setItem('counter', '0'); }

    var i;
    if (shuffle == 1 || shuffle == true) {
        i = numShuff[0];
        localStorage.setItem('counter', i);
    }
    else {
        if (c !== undefined && c < clipLength) {
            i = c;
            counter = c;
        } else {
            i = 0;
            localStorage.setItem('counter', '0');
        }
    }

    if (i === null) { i = 0; localStorage.setItem('counter', '0'); };

    if (clipLength <= 0) {
        clipDisplay.style.display = 'none';
        overlay.style.display = 'none';
        alert = document.getElementById('alert');
        alert.style.display = 'block';
        alert.innerHTML = "channel doesn't have clips <br>check the username<br>or<br>try changing it to a longer range period<br>try week, month(default) or all";
    } else {
        clipDisplay.src = clipList.data[i].thumbnail_url.slice(0, -20) + ".mp4";
        clipTitle.innerHTML = clipList.data[i].title;
        clipTitle.style.opacity = 1;
        setTimeout(fadeOut, 5000);
    }

    localStorage.setItem('channel', channel);
    localStorage.setItem('period', period);
}

function playPause() {
    if (clipDisplay.paused) {
        clipDisplay.play();
    } else {
        clipDisplay.pause();
    }
}

function previous() {
    counter--;

    if (counter < 0) {
        counter = clipLength - 1;
    }
    localStorage.setItem('counter', counter);

    if (shuffle == 1 || shuffle == true) {
        n = numShuff[counter];
    } else {
        n = counter;
    }

    clipDisplay.src = clipList.data[n].thumbnail_url.slice(0, -20) + ".mp4";
    clipTitle.innerHTML = clipList.data[n].title;
    clipTitle.style.opacity = 1;
    setTimeout(fadeOut, 5000);
}

function next() {
    counter++;
    localStorage.setItem('counter', counter);

    if (shuffle == 1 || shuffle == true) {
        n = numShuff[counter];
    } else {
        n = counter;
    }

    if (counter >= clipLength) {
        counter = 0;
        localStorage.setItem('counter', 0);
        getNewClips();
    } else {
        clipDisplay.src = clipList.data[n].thumbnail_url.slice(0, -20) + ".mp4";
        clipTitle.innerHTML = clipList.data[n].title;
        clipTitle.style.opacity = 1;
        setTimeout(fadeOut, 5000);
    }
}

function volume(event) {
    var y = event.deltaY;
    if (y < 0) {
        if (clipDisplay.volume < 1) {
            vol += 0.1;
        }
    } else {
        if (clipDisplay.volume > 0) {
            vol -= 0.1;
        }
    }
    clipDisplay.volume = vol.toFixed(1);
    showVolume();
}

function volumeUp() {
    if (clipDisplay.volume < 1) {
        vol += 0.1;
    }
    clipDisplay.volume = vol.toFixed(1);
    showVolume();
}

function volumeDown() {
    if (clipDisplay.volume > 0) {
        vol -= 0.1;
    }
    clipDisplay.volume = vol.toFixed(1);
    showVolume();
}

function showVolume() {
    volDisp = vol.toFixed(1) * 100;
    curVol = document.getElementById("curVol");
    curVol.innerHTML = volDisp;
    var volOverlay = document.getElementById("volume");
    volOverlay.style.opacity = 1;
    setTimeout(function(){
        volOverlay.style.opacity = 0;
    }, 3000);
}

function getNewClips() {
    xhttp2.addEventListener('load', reloadNewClips);
    // xhttp2.open('GET', 'https://api.twitch.tv/kraken/clips/top?period=' + period + '&limit=100&channel=' + channel + '&cursor=' + clipCursor);
    xhttp2.open('GET', 'https://api.twitch.tv/helix/clips?broadcaster_id=119828736&first=100&after=' + clipCursor + '&started_at=2016-01-01T00:00:00Z&ended_at=2019-12-31T23:59:59Z')
    xhttp2.setRequestHeader('Client-ID', clientId);
    // xhttp2.setRequestHeader('Accept', 'application/vnd.twitchtv.v5+json');
    xhttp2.send();

    numArr = [];
}

function reloadNewClips() {
    clipList = JSON.parse(xhttp2.responseText);
    clipLength = clipList.data.length;
    clipCursor = clipList.pagination.cursor;

    genArray(clipLength);
    numShuff = shuffNum(numArr);

    if (shuffle == 1 || shuffle == true) {
        n = numShuff[0];
    } else {
        n = 0;
        localStorage.setItem('counter', '0');
    }

    clipDisplay.src = clipList.data[n].thumbnail_url.slice(0, -20) + ".mp4";
    clipTitle.innerHTML = clipList.data[n].title;
    clipTitle.style.opacity = 1;
    setTimeout(fadeOut, 5000);
}

function fadeOut() {
    clipTitle.style.opacity = 0;
}

if(title == '1' || title == 1 || title == true) clipTitle.style.display = 'none';

if(controls == '1' || controls == 1) overlay.style.display = 'block';

var ppButton = document.getElementById("pp");
ppButton.innerHTML = 'play_circle_filled';
clipDisplay.addEventListener('play', function(){
    ppButton.innerHTML = 'pause_circle_filled';
});

clipDisplay.addEventListener('pause', function(){
    ppButton.innerHTML = 'play_circle_filled';
});

initialize();