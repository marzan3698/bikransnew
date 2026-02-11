import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'
import slidersRoutes from './routes/sliders.js'
import themeRoutes from './routes/theme.js'
import tasksRoutes from './routes/tasks.js'
import publicRoutes from './routes/public.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.ALLOWED_ORIGIN || 'https://bikrans.com']
  : ['http://localhost:5173']
app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json())
// Serve uploads from the project root public directory
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/sliders', slidersRoutes)
app.use('/api/theme', themeRoutes)
app.use('/api/tasks', tasksRoutes)
app.use('/api/public', publicRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Bikrans API is running' })
})

// Production: serve built frontend
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist')
  app.use(express.static(distPath))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next()
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
