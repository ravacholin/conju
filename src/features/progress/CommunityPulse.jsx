import React, { useState, useEffect, useCallback } from 'react'
import { fetchLeaderboard, fetchCommunityStats } from '../../lib/progress/socialSync.js'
import { getCurrentUserId } from '../../lib/progress/userManager/index.js'
import { createLogger } from '../../lib/utils/logger.js'
import './community-pulse.css'

const logger = createLogger('features:CommunityPulse')

export default function CommunityPulse({ snapshot }) {
  const [realLeaderboard, setRealLeaderboard] = useState(null)
  const [communityStats, setCommunityStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(Date.now())

  // Fetch real data from backend
  const fetchRealData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [leaderboardData, statsData] = await Promise.all([
        fetchLeaderboard('daily', { limit: 10, includeCurrentUser: true }),
        fetchCommunityStats()
      ])

      setRealLeaderboard(leaderboardData)
      setCommunityStats(statsData)
      setLastRefresh(Date.now())
      logger.debug('Fetched real community data', {
        leaderboardSize: leaderboardData?.leaderboard?.length,
        currentUserRank: leaderboardData?.currentUserRank
      })
    } catch (error) {
      logger.error('Error fetching community data:', error)
      // Keep showing synthetic data on error
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchRealData()
  }, [fetchRealData])

  // Use real data if available, fallback to snapshot (synthetic data)
  const displayData = realLeaderboard || snapshot
  const displayStats = communityStats || {}

  if (!displayData) {
    return null
  }

  const { communityGoal, leaderboard: snapshotLeaderboard, communitySize, userMetrics } = displayData

  // Use real leaderboard if available, otherwise fallback to snapshot
  const leaderboard = realLeaderboard?.leaderboard || snapshotLeaderboard || []
  const currentUserRank = realLeaderboard?.currentUserRank
  const currentUserData = realLeaderboard?.currentUserData
  const totalPlayers = realLeaderboard?.totalPlayers || communitySize || 0
  const isOffline = realLeaderboard?.offline || displayData?.offline || false

  const progressAttempts = Math.min(1, (communityGoal?.progress?.attempts || 0) / (communityGoal?.target?.attempts || 1))
  const progressXp = Math.min(1, (communityGoal?.progress?.xp || 0) / (communityGoal?.target?.xp || 1))

  const userId = getCurrentUserId()

  return (
    <section className="dashboard-section community-pulse">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>
          <img src="/icons/trophy.png" alt="Comunidad" className="section-icon" />
          Pulso de la comunidad
          {isOffline && <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>(Offline)</span>}
        </h2>
        <button
          onClick={fetchRealData}
          disabled={isLoading}
          style={{
            background: isLoading ? 'var(--hover)' : 'var(--accent-blue)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 0,
            padding: '6px 12px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '13px'
          }}
        >
          {isLoading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Current user rank highlight */}
      {currentUserRank && !isOffline && (
        <div style={{
          background: 'var(--panel)',
          border: '1px solid var(--accent-blue)',
          color: 'var(--text)',
          padding: '12px 16px',
          borderRadius: 0,
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Tu posición global</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', margin: '4px 0' }}>
            #{currentUserRank}
          </div>
          {currentUserData && (
            <div style={{ fontSize: '13px', opacity: 0.85 }}>
              {currentUserData.xp} XP • Racha de {currentUserData.streak} días
            </div>
          )}
        </div>
      )}

      <div className="community-summary">
        <div>
          <span className="community-label">Participantes activos</span>
          <strong>{(displayStats.activeUsers || totalPlayers || 0).toLocaleString()}</strong>
        </div>
        <div>
          <span className="community-label">Tu contribución hoy</span>
          <strong>{userMetrics?.lastContribution || currentUserData?.attempts || 0} pts</strong>
        </div>
        {displayStats.avgAccuracy && (
          <div>
            <span className="community-label">Precisión promedio</span>
            <strong>{Math.round(displayStats.avgAccuracy)}%</strong>
          </div>
        )}
      </div>

      {communityGoal && (
        <div className="community-goal">
          <h3>Meta comunitaria</h3>
          <div className="community-progress">
            <span>Intentos</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.round(progressAttempts * 100)}%` }}></div>
            </div>
            <span>{communityGoal?.progress?.attempts || 0} / {communityGoal?.target?.attempts || 0}</span>
          </div>
          <div className="community-progress">
            <span>XP</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.round(progressXp * 100)}%` }}></div>
            </div>
            <span>{communityGoal?.progress?.xp || 0} / {communityGoal?.target?.xp || 0}</span>
          </div>
        </div>
      )}

      <div className="community-leaderboard">
        <h3>Leaderboard del día</h3>
        {isLoading && leaderboard.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            Cargando leaderboard...
          </div>
        ) : (
          <ol>
            {Array.isArray(leaderboard) && leaderboard.map((entry, index) => {
              const isCurrentUser = entry.userId === userId || entry.alias === (displayData.userAlias || 'Tú')
              const rank = entry.rank || (index + 1)

              return (
                <li key={entry.userId || entry.alias || index} className={isCurrentUser ? 'current-user' : ''}>
                  <span className="community-rank">
                    #{rank}
                  </span>
                  <div className="community-player">
                    <strong>
                      {entry.alias || 'Anonymous'}
                      {isCurrentUser && ' (Tú)'}
                    </strong>
                    <span>{entry.xp || 0} XP · racha {entry.streak || 0}</span>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
        {leaderboard.length === 0 && !isLoading && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            No hay datos de leaderboard disponibles
          </div>
        )}
      </div>

      {!isOffline && (
        <div style={{ fontSize: '11px', color: '#999', marginTop: '12px', textAlign: 'center' }}>
          Última actualización: {new Date(lastRefresh).toLocaleTimeString()}
        </div>
      )}
    </section>
  )
}
