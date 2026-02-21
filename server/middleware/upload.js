import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'sliders')
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 1 * 1024 * 1024 // 1MB

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, `temp_${Date.now()}${path.extname(file.originalname) || '.jpg'}`),
})

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPG, PNG, WebP allowed'), false)
  }
}

export const uploadSlider = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
}).single('image')

// Logo upload configuration
const LOGO_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'logos')
const LOGO_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml']
const LOGO_MAX_SIZE = 500 * 1024 // 500KB

if (!fs.existsSync(LOGO_UPLOAD_DIR)) {
  fs.mkdirSync(LOGO_UPLOAD_DIR, { recursive: true })
}

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, LOGO_UPLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, `temp_${Date.now()}${path.extname(file.originalname) || '.png'}`),
})

const logoFileFilter = (req, file, cb) => {
  if (LOGO_ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPG, PNG, SVG allowed'), false)
  }
}

export const uploadLogo = multer({
  storage: logoStorage,
  fileFilter: logoFileFilter,
  limits: { fileSize: LOGO_MAX_SIZE },
}).single('logo')

// Task attachment upload (video, audio, image, document)
const TASK_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'tasks')
const TASK_MAX_SIZE = 50 * 1024 * 1024 // 50MB
const TASK_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/webm',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

if (!fs.existsSync(TASK_UPLOAD_DIR)) {
  fs.mkdirSync(TASK_UPLOAD_DIR, { recursive: true })
}

const taskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TASK_UPLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}_${(file.originalname || 'file').replace(/[^a-zA-Z0-9.-]/g, '_')}`),
})

const taskFileFilter = (req, file, cb) => {
  if (TASK_ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('File type not allowed. Use video, audio, image, or document.'), false)
  }
}

export const uploadTaskAttachment = multer({
  storage: taskStorage,
  fileFilter: taskFileFilter,
  limits: { fileSize: TASK_MAX_SIZE },
}).single('file')

// Asset gallery upload (image, video, audio, document) - max 50MB
const ASSET_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'assets')
const ASSET_MAX_SIZE = 50 * 1024 * 1024 // 50MB
const ASSET_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

if (!fs.existsSync(ASSET_UPLOAD_DIR)) {
  fs.mkdirSync(ASSET_UPLOAD_DIR, { recursive: true })
}

const assetStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, ASSET_UPLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}_${(file.originalname || 'file').replace(/[^a-zA-Z0-9.-]/g, '_')}`),
})

const assetFileFilter = (req, file, cb) => {
  if (ASSET_ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('File type not allowed. Use image, video, audio, or document.'), false)
  }
}

export const uploadAsset = multer({
  storage: assetStorage,
  fileFilter: assetFileFilter,
  limits: { fileSize: ASSET_MAX_SIZE },
}).single('file')

// Landing service icon (small icons for service cards)
const LANDING_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'landing')
const LANDING_ICON_MAX_SIZE = 500 * 1024 // 500KB
const LANDING_ICON_TYPES = ['image/jpeg', 'image/png', 'image/webp']

if (!fs.existsSync(LANDING_UPLOAD_DIR)) {
  fs.mkdirSync(LANDING_UPLOAD_DIR, { recursive: true })
}

const landingIconStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, LANDING_UPLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, `temp_${Date.now()}${path.extname(file.originalname) || '.png'}`),
})

const landingIconFilter = (req, file, cb) => {
  if (LANDING_ICON_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPG, PNG, WebP allowed'), false)
  }
}

export const uploadLandingServiceIcon = multer({
  storage: landingIconStorage,
  fileFilter: landingIconFilter,
  limits: { fileSize: LANDING_ICON_MAX_SIZE },
}).single('icon')

// Frame image upload for video editor (PNG/GIF, 1080x1920 validated in controller)
const FRAME_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'frames')
const FRAME_MAX_SIZE = 5 * 1024 * 1024 // 5MB
const FRAME_ALLOWED_TYPES = ['image/png', 'image/gif', 'image/x-png']

if (!fs.existsSync(FRAME_UPLOAD_DIR)) {
  fs.mkdirSync(FRAME_UPLOAD_DIR, { recursive: true })
}

const frameStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, FRAME_UPLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, `temp_${Date.now()}${path.extname(file.originalname) || '.png'}`),
})

const frameFileFilter = (req, file, cb) => {
  if (FRAME_ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only PNG and GIF frames are allowed'), false)
  }
}

export const uploadFrame = multer({
  storage: frameStorage,
  fileFilter: frameFileFilter,
  limits: { fileSize: FRAME_MAX_SIZE },
}).single('frame')

// Music / audio upload for video editor
const AUDIO_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'audio')
const AUDIO_MAX_SIZE = 20 * 1024 * 1024 // 20MB
const AUDIO_ALLOWED_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'audio/x-wav',
]

if (!fs.existsSync(AUDIO_UPLOAD_DIR)) {
  fs.mkdirSync(AUDIO_UPLOAD_DIR, { recursive: true })
}

const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AUDIO_UPLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, `temp_${Date.now()}${path.extname(file.originalname) || '.mp3'}`),
})

const audioFileFilter = (req, file, cb) => {
  if (AUDIO_ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only MP3, WAV, WebM, OGG allowed'), false)
  }
}

export const uploadMusic = multer({
  storage: audioStorage,
  fileFilter: audioFileFilter,
  limits: { fileSize: AUDIO_MAX_SIZE },
}).single('audio')

// Presentation audio (same types/size as music, different folder)
const PRESENTATION_AUDIO_DIR = path.join(process.cwd(), 'public', 'uploads', 'presentation-audio')
if (!fs.existsSync(PRESENTATION_AUDIO_DIR)) {
  fs.mkdirSync(PRESENTATION_AUDIO_DIR, { recursive: true })
}
const presentationAudioStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PRESENTATION_AUDIO_DIR),
  filename: (req, file, cb) =>
    cb(null, `pa_${Date.now()}${path.extname(file.originalname) || '.mp3'}`),
})
export const uploadPresentationAudio = multer({
  storage: presentationAudioStorage,
  fileFilter: audioFileFilter,
  limits: { fileSize: AUDIO_MAX_SIZE },
}).single('audio')

// Video upload for instant video editor (temp processing, max 100MB)
const VIDEO_TEMP_DIR = path.join(process.cwd(), 'public', 'uploads', 'temp', 'video')
const VIDEO_MAX_SIZE = 100 * 1024 * 1024 // 100MB
const VIDEO_ALLOWED_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v',
]

if (!fs.existsSync(VIDEO_TEMP_DIR)) {
  fs.mkdirSync(VIDEO_TEMP_DIR, { recursive: true })
}

const videoTempStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, VIDEO_TEMP_DIR),
  filename: (req, file, cb) =>
    cb(null, `process_${Date.now()}${path.extname(file.originalname) || '.mp4'}`),
})

const videoFileFilter = (req, file, cb) => {
  if (VIDEO_ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only MP4, WebM, MOV allowed'), false)
  }
}

export const uploadVideo = multer({
  storage: videoTempStorage,
  fileFilter: videoFileFilter,
  limits: { fileSize: VIDEO_MAX_SIZE },
}).single('video')

// Seminar cover upload (image or video, max 20MB)
const SEMINAR_COVER_DIR = path.join(process.cwd(), 'public', 'uploads', 'seminars')
const SEMINAR_COVER_MAX_SIZE = 20 * 1024 * 1024 // 20MB
const SEMINAR_COVER_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]

if (!fs.existsSync(SEMINAR_COVER_DIR)) {
  fs.mkdirSync(SEMINAR_COVER_DIR, { recursive: true })
}

const seminarCoverStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, SEMINAR_COVER_DIR),
  filename: (req, file, cb) =>
    cb(null, `sem_${Date.now()}${path.extname(file.originalname) || '.jpg'}`),
})

const seminarCoverFilter = (req, file, cb) => {
  if (SEMINAR_COVER_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only image (JPG, PNG, WebP) or video (MP4, WebM) allowed'), false)
  }
}

export const uploadSeminarCover = multer({
  storage: seminarCoverStorage,
  fileFilter: seminarCoverFilter,
  limits: { fileSize: SEMINAR_COVER_MAX_SIZE },
}).single('cover')
