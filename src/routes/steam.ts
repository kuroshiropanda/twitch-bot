import { Steam } from '@steam'
import express from 'express'

export const steamRouter = express.Router()

steamRouter.get(`/update`, async (req, res) => {
  const steam = await Steam.updateJSON()
  res.send(steam)
})
