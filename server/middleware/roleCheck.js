export function requireAdmin(req, res, next) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

export function requireAdminOrManager(req, res, next) {
  const adminRoles = ['admin', 'manager', 'presentation_manager']
  const hasDashboard = req.userPermissions && req.userPermissions.includes('dashboard')
  const allowed = adminRoles.includes(req.userRole) || hasDashboard
  if (!allowed) {
    return res.status(403).json({ error: 'Admin or Manager access required' })
  }
  next()
}

export function requirePermission(permissionSlug) {
  return (req, res, next) => {
    if (req.userRole === 'admin') return next()
    const hasPerm = req.userPermissions && req.userPermissions.includes(permissionSlug)
    if (!hasPerm) {
      return res.status(403).json({ error: `Permission required: ${permissionSlug}` })
    }
    next()
  }
}
