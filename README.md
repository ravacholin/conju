# Spanish Conjugation Trainer

A browser-based Spanish verb conjugation trainer aligned to MCER levels, with dialect controls (tú/vos/vosotros) and a rule-aware generator/grader.

## Features

- **MCER Level Alignment**: Content organized by CEFR levels (A1-C2)
- **Dialect Support**: Choose between Rioplatense, LatAm General, Peninsular, or Both
- **Smart Grading**: Accepts multiple valid forms based on dialect settings
- **Spaced Repetition**: SM-2 algorithm for optimal learning
- **PWA Support**: Works offline, installable on mobile devices
- **Modern UI**: Clean, responsive design with beautiful gradients
- **Mobile Optimized**: Compact interface designed for mobile devices with reduced spacing

## Tech Stack

- **Framework**: React (Vite)
- **Language**: JavaScript (ESM) with JSDoc types
- **State Management**: Zustand
- **Storage**: IndexedDB (`idb-keyval`) + localStorage
- **Testing**: Vitest + Testing Library
- **Build**: Vite + `vite-plugin-pwa`
- **Styling**: CSS with modern design system

## Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd spanish-conjugator

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Usage

1. **Onboarding**: Choose your Spanish dialect track and CEFR level
2. **Drill Mode**: Practice conjugations with smart feedback
3. **Tables Mode**: View complete conjugation tables filtered by dialect
4. **Progress Tracking**: Your learning progress is automatically saved

## Mobile Responsiveness

The app automatically detects mobile devices and provides a compact interface optimized for smaller screens:

- **Reduced Spacing**: Tighter margins and padding for mobile layouts
- **Touch-Friendly**: Minimum 44px touch targets for buttons
- **Compact Layout**: All elements fit on screen without scrolling
- **Responsive Typography**: Smaller font sizes on mobile devices
- **Flexible Grid**: Single-column layout on mobile for better readability

## Dialect Tracks

- **Rioplatense**: Uses vos (venís, hablás) - Argentina, Uruguay
- **LatAm General**: Uses tú (vienes, hablas) - Most Latin America
- **Peninsular**: Uses tú + vosotros (vienes, venís) - Spain
- **Both**: Accepts both tú and vos forms

## Project Structure

```
/src
  /app          # app shell
  /components   # UI components
  /features
    /drill      # conjugation practice
    /tables     # verb tables
    /settings   # onboarding & preferences
    /analytics  # progress tracking
    /verbs      # verb management
  /lib          # generator, grader, rules, srs, utils
  /data         # JSON datasets: curriculum, verbs
  /state        # zustand stores
  /styles       # CSS styling
```

## Data Model

The app uses a comprehensive data model for Spanish verb conjugations:

- **Curriculum Gates**: MCER level requirements for each mood/tense
- **Verb Paradigms**: Complete conjugation data with dialect variations
- **Form Rules**: Grammatical rules for irregular verbs
- **Acceptance Criteria**: Multiple valid forms per dialect

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Roadmap

- [ ] Add more verb data (target: 100+ high-frequency verbs)
- [ ] Implement analytics dashboard
- [ ] Add audio pronunciation
- [ ] Create mobile app versions
- [ ] Add social features (leaderboards, sharing)
- [ ] Implement adaptive difficulty
- [ ] Add grammar explanations
- [ ] Create teacher dashboard
