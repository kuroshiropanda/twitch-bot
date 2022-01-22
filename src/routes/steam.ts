import { Steam } from '@steam'
import express from 'express'

const steamRouter = express.Router()

steamRouter.get(`/update`, async (req, res) => {
  const steam = await Steam.updateJSON()
  res.send(steam)
})

export const steamRoutes = () => steamRouter
