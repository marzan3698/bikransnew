import express from 'express'
import {
  getDashboard,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  getAnalytics,
  createUserValidation,
  getProjects,
  createProject,
  updateProject,
  deleteProject
} from '../controllers/adminController.js'
import {
  getAdminSliders,
  createSlider,
  updateSlider,
  deleteSlider,
  reorderSliders
} from '../controllers/sliderController.js'
import {
  getHeaderSettings,
  updateHeaderSettings,
  uploadLogo as uploadLogoController,
  updateFooterVisibility,
  getAdminFooterNavItems,
  createFooterNavItem,
  updateFooterNavItem,
  deleteFooterNavItem,
  reorderFooterNavItems,
  getAdminBgVideo,
  updateAdminBgVideo,
  getAdminVirtualSeminarTimeline,
  updateVirtualSeminarTimeline,
} from '../controllers/themeController.js'
import {
  listTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  addTaskAttachmentAdmin,
  deleteTaskAttachmentAdmin,
  addTaskCommentAdmin,
} from '../controllers/taskController.js'
import {
  getServicesSection,
  updateServicesSettings,
  uploadServiceIcon,
  createServiceItem,
  updateServiceItem,
  deleteServiceItem,
  reorderServiceItems,
  getFeaturesSection,
  updateFeaturesSettings,
  createFeatureItem,
  updateFeatureItem,
  deleteFeatureItem,
  reorderFeatureItems,
  getCtaSection,
  updateCtaSection,
} from '../controllers/landingController.js'
import {
  getAdminAudioList,
  createAudio,
  getAudio,
  updateAudio,
  deleteAudio,
} from '../controllers/musicController.js'
import {
  getAdminFrameList,
  createFrame,
  getFrame,
  updateFrame,
  deleteFrame,
} from '../controllers/frameController.js'
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  getRolePermissions,
} from '../controllers/roleController.js'
import { getAllMedia, uploadAsset as uploadAssetController } from '../controllers/assetGalleryController.js'
import {
  getAllQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  reorderQuizzes,
} from '../controllers/presentationQuizController.js'
import {
  getAllPolls,
  getPoll,
  createPoll,
  updatePoll,
  deletePoll,
  reorderPolls,
} from '../controllers/pollController.js'
import {
  getAllVideos,
  getVideo,
  createVideo,
  updateVideo,
  deleteVideo,
  reorderVideos,
} from '../controllers/externalVideoController.js'
import {
  getAllAudio as getAllPresentationAudio,
  getAudio as getPresentationAudio,
  createAudio as createPresentationAudio,
  updateAudio as updatePresentationAudio,
  deleteAudio as deletePresentationAudio,
  reorderAudio as reorderPresentationAudio,
} from '../controllers/presentationAudioController.js'
import {
  getAllTimelines,
  getTimeline,
  createTimeline,
  updateTimeline,
  deleteTimeline,
  addFrame as addTimelineFrame,
  updateFrame as updateTimelineFrame,
  deleteFrame as deleteTimelineFrame,
  addFrameItem,
  updateFrameItem,
  deleteFrameItem,
} from '../controllers/timelineController.js'
import {
  getAllSeminars,
  getSeminar,
  createSeminar,
  updateSeminar,
  uploadSeminarCover,
  getSeminarRegistrations,
  getSeminarStats,
} from '../controllers/seminarController.js'
import { authMiddleware, loadPermissionsMiddleware } from '../middleware/auth.js'
import { requireAdmin, requireAdminOrManager, requirePermission } from '../middleware/roleCheck.js'
import { uploadSlider, uploadLogo, uploadTaskAttachment, uploadLandingServiceIcon, uploadMusic, uploadFrame, uploadAsset, uploadPresentationAudio, uploadSeminarCover as uploadSeminarCoverMw } from '../middleware/upload.js'

const router = express.Router()

router.use(authMiddleware)
router.use(loadPermissionsMiddleware)

router.get('/dashboard', requireAdminOrManager, getDashboard)
router.get('/users', requireAdminOrManager, getUsers)
router.post('/users', requireAdmin, createUserValidation, createUser)
router.put('/users/:id', requireAdminOrManager, updateUser)
router.delete('/users/:id', requireAdmin, deleteUser)
router.put('/users/:id/role', requireAdmin, updateUserRole)
router.get('/analytics', requireAdminOrManager, getAnalytics)

router.get('/sliders', requireAdminOrManager, getAdminSliders)
router.post('/sliders', requireAdminOrManager, (req, res, next) => {
  uploadSlider(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'File upload failed' })
    }
    next()
  })
}, createSlider)
// IMPORTANT: reorder route must come BEFORE :id routes
router.put('/sliders/reorder', requireAdminOrManager, reorderSliders)
router.put('/sliders/:id', requireAdminOrManager, (req, res, next) => {
  uploadSlider(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'File upload failed' })
    }
    next()
  })
}, updateSlider)
router.delete('/sliders/:id', requireAdminOrManager, deleteSlider)

// Theme management routes
router.get('/theme/header', requireAdminOrManager, getHeaderSettings)
router.put('/theme/header', requireAdminOrManager, updateHeaderSettings)
router.post('/theme/header/logo', requireAdminOrManager, (req, res, next) => {
  uploadLogo(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Logo upload failed' })
    }
    next()
  })
}, uploadLogoController)

router.put('/theme/footer-visibility', requireAdminOrManager, updateFooterVisibility)
router.get('/theme/footer', requireAdminOrManager, getAdminFooterNavItems)
router.post('/theme/footer', requireAdminOrManager, createFooterNavItem)
router.put('/theme/footer/reorder', requireAdminOrManager, reorderFooterNavItems)
router.put('/theme/footer/:id', requireAdminOrManager, updateFooterNavItem)
router.delete('/theme/footer/:id', requireAdminOrManager, deleteFooterNavItem)
router.get('/theme/admin-bg-video', requireAdminOrManager, getAdminBgVideo)
router.put('/theme/admin-bg-video', requireAdminOrManager, updateAdminBgVideo)
router.get('/virtual-seminar-timeline', requirePermission('presentation-management'), getAdminVirtualSeminarTimeline)
router.put('/virtual-seminar-timeline', requirePermission('presentation-management'), updateVirtualSeminarTimeline)
router.get('/seminars', requirePermission('presentation-management'), getAllSeminars)
router.post('/seminars', requirePermission('presentation-management'), createSeminar)
router.get('/seminars/:id/registrations', requirePermission('presentation-management'), getSeminarRegistrations)
router.get('/seminars/:id/stats', requirePermission('presentation-management'), getSeminarStats)
router.put('/seminars/:id/cover', requirePermission('presentation-management'), (req, res, next) => {
  uploadSeminarCoverMw(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'কভার আপলোড ব্যর্থ' })
    next()
  })
}, uploadSeminarCover)
router.get('/seminars/:id', requirePermission('presentation-management'), getSeminar)
router.put('/seminars/:id', requirePermission('presentation-management'), updateSeminar)

// Task management (admin)
router.get('/tasks', requireAdminOrManager, listTasks)
router.post('/tasks', requireAdminOrManager, createTask)
router.get('/tasks/:id', requireAdminOrManager, getTask)
router.put('/tasks/:id', requireAdminOrManager, updateTask)
router.delete('/tasks/:id', requireAdminOrManager, deleteTask)
router.post('/tasks/:id/attachments', requireAdminOrManager, (req, res, next) => {
  uploadTaskAttachment(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'File upload failed' })
    next()
  })
}, addTaskAttachmentAdmin)
router.delete('/tasks/:id/attachments/:attachmentId', requireAdminOrManager, deleteTaskAttachmentAdmin)
router.post('/tasks/:id/comments', requireAdminOrManager, addTaskCommentAdmin)

// Landing page design (Theme Design > ল্যান্ডিং পেজ ডিজাইন)
router.get('/landing/services', requireAdminOrManager, getServicesSection)
router.put('/landing/services', requireAdminOrManager, updateServicesSettings)
router.post('/landing/services/upload', requireAdminOrManager, (req, res, next) => {
  uploadLandingServiceIcon(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Image upload failed' })
    next()
  })
}, uploadServiceIcon)
router.post('/landing/services/items', requireAdminOrManager, createServiceItem)
router.put('/landing/services/items/:id', requireAdminOrManager, updateServiceItem)
router.delete('/landing/services/items/:id', requireAdminOrManager, deleteServiceItem)
router.put('/landing/services/reorder', requireAdminOrManager, reorderServiceItems)

router.get('/landing/features', requireAdminOrManager, getFeaturesSection)
router.put('/landing/features', requireAdminOrManager, updateFeaturesSettings)
router.post('/landing/features/items', requireAdminOrManager, createFeatureItem)
router.put('/landing/features/items/:id', requireAdminOrManager, updateFeatureItem)
router.delete('/landing/features/items/:id', requireAdminOrManager, deleteFeatureItem)
router.put('/landing/features/reorder', requireAdminOrManager, reorderFeatureItems)

router.get('/landing/cta', requireAdminOrManager, getCtaSection)
router.put('/landing/cta', requireAdminOrManager, updateCtaSection)

// Project management
router.get('/projects', requireAdminOrManager, getProjects)
router.post('/projects', requireAdminOrManager, createProject)
router.put('/projects/:id', requireAdminOrManager, updateProject)
router.delete('/projects/:id', requireAdminOrManager, deleteProject)

// Audio / music management (video editor)
router.get('/audio', requireAdminOrManager, getAdminAudioList)
router.post('/audio', requireAdminOrManager, (req, res, next) => {
  uploadMusic(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Audio upload failed' })
    next()
  })
}, createAudio)
router.get('/audio/:id', requireAdminOrManager, getAudio)
router.put('/audio/:id', requireAdminOrManager, (req, res, next) => {
  uploadMusic(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Audio upload failed' })
    next()
  })
}, updateAudio)
router.delete('/audio/:id', requireAdminOrManager, deleteAudio)

// Frame management (video editor)
router.get('/frames', requireAdminOrManager, getAdminFrameList)
router.post('/frames', requireAdminOrManager, (req, res, next) => {
  uploadFrame(req, res, (err) => {
    if (err) {
      const msg = err && typeof err.message === 'string' ? err.message : 'Frame upload failed'
      return res.status(400).json({ error: msg })
    }
    next()
  })
}, createFrame)
router.get('/frames/:id', requireAdminOrManager, getFrame)
router.put('/frames/:id', requireAdminOrManager, (req, res, next) => {
  uploadFrame(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Frame upload failed' })
    next()
  })
}, updateFrame)
router.delete('/frames/:id', requireAdminOrManager, deleteFrame)

// Asset gallery (presentation management)
router.get('/assets/gallery', requirePermission('presentation-management'), getAllMedia)
router.post('/assets/upload', requirePermission('presentation-management'), (req, res, next) => {
  uploadAsset(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'আপলোড ব্যর্থ' })
    next()
  })
}, uploadAssetController)

// Presentation quizzes (presentation management)
router.get('/presentation-quizzes', requirePermission('presentation-management'), getAllQuizzes)
router.put('/presentation-quizzes/reorder', requirePermission('presentation-management'), reorderQuizzes)
router.post('/presentation-quizzes', requirePermission('presentation-management'), createQuiz)
router.get('/presentation-quizzes/:id', requirePermission('presentation-management'), getQuiz)
router.put('/presentation-quizzes/:id', requirePermission('presentation-management'), updateQuiz)
router.delete('/presentation-quizzes/:id', requirePermission('presentation-management'), deleteQuiz)

// Polls (presentation management)
router.get('/polls', requirePermission('presentation-management'), getAllPolls)
router.put('/polls/reorder', requirePermission('presentation-management'), reorderPolls)
router.post('/polls', requirePermission('presentation-management'), createPoll)
router.get('/polls/:id', requirePermission('presentation-management'), getPoll)
router.put('/polls/:id', requirePermission('presentation-management'), updatePoll)
router.delete('/polls/:id', requirePermission('presentation-management'), deletePoll)

// External videos (presentation management)
router.get('/external-videos', requirePermission('presentation-management'), getAllVideos)
router.put('/external-videos/reorder', requirePermission('presentation-management'), reorderVideos)
router.post('/external-videos', requirePermission('presentation-management'), createVideo)
router.get('/external-videos/:id', requirePermission('presentation-management'), getVideo)
router.put('/external-videos/:id', requirePermission('presentation-management'), updateVideo)
router.delete('/external-videos/:id', requirePermission('presentation-management'), deleteVideo)

// Presentation audio (presentation management)
router.get('/presentation-audio', requirePermission('presentation-management'), getAllPresentationAudio)
router.put('/presentation-audio/reorder', requirePermission('presentation-management'), reorderPresentationAudio)
router.post('/presentation-audio', requirePermission('presentation-management'), (req, res, next) => {
  uploadPresentationAudio(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'অডিও আপলোড ব্যর্থ' })
    next()
  })
}, createPresentationAudio)
router.get('/presentation-audio/:id', requirePermission('presentation-management'), getPresentationAudio)
router.put('/presentation-audio/:id', requirePermission('presentation-management'), updatePresentationAudio)
router.delete('/presentation-audio/:id', requirePermission('presentation-management'), deletePresentationAudio)

// Timelines (presentation management)
router.get('/timelines', requirePermission('presentation-management'), getAllTimelines)
router.post('/timelines', requirePermission('presentation-management'), createTimeline)
router.get('/timelines/:id', requirePermission('presentation-management'), getTimeline)
router.put('/timelines/:id', requirePermission('presentation-management'), updateTimeline)
router.delete('/timelines/:id', requirePermission('presentation-management'), deleteTimeline)
router.post('/timelines/:id/frames', requirePermission('presentation-management'), addTimelineFrame)
router.put('/timelines/:id/frames/:frameId', requirePermission('presentation-management'), updateTimelineFrame)
router.delete('/timelines/:id/frames/:frameId', requirePermission('presentation-management'), deleteTimelineFrame)
router.post('/timelines/:id/frames/:frameId/items', requirePermission('presentation-management'), addFrameItem)
router.put('/timelines/:id/frames/:frameId/items/:itemId', requirePermission('presentation-management'), updateFrameItem)
router.delete('/timelines/:id/frames/:frameId/items/:itemId', requirePermission('presentation-management'), deleteFrameItem)

// Role & Permission management (admin only)
router.get('/permissions', requireAdmin, getPermissions)
router.get('/roles', requireAdmin, getRoles)
router.post('/roles', requireAdmin, createRole)
router.put('/roles/:id', requireAdmin, updateRole)
router.delete('/roles/:id', requireAdmin, deleteRole)
router.get('/roles/:id/permissions', requireAdmin, getRolePermissions)

export default router
