'use client'

import styles from './Board.module.css'

export default function Board({ playerScore, cpuScore, isPlayerDealer }) {
  const totalPositions = 121
  const trackPositions = []
  
  for (let i = 0; i < totalPositions; i++) {
    trackPositions.push(i)
  }

  const getPlayerClass = (position) => {
    if (position < playerScore) return styles.filled
    if (position === playerScore && position > 0) return styles.current
    return styles.empty
  }

  const getCpuClass = (position) => {
    if (position < cpuScore) return styles.filled
    if (position === cpuScore && position > 0) return styles.current
    return styles.empty
  }

  return (
    <div className={styles.board}>
      <div className={styles.dealerIndicator}>
        <span className={styles.dealerText}>
          {isPlayerDealer ? '🃏 You are dealer' : '🃏 CPU is dealer'}
        </span>
      </div>
      <div className={styles.track}>
        <div className={styles.trackLabel}>You</div>
        <div className={styles.trackHoles}>
          {trackPositions.map((pos) => (
            <div 
              key={'player-' + pos}
              className={`${styles.hole} ${getPlayerClass(pos)}`}
            />
          ))}
        </div>
      </div>
      <div className={styles.track}>
        <div className={styles.trackLabel}>CPU</div>
        <div className={styles.trackHoles}>
          {trackPositions.map((pos) => (
            <div 
              key={'cpu-' + pos}
              className={`${styles.hole} ${getCpuClass(pos)}`}
            />
          ))}
        </div>
      </div>
      <div className={styles.scoreDisplay}>
        <div className={styles.scoreItem}>
          <span className={styles.scoreLabel}>You</span>
          <span className={styles.scoreValue}>{playerScore}</span>
        </div>
        <div className={styles.scoreItem}>
          <span className={styles.scoreLabel}>CPU</span>
          <span className={styles.scoreValue}>{cpuScore}</span>
        </div>
      </div>
    </div>
  )
}