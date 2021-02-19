import { EventEmitter } from 'events'
import { Server as HttpServer } from 'http'
import { Server } from 'socket.io'

import { Events } from '@events'
import {
  onChatEvent,
  onShoutoutEvent
} from '@models'

export const Event = new EventEmitter()

export class EventHandler {

  private io: Server

  constructor(server: HttpServer) {
    this.io = new Server(server)
  }

  public async init() {
    this.io.on('connect', (socket) => console.log(`${socket.id} connected`))

    Event.addListener(Events.onChat, (onChatEvent: onChatEvent) => this.onChat(onChatEvent))
    Event.addListener(Events.onShoutout, (onShoutoutEvent: onShoutoutEvent) => this.onShoutout(onShoutoutEvent))
  }

  private onChat(onChatEvent: onChatEvent) {
    this.io.emit(Events.onChat, onChatEvent)
  }

  private onShoutout(onShoutoutEvent: onShoutoutEvent) {
    this.io.emit(Events.onShoutout, onShoutoutEvent)
  }
}