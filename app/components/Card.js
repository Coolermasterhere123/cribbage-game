'use client'

import styles from './Card.module.css'

export default function Card({ card, hidden = false, onClick, selectable = false, small = false }) {
  if (!card || typeof card !== 'object') {
    return <div className={`${styles.card} ${styles.empty} ${small ? styles.small : ''}`} />
  }

  if (hidden) {
    return <div className={`${styles.card} ${styles.hidden} ${small ? styles.small : ''}`} />
  }

  const isRed = card.suit === '♥' || card.suit === '♦'
  const rankDisplay = card.rank === '10' ? '10' : card.rank

  const handleClick = () => {
    if (selectable && onClick) {
      onClick()
    }
  }

  return (
    <div 
      className={`${styles.card} ${isRed ? styles.red : styles.black} ${selectable ? styles.selectable : ''} ${small ? styles.small : ''}`}
      onClick={handleClick}
    >
      <div className={styles.topLeft}>
        <span className={styles.rank}>{rankDisplay}</span>
        <span className={styles.suit}>{card.suit}</span>
      </div>
      <div className={styles.center}>
        <span className={styles.centerSuit}>{card.suit}</span>
      </div>
      <div className={styles.bottomRight}>
        <span className={styles.rank}>{rankDisplay}</span>
        <span className={styles.suit}>{card.suit}</span>
      </div>
    </div>
  )
}