// Card creation and deck management
export function createDeck() {
  const suits = ['♠', '♥', '♦', '♣']
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
  const deck = []
  
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ rank, suit })
    }
  }
  
  return deck
}

export function shuffleDeck(deck) {
  if (!deck) return []
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function dealCards(deck) {
  if (!deck || deck.length < 12) return { playerHand: [], cpuHand: [] }
  const playerHand = deck.slice(0, 6)
  const cpuHand = deck.slice(6, 12)
  return { playerHand, cpuHand }
}

export function getCardValue(card) {
  if (!card) return 0
  if (card.rank === 'A') return 1
  if (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') return 10
  return parseInt(card.rank)
}

export function getCardRank(card) {
  if (!card) return 0
  const rankOrder = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 }
  return rankOrder[card.rank] || 0
}

export function calculateHandScore(hand, starterCard) {
  if (!hand || hand.length === 0) return 0
  
  const allCards = [...hand]
  if (starterCard) {
    allCards.push(starterCard)
  }
  
  let score = 0
  
  const fifteens = findFifteens(allCards)
  score += fifteens * 2
  
  const pairs = findPairs(allCards)
  score += pairs * 2
  
  const runs = findRuns(allCards)
  score += runs * 2
  
  if (hand.length >= 4) {
    const suits = hand.map(c => c.suit)
    const allSameSuit = suits.every(s => s === suits[0])
    if (allSameSuit) {
      score += hand.length
      if (starterCard && hand[0].suit === starterCard.suit) {
        score += 1
      }
    }
  }
  
  if (starterCard) {
    for (const card of hand) {
      if (card.rank === 'J' && card.suit === starterCard.suit) {
        score += 1
        break
      }
    }
  }
  
  return score
}

export function calculateCribScore(crib, starterCard, isPlayersCrib) {
  if (!crib || crib.length === 0) return 0
  
  let score = 0
  const allCards = [...crib]
  if (starterCard) {
    allCards.push(starterCard)
  }
  
  const fifteens = findFifteens(allCards)
  score += fifteens * 2
  
  const pairs = findPairs(allCards)
  score += pairs * 2
  
  const runs = findRuns(allCards)
  score += runs * 2
  
  if (crib.length === 4) {
    const suits = crib.map(c => c.suit)
    const allSameSuit = suits.every(s => s === suits[0])
    if (allSameSuit && starterCard && starterCard.suit === suits[0]) {
      score += 5
    } else if (allSameSuit) {
      score += 4
    }
  }
  
  if (starterCard) {
    for (const card of crib) {
      if (card.rank === 'J' && card.suit === starterCard.suit) {
        score += 1
        break
      }
    }
  }
  
  return score
}

function findFifteens(cards) {
  let count = 0
  const n = cards.length
  
  for (let i = 0; i < (1 << n); i++) {
    let sum = 0
    let selected = []
    for (let j = 0; j < n; j++) {
      if (i & (1 << j)) {
        sum += getCardValue(cards[j])
        selected.push(cards[j])
      }
    }
    if (sum === 15 && selected.length >= 2) {
      count++
    }
  }
  
  return count
}

function findPairs(cards) {
  let count = 0
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      if (cards[i].rank === cards[j].rank) {
        count++
      }
    }
  }
  return count
}

function findRuns(cards) {
  if (cards.length < 3) return 0
  
  const rankCounts = {}
  for (const card of cards) {
    const rank = card.rank
    rankCounts[rank] = (rankCounts[rank] || 0) + 1
  }
  
  const ranks = Object.keys(rankCounts)
  const sortedRanks = ranks.sort((a, b) => getCardRank({rank: a}) - getCardRank({rank: b}))
  
  let longestRun = 0
  let currentRun = 1
  
  for (let i = 1; i < sortedRanks.length; i++) {
    if (getCardRank({rank: sortedRanks[i]}) === getCardRank({rank: sortedRanks[i-1]}) + 1) {
      currentRun++
      if (currentRun > longestRun) {
        longestRun = currentRun
      }
    } else {
      currentRun = 1
    }
  }
  
  if (longestRun < 3) return 0
  
  let multiplier = 1
  for (let i = 0; i < longestRun; i++) {
    const rank = sortedRanks[i]
    multiplier *= rankCounts[rank]
  }
  
  return longestRun * multiplier
}

export function calculatePeggingScore(peggingCards, player) {
  if (!peggingCards || peggingCards.length < 2) return 0
  
  let score = 0
  
  // Check for 15
  const total = peggingCards.reduce((sum, card) => sum + getCardValue(card), 0)
  if (total === 15) {
    score += 2
  }
  
  // Check for 31
  if (total === 31) {
    score += 2
  }
  
  // Check for pairs
  const lastCard = peggingCards[peggingCards.length - 1]
  let pairCount = 0
  for (let i = peggingCards.length - 2; i >= 0; i--) {
    if (peggingCards[i].rank === lastCard.rank) {
      pairCount++
    } else {
      break
    }
  }
  
  if (pairCount === 1) {
    score += 2
  } else if (pairCount === 2) {
    score += 6
  } else if (pairCount === 3) {
    score += 12
  }
  
  // Check for runs
  if (peggingCards.length >= 3) {
    const recentCards = peggingCards.slice(-7)
    const ranks = recentCards.map(c => getCardRank(c))
    
    let runLength = 1
    for (let i = ranks.length - 2; i >= 0; i--) {
      if (ranks[i] === ranks[i+1] - 1) {
        runLength++
      } else {
        break
      }
    }
    
    if (runLength >= 3) {
      const runCards = recentCards.slice(-runLength)
      const runScore = runLength * runCards.length
      score += runScore
    }
  }
  
  return score
}