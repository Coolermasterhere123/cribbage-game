'use client'

import { useState, useEffect } from 'react'
import CribbageGame from './components/CribbageGame'
import styles from './page.module.css'

export default function Home() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null
  }

  return (
    <div className={styles.container}>
      <CribbageGame />
    </div>
  )
}