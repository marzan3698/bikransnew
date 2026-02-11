import { query } from '../config/database.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import ffmpeg from 'fluent-ffmpeg'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TEMP_DIR = path.join(process.cwd(), 'public', 'uploads', 'temp', 'video')
const REQUIRED_WIDTH = 1080
const REQUIRED_HEIGHT = 1920

function resolvePath(relativePath) {
  const normalized = relativePath?.startsWith('/') ? relativePath.slice(1) : relativePath || ''
  return path.join(process.cwd(), 'public', normalized)
}

export async function processVideo(req, res) {
  let videoPath = null
  let outputPath = null
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: 'ভিডিও ফাইল পাঠানো হয়নি' })
    }
    const audioId = parseInt(req.body?.audioId, 10)
    const frameId = parseInt(req.body?.frameId, 10)
    if (!audioId || !frameId) {
      return res.status(400).json({ error: 'অডিও ও ফ্রেম সিলেক্ট করুন' })
    }

    const [audioRow] = await query(
      'SELECT id, file_path FROM audio_tracks WHERE id = ? AND status = ?',
      [audioId, 'active']
    )
    const [frameRow] = await query(
      'SELECT id, file_path FROM frames WHERE id = ? AND status = ?',
      [frameId, 'active']
    )
    if (!audioRow || !frameRow) {
      return res.status(400).json({ error: 'অডিও বা ফ্রেম পাওয়া যায়নি' })
    }

    const audioPath = resolvePath(audioRow.file_path)
    const framePath = resolvePath(frameRow.file_path)
    if (!fs.existsSync(audioPath) || !fs.existsSync(framePath)) {
      return res.status(400).json({ error: 'অডিও বা ফ্রেম ফাইল পাওয়া যায়নি' })
    }

    videoPath = req.file.path
    outputPath = path.join(TEMP_DIR, `output_${Date.now()}.mp4`)

    const isGif = /\.gif$/i.test(framePath)
    const frameInput = ffmpeg().input(framePath)
    if (isGif) {
      frameInput.inputOptions(['-ignore_loop', '0'])
    }
    // Input order: 0=frame, 1=video, 2=audio. format=rgba for GIF palette, eof_action=repeat for overlay
    await new Promise((resolve, reject) => {
      frameInput
        .input(videoPath)
        .input(audioPath)
        .complexFilter(
          [
            '[1:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2[vscaled]',
            '[0:v]format=rgba,scale=1080:1920[frame]',
            '[vscaled][frame]overlay=0:0:eof_action=repeat[vout]',
          ].join(';')
        )
        .outputOptions([
          '-map', '[vout]',
          '-map', '2:a',
          '-shortest',
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-c:a', 'aac',
        ])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run()
    })

    if (!fs.existsSync(outputPath)) {
      throw new Error('আউটপুট ফাইল তৈরি হয়নি')
    }

    res.setHeader('Content-Type', 'video/mp4')
    res.setHeader('Content-Disposition', 'attachment; filename="bikrans-video.mp4"')
    res.sendFile(outputPath, (err) => {
      try {
        if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
        if (videoPath && fs.existsSync(videoPath)) fs.unlinkSync(videoPath)
      } catch (_) {}
      if (err && !res.headersSent) {
        console.error('Video send error:', err)
      }
    })
  } catch (err) {
    console.error('Video process error:', err)
    if (videoPath && fs.existsSync(videoPath)) {
      try { fs.unlinkSync(videoPath) } catch (_) {}
    }
    if (outputPath && fs.existsSync(outputPath)) {
      try { fs.unlinkSync(outputPath) } catch (_) {}
    }
    const msg = err.message || 'ভিডিও প্রসেস ব্যর্থ'
    if (!res.headersSent) {
      res.status(500).json({ error: msg })
    }
  }
}
