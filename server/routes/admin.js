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
import { authMiddleware } from '../middleware/auth.js'
import { requireAdmin, requireAdminOrManager } from '../middleware/roleCheck.js'
import { uploadSlider, uploadLogo, uploadTaskAttachment, uploadLandingServiceIcon, uploadMusic, uploadFrame } from '../middleware/upload.js'

const router = express.Router()

router.use(authMiddleware)

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

export default router
