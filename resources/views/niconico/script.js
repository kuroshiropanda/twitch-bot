const socket = io('http://localhost:8000')
socket.connect()

let messagesArray = []
let maxMovementNums = 3

const messagesDiv = document.getElementById('messages')

socket.on('NicoNicoChat', (data) => {
  console.log(data)
  let emotes = data.emotes
  let text = data.message
  let user = data.user

  if (text.startsWith('!')) return

  const regex = /<.*>/g
  if (text.search(regex) >= 0) return

  // if (user.toLowerCase() == 'nightbot' || 'u2san_' || 'kuroshiropanda_') return

  const msgDiv = document.createElement('div')
  const msgContentDiv = document.createElement('span')

  let movementNum = 0

  msg = ''
  for (const em of emotes) {
    if (em.id) {
      msg += `<span><img class="emotes" src="https://static-cdn.jtvnw.net/emoticons/v1/${em.id}/2.0" /></span>`
    } else {
      msg += `${em.text}`
    }
  }

  msgDiv.id = data.id
  msgDiv.className += 'message'
  msgDiv.className += ` messageMovement${movementNum}`

  msgContentDiv.className += 'messageContent'

  msgContentDiv.innerHTML = msg

  msgDiv.style.top = Math.random() * 400

  msgDiv.appendChild(msgContentDiv)
  messagesDiv.appendChild(msgDiv)

  movementNum = movementNum >= maxMovementNums ? 0 : movementNum + 1

  setTimeout(function() {
    document.getElementById(`${msgDiv.id}`).outerHTML = ''
  }, 20000)
})
