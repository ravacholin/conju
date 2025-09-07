import React from 'react';
import './AchievementModal.css';

function AchievementModal({ achievements, isVisible, onClose }) {
  if (!isVisible || !achievements || achievements.length === 0) {
    return null;
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="achievement-modal-overlay" onClick={handleBackdropClick}>
      <div className="achievement-modal">
        <div className="achievement-modal-header">
          <h2>🎉 ¡Logro Desbloqueado!</h2>
          <button 
            className="achievement-close-btn"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        
        <div className="achievement-modal-content">
          {achievements.map((achievement, index) => (
            <div key={achievement.id} className="achievement-card">
              <div className="achievement-tier-indicator">
                <div 
                  className={`achievement-tier ${achievement.tier.name}`}
                  style={{ borderColor: achievement.tier.color }}
                >
                  {achievement.tier.name.toUpperCase()}
                </div>
              </div>
              
              <div className="achievement-icon">
                {achievement.icon}
              </div>
              
              <div className="achievement-details">
                <h3 className="achievement-title">
                  {achievement.title}
                </h3>
                <p className="achievement-description">
                  {achievement.description}
                </p>
                <div className="achievement-points">
                  +{achievement.tier.points} puntos
                </div>
              </div>
              
              <div className="achievement-celebration">
                <div className="confetti">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="confetti-piece"></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="achievement-modal-footer">
          <button 
            className="achievement-continue-btn"
            onClick={onClose}
          >
            ¡Continuar practicando!
          </button>
        </div>
      </div>
    </div>
  );
}

export default AchievementModal;