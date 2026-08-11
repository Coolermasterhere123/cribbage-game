'use client'

import styles from './ScoreDisplay.module.css'

export default function ScoreDisplay({ playerScore, cpuScore, message }) {
  return (
    <div className={styles.container}>
      <div className={styles.scores}>
        <div className={styles.score}>
          <span className={styles.label}>You</span>
          <span className={styles.value}>{playerScore || 0}</span>
        </div>
        <div className={styles.score}>
          <span className={styles.label}>CPU</span>
          <span className={styles.value}>{cpuScore || 0}</span>
        </div>
      </div>
      {message && (
        <div className={styles.message}>{message}</div>
      )}
    </div>
  )
}