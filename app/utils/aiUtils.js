import { getCardValue, getCardRank } from './cardUtils'

const DIFFICULTY = {
  MEDIUM: 'medium',
  HARD: 'hard'
}

export function getDifficultyLevel(difficulty) {
  switch (difficulty) {
    case DIFFICULTY.HARD:
      return 0.9
    case DIFFICULTY.MEDIUM:
    default:
      return 0.6
  }
}

export function selectCribCards(hand, isPlayersCrib, difficulty) {
  if (!hand || hand.length === 0) return []
  
  const handCopy = hand.map((card, idx) => ({ ...card, index: idx }))
  
  const scoredCards = handCopy.map(card => {
    let score = 0
    const value = getCardValue(card)
    
    if (value === 5) score += 4
    if (value === 10) score += 2
    if (card.rank === 'A') score += 1
    
    for (const other of handCopy) {
      if (other.index !== card.index && other.rank === card.rank) {
        score += 3
      }
    }
    
    const rank = getCardRank(card)
    const hasLower = handCopy.some(c => getCardRank(c) === rank - 1 && c.index !== card.index)
    const hasHigher = handCopy.some(c => getCardRank(c) === rank + 1 && c.index !== card.index)
    if (hasLower && hasHigher) {
      score += 4
    }
    
    return { ...card, score }
  })
  
  scoredCards.sort((a, b) => b.score - a.score)
  
  const difficultyLevel = getDifficultyLevel(difficulty)
  const randomFactor = Math.random()
  
  if (randomFactor > difficultyLevel) {
    const indices = []
    const remaining = [...scoredCards]
    for (let i = 0; i < 2 && i < remaining.length; i++) {
      const randomIndex = Math.floor(Math.random() * remaining.length)
      indices.push(remaining[randomIndex].index)
      remaining.splice(randomIndex, 1)
    }
    return indices
  }
  
  const discardIndices = scoredCards
    .slice(0, Math.min(2, scoredCards.length))
    .map(card => card.index)
  
  return discardIndices
}

export function selectPlayCard(hand, peggingTotal, peggingCards, difficulty) {
  if (!hand || hand.length === 0) return -1
  
  const handCopy = hand.map((card, idx) => ({ ...card, index: idx }))
  const validCards = handCopy.filter(card => 
    peggingTotal + getCardValue(card) <= 31
  )
  
  if (validCards.length === 0) {
    return -1
  }
  
  const difficultyLevel = getDifficultyLevel(difficulty)
  const randomFactor = Math.random()
  
  if (randomFactor > difficultyLevel) {
    const randomIndex = Math.floor(Math.random() * validCards.length)
    return validCards[randomIndex].index
  }
  
  const scoredCards = validCards.map(card => {
    let score = 0
    const value = getCardValue(card)
    const newTotal = peggingTotal + value
    
    if (newTotal === 15) {
      score += 10
    }
    if (newTotal === 31) {
      score += 15
    }
    
    let pairCount = 0
    for (let i = peggingCards.length - 1; i >= 0; i--) {
      if (peggingCards[i].rank === card.rank) {
        pairCount++
      } else {
        break
      }
    }
    if (pairCount > 0) {
      score += pairCount * 3
    }
    
    if (peggingCards.length >= 2) {
      const recentRanks = peggingCards.slice(-3).map(c => getCardRank(c))
      const currentRank = getCardRank(card)
      
      const allRanks = [...recentRanks, currentRank].sort((a, b) => a - b)
      let runLength = 1
      for (let i = 1; i < allRanks.length; i++) {
        if (allRanks[i] === allRanks[i-1] + 1) {
          runLength++
        } else if (allRanks[i] !== allRanks[i-1]) {
          break
        }
      }
      if (runLength >= 3) {
        score += runLength * 2
      }
    }
    
    return { ...card, score }
  })
  
  scoredCards.sort((a, b) => b.score - a.score)
  return scoredCards[0].index
}