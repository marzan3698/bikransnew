import jwt from 'jsonwebtoken'
import { getPermissionsForRole } from '../helpers/permissions.js'

const JWT_SECRET = process.env.JWT_SECRET || 'bikrans-secret-key-change-in-production'

export function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return next()
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    req.userRole = decoded.role
  } catch (_) {}
  next()
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    req.userRole = decoded.role
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function loadPermissionsMiddleware(req, res, next) {
  getPermissionsForRole(req.userRole || '')
    .then((perms) => {
      req.userPermissions = perms
      next()
    })
    .catch(() => {
      req.userPermissions = []
      next()
    })
}

export function generateToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}
