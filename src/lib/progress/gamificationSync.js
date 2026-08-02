function toTimestamp(value) {
  if (!value) return 0
  if (value instanceof Date) return value.getTime()
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : 0
}

function buildGamificationPayload(userRecord, userId) {
  const base = userRecord && typeof userRecord === 'object'
    ? { ...userRecord }
    : { id: userId, userId }

  const progressUpdatedAt = toTimestamp(base.progressUpdatedAt || base.updatedAt || base.createdAt)
  const finalUpdatedAt = progressUpdatedAt || Date.now()

  return {
    ...base,
    id: base.id || userId,
    userId,
    progressUpdatedAt: progressUpdatedAt || null,
    createdAt: base.createdAt || new Date(finalUpdatedAt).toISOString(),
    updatedAt: new Date(finalUpdatedAt).toISOString()
  }
}

export {
  toTimestamp,
  buildGamificationPayload
}
