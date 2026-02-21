import express from 'express'
import { getPublicLanding, getPublicProjects } from '../controllers/landingController.js'
import {
  getPublicQuizzes,
  getQuizCorrectResponders,
  submitQuizAnswer,
} from '../controllers/presentationQuizController.js'
import { getPoll, getPublicPolls, votePoll } from '../controllers/pollController.js'
import { getPublicVideos } from '../controllers/externalVideoController.js'
import { getPublicAudio as getPublicPresentationAudio } from '../controllers/presentationAudioController.js'
import { getPublicTimeline } from '../controllers/timelineController.js'
import { getVirtualSeminarTimeline } from '../controllers/themeController.js'
import { joinOrHeartbeat, leave, getCount } from '../controllers/virtualSeminarViewController.js'
import { getSeminarStatusPublic, registerForSeminar, getPublicSeminars } from '../controllers/seminarController.js'
import { optionalAuthMiddleware } from '../middleware/auth.js'
import { getPublicAudioList, logAudioPlay } from '../controllers/musicController.js'
import { getPublicFrameList } from '../controllers/frameController.js'
import { processVideo } from '../controllers/videoProcessController.js'
import { uploadVideo } from '../middleware/upload.js'

const router = express.Router()

router.get('/landing', getPublicLanding)
router.get('/seminars', getPublicSeminars)
router.get('/projects', getPublicProjects)
router.get('/presentation-quizzes', getPublicQuizzes)
router.get('/presentation-quizzes/:id/correct-responders', getQuizCorrectResponders)
router.post('/presentation-quizzes/:id/answer', optionalAuthMiddleware, submitQuizAnswer)
router.get('/polls/:id', getPoll)
router.get('/polls', getPublicPolls)
router.get('/external-videos', getPublicVideos)
router.get('/presentation-audio', getPublicPresentationAudio)
router.get('/timelines/:id', getPublicTimeline)
router.get('/virtual-seminar-status', getSeminarStatusPublic)
router.post('/virtual-seminar-register', registerForSeminar)
router.get('/virtual-seminar-timeline', getVirtualSeminarTimeline)
router.post('/virtual-seminar-viewer', joinOrHeartbeat)
router.post('/virtual-seminar-viewer-leave', leave)
router.get('/virtual-seminar-viewer-count', getCount)
router.post('/polls/:id/vote', optionalAuthMiddleware, votePoll)
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
