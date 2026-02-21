/** In-memory viewer tracking for Virtual Seminar (live whiteboard) */

const STALE_MS = 45 * 1000 // 45 seconds without heartbeat = offline

const viewers = new Map() // sessionId -> lastSeen timestamp

function prune() {
  const now = Date.now()
  for (const [sid, lastSeen] of viewers.entries()) {
    if (now - lastSeen > STALE_MS) viewers.delete(sid)
  }
}

export async function joinOrHeartbeat(req, res) {
  try {
    const { sessionId } = req.body || {}
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId required' })
    }
    viewers.set(sessionId, Date.now())
    prune()
    res.json({ ok: true })
  } catch (err) {
    console.error('Virtual seminar viewer join error:', err)
    res.status(500).json({ error: 'Failed to register viewer' })
  }
}

export async function leave(req, res) {
  try {
    const { sessionId } = req.body || {}
    if (sessionId) viewers.delete(sessionId)
    prune()
    res.json({ ok: true })
  } catch (err) {
    console.error('Virtual seminar viewer leave error:', err)
    res.status(500).json({ error: 'Failed to unregister viewer' })
  }
}

export async function getCount(req, res) {
  try {
    prune()
    const count = viewers.size
    res.json({ count })
  } catch (err) {
    console.error('Virtual seminar viewer count error:', err)
    res.status(500).json({ error: 'Failed to get viewer count', count: 0 })
  }
}

export function getViewerCountSync() {
  prune()
  return viewers.size
}
