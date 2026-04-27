import React from 'react'
import ClickableCard from '../shared/ClickableCard.jsx'

function LearningMenuLayout({
  step,
  kicker,
  title,
  description,
  onHome,
  children,
  footer
}) {
  return (
    <div className="App">
      <div className="onboarding learn-flow learning-menu-layout">
        <section className="learning-menu-shell">
          <header className="learning-menu-header">
            <div className="learning-menu-copy">
              <div className="learning-menu-meta">
                {step ? <span className="learning-menu-step">{step}</span> : null}
                {kicker ? <span className="learning-menu-kicker">{kicker}</span> : null}
              </div>
              <h1>{title}</h1>
              {description ? <p className="learning-menu-description">{description}</p> : null}
            </div>

            <div className="learning-menu-brand">
              <ClickableCard className="app-logo" onClick={onHome} title="Volver al menú">
                <img src="/verbosmain_transparent.png" alt="VerbOS" width="132" height="132" />
              </ClickableCard>
            </div>
          </header>

          <div className="learning-menu-body">
            {children}
          </div>
        </section>

        {footer}
      </div>
    </div>
  )
}

export default LearningMenuLayout
