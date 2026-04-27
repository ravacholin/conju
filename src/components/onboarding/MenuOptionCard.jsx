import React from 'react'
import ClickableCard from '../shared/ClickableCard.jsx'

function MenuOptionCard({
  title,
  subtitle,
  description,
  detail,
  eyebrow,
  badge,
  className = '',
  onClick,
  cardTitle,
  children
}) {
  return (
    <ClickableCard
      className={`option-card menu-option-card ${className}`.trim()}
      onClick={onClick}
      title={cardTitle || title}
    >
      <div className="menu-option-top">
        {eyebrow ? <span className="menu-option-eyebrow">{eyebrow}</span> : <span />}
        {badge ? <span className="menu-option-badge">{badge}</span> : null}
      </div>

      <div className="menu-option-body">
        <div className="option-title">{title}</div>
        {subtitle ? <p className="menu-option-subtitle">{subtitle}</p> : null}
        {description ? <p className="menu-option-description">{description}</p> : null}
        {children}
      </div>

      {detail ? <p className="example menu-option-detail">{detail}</p> : null}
    </ClickableCard>
  )
}

export default MenuOptionCard
