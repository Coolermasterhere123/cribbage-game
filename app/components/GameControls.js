'use client'

import styles from './GameControls.module.css'

export default function GameControls({ phase, onNewGame }) {
  return (
    <div className={styles.container}>
      <button 
        className={styles.button}
        onClick={onNewGame}
      >
        New Game
      </button>
      <div className={styles.status}>
        Phase: {phase}
      </div>
    </div>
  )
}