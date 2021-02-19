import express from 'express'

import { Steam } from '@steam'

const steamRoute = express.Router()

steamRoute.get(`/update`, async (req, res) => {
  const steam = await Steam.updateJSON()
  res.send(steam)
})

export { steamRoute }