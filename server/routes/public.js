import express from 'express'
import { getPublicLanding, getPublicProjects } from '../controllers/landingController.js'
import { getPublicAudioList, logAudioPlay } from '../controllers/musicController.js'
import { getPublicFrameList } from '../controllers/frameController.js'
import { processVideo } from '../controllers/videoProcessController.js'
import { uploadVideo } from '../middleware/upload.js'

const router = express.Router()

router.get('/landing', getPublicLanding)
router.get('/projects', getPublicProjects)
router.get('/audio', getPublicAudioList)
router.post('/audio/:id/play', logAudioPlay)
router.get('/frames', getPublicFrameList)
router.post('/video/process', (req, res, next) => {
  uploadVideo(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Video upload failed' })
    next()
  })
}, processVideo)

export default router
