import axios from 'axios'
import { promises as fs } from 'fs'

export default class Steam {
  public static async updateJSON() {
    try {
      const data = await axios.get('https://api.steampowered.com/ISteamApps/GetAppList/v2/')

      await fs.writeFile('steam.json', JSON.stringify(data.data.applist, null, 2), 'utf-8')
      return data.data.applist
    } catch (err) {
      console.error(err)
      return err
    }
  }

  public static async getGameUrl(game: string) {
    const json = JSON.parse(await fs.readFile('steam.json', { encoding: 'utf-8' }))
    for (const app of json.apps) {
      if (app.name === game) {
        const name = app.name.replace(/\'/g, '').replace(/\s/g, '_')
        return `https://store.steampowered.com/app/${app.appid}/${name}`
      }
    }

    return ''
  }
}