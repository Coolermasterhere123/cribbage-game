'use client'

import { useState, useEffect, useCallback } from 'react'
import Card from './Card'
import Board from './Board'
import ScoreDisplay from './ScoreDisplay'
import GameControls from './GameControls'
import { 
  createDeck, 
  shuffleDeck, 
  dealCards, 
  calculateHandScore, 
  calculateCribScore,
  calculatePeggingScore,
  getCardValue,
  getCardRank
} from '../utils/cardUtils'
import { 
  selectCribCards, 
  selectPlayCard, 
  getDifficultyLevel 
} from '../utils/aiUtils'
import styles from './CribbageGame.module.css'

export default function CribbageGame() {
  const [gameState, setGameState] = useState({
    playerHand: [],
    cpuHand: [],
    crib: [],
    starterCard: null,
    playerScore: 0,
    cpuScore: 0,
    currentPlayer: 'player',
    phase: 'cut',
    peggingCards: [],
    peggingTotal: 0,
    message: '',
    gameOver: false,
    winner: null,
    difficulty: 'medium',
    isCpuThinking: false,
    deck: [],
    roundNumber: 0,
    isPlayerDealer: true,
    waitingForCut: true,
    playerCutCard: null,
    cpuCutCard: null,
    lastPeggingScore: 0,
    playerPassed: false,
    cpuPassed: false,
    peggingComplete: false,
    showingScores: false,
    roundComplete: false,
  })

  const [debugLog, setDebugLog] = useState([])

  const addDebugLog = (message) => {
    console.log('[Cribbage]', message)
    setDebugLog(prev => [...prev, message])
  }

  const startNewGame = useCallback((difficulty = 'medium') => {
    addDebugLog('=== STARTING NEW GAME ===')
    const deck = shuffleDeck(createDeck())
    const { playerHand, cpuHand } = dealCards(deck)
    const remainingDeck = deck.slice(12)
    
    setGameState({
      playerHand: playerHand || [],
      cpuHand: cpuHand || [],
      crib: [],
      starterCard: null,
      playerScore: 0,
      cpuScore: 0,
      currentPlayer: 'player',
      phase: 'cut',
      peggingCards: [],
      peggingTotal: 0,
      message: 'Cut for first dealer - click the deck!',
      gameOver: false,
      winner: null,
      difficulty,
      isCpuThinking: false,
      deck: remainingDeck || [],
      roundNumber: 0,
      isPlayerDealer: true,
      waitingForCut: true,
      playerCutCard: null,
      cpuCutCard: null,
      lastPeggingScore: 0,
      playerPassed: false,
      cpuPassed: false,
      peggingComplete: false,
      showingScores: false,
      roundComplete: false,
    })
  }, [])

  const handleCut = useCallback(() => {
    setGameState(prev => {
      if (prev.phase !== 'cut' || !prev.waitingForCut) return prev
      if (!prev.deck || prev.deck.length === 0) return prev
      
      const playerCutIndex = Math.floor(Math.random() * prev.deck.length)
      const playerCutCard = prev.deck[playerCutIndex]
      
      const cpuCutIndex = Math.floor(Math.random() * prev.deck.length)
      const cpuCutCard = prev.deck[cpuCutIndex]
      
      const remainingDeck = prev.deck.filter((_, idx) => idx !== playerCutIndex && idx !== cpuCutIndex)
      
      const playerValue = getCardRank(playerCutCard)
      const cpuValue = getCardRank(cpuCutCard)
      
      const isPlayerDealer = playerValue <= cpuValue
      addDebugLog('Cut: Player ' + playerCutCard.rank + playerCutCard.suit + ' (' + playerValue + ') vs CPU ' + cpuCutCard.rank + cpuCutCard.suit + ' (' + cpuValue + ') - ' + (isPlayerDealer ? 'Player deals' : 'CPU deals'))
      
      return {
        ...prev,
        deck: remainingDeck || [],
        isPlayerDealer,
        phase: 'discard',
        waitingForCut: false,
        playerCutCard: playerCutCard,
        cpuCutCard: cpuCutCard,
        message: isPlayerDealer ? 'You are dealer! Select 2 cards for the crib.' : 'CPU is dealer. Select 2 cards for the crib.',
        currentPlayer: 'player',
      }
    })
  }, [])

  const handleCardSelect = useCallback((cardIndex) => {
    setGameState(prev => {
      if (prev.phase !== 'discard' || prev.currentPlayer !== 'player') return prev
      if (!prev.playerHand || prev.playerHand.length <= 4) return prev

      const selectedCard = prev.playerHand[cardIndex]
      if (!selectedCard) return prev

      const newHand = prev.playerHand.filter((_, idx) => idx !== cardIndex)
      const newCrib = [...(prev.crib || []), selectedCard]

      if (newHand.length === 4) {
        addDebugLog('Player discarded ' + selectedCard.rank + selectedCard.suit)
        
        const cpuDiscard = selectCribCards(prev.cpuHand || [], false, prev.difficulty)
        const cpuHandAfter = (prev.cpuHand || []).filter((_, idx) => !cpuDiscard.includes(idx))
        const cpuCrib = cpuDiscard.map(idx => prev.cpuHand[idx])
        
        const allCrib = [...newCrib, ...cpuCrib]
        addDebugLog('CPU discarded ' + cpuCrib.map(c => c.rank + c.suit).join(', '))
        
        const starterIndex = Math.floor(Math.random() * (prev.deck || []).length)
        const starterCard = prev.deck[starterIndex]
        const remainingDeck = (prev.deck || []).filter((_, idx) => idx !== starterIndex)
        addDebugLog('Starter: ' + starterCard.rank + starterCard.suit)

        return {
          ...prev,
          playerHand: newHand || [],
          cpuHand: cpuHandAfter || [],
          crib: allCrib || [],
          starterCard,
          deck: remainingDeck || [],
          phase: 'play',
          currentPlayer: 'player',
          peggingCards: [],
          peggingTotal: 0,
          message: 'Play a card or press "Go"!',
          lastPeggingScore: 0,
          playerPassed: false,
          cpuPassed: false,
          peggingComplete: false,
          roundComplete: false,
        }
      }

      return {
        ...prev,
        playerHand: newHand || [],
        crib: newCrib || [],
        message: 'Selected ' + selectedCard.rank + selectedCard.suit + '. Choose another.',
      }
    })
  }, [])

  const handleGo = useCallback(() => {
    setGameState(prev => {
      if (prev.phase !== 'play' || prev.currentPlayer !== 'player') return prev
      if (prev.peggingComplete) return prev
      if (prev.playerPassed) return prev
      
      // Check if player actually has a playable card
      const canPlay = prev.playerHand && prev.playerHand.some(card => 
        (prev.peggingTotal || 0) + getCardValue(card) <= 31
      )
      
      if (canPlay) {
        return { ...prev, message: 'You have playable cards! Play one instead.' }
      }
      
      addDebugLog('Player says "Go"')
      
      // Check if CPU can play
      const cpuCanPlay = prev.cpuHand && prev.cpuHand.some(card => 
        (prev.peggingTotal || 0) + getCardValue(card) <= 31
      )
      
      if (!cpuCanPlay) {
        // Both passed - end pegging and score hands
        addDebugLog('Both passed - ENDING PEGGING')
        return endPeggingAndScore(prev)
      }
      
      // Player passes, CPU's turn
      return {
        ...prev,
        currentPlayer: 'cpu',
        isCpuThinking: true,
        message: 'You say "Go". CPU is thinking...',
        playerPassed: true,
      }
    })
  }, [])

  const endPeggingAndScore = (prev) => {
    const isPlayerDealer = prev.isPlayerDealer
    addDebugLog('=== SCORING HANDS ===')
    addDebugLog('Dealer: ' + (isPlayerDealer ? 'Player' : 'CPU'))
    
    const playerHandScore = calculateHandScore(prev.playerHand || [], prev.starterCard)
    const cpuHandScore = calculateHandScore(prev.cpuHand || [], prev.starterCard)
    const cribScore = calculateCribScore(prev.crib || [], prev.starterCard, isPlayerDealer)
    
    addDebugLog('Player hand score: ' + playerHandScore)
    addDebugLog('CPU hand score: ' + cpuHandScore)
    addDebugLog('Crib score: ' + cribScore)
    
    let newPlayerScore = prev.playerScore || 0
    let newCpuScore = prev.cpuScore || 0
    
    // Non-dealer scores first
    if (!isPlayerDealer) {
      // CPU is dealer, player scores first
      newPlayerScore += playerHandScore
      newCpuScore += cpuHandScore + cribScore
      addDebugLog('CPU is dealer - Player scores first')
    } else {
      // Player is dealer, CPU scores first
      newCpuScore += cpuHandScore
      newPlayerScore += playerHandScore + cribScore
      addDebugLog('Player is dealer - CPU scores first')
    }
    
    addDebugLog('New scores - Player: ' + newPlayerScore + ', CPU: ' + newCpuScore)
    
    if (newPlayerScore >= 121) {
      addDebugLog('PLAYER WINS!')
      return {
        ...prev,
        playerScore: 121,
        phase: 'gameover',
        gameOver: true,
        winner: 'player',
        message: 'You win! 🎉',
        peggingComplete: true,
        roundComplete: true,
      }
    }
    
    if (newCpuScore >= 121) {
      addDebugLog('CPU WINS!')
      return {
        ...prev,
        cpuScore: 121,
        phase: 'gameover',
        gameOver: true,
        winner: 'cpu',
        message: 'CPU wins! Better luck next time.',
        peggingComplete: true,
        roundComplete: true,
      }
    }

    addDebugLog('=== STARTING NEW ROUND ===')
    return startNewRound(prev, newPlayerScore, newCpuScore, 'Round complete!')
  }

  const handlePlayCard = useCallback((cardIndex) => {
    setGameState(prev => {
      if (prev.phase !== 'play' || prev.currentPlayer !== 'player') return prev
      if (prev.isCpuThinking) return prev
      if (!prev.playerHand || prev.playerHand.length === 0) return prev
      if (prev.peggingComplete) return prev
      if (prev.roundComplete) return prev

      const card = prev.playerHand[cardIndex]
      if (!card) return prev

      const cardValue = getCardValue(card)
      const newTotal = (prev.peggingTotal || 0) + cardValue

      if (newTotal > 31) {
        return { ...prev, message: 'That would exceed 31. Play a different card or press "Go".' }
      }

      const newHand = prev.playerHand.filter((_, idx) => idx !== cardIndex)
      const newPeggingCards = [...(prev.peggingCards || []), { ...card, player: 'player' }]
      
      const peggingScore = calculatePeggingScore(newPeggingCards, 'player')
      
      let playerScore = (prev.playerScore || 0) + peggingScore
      let cpuScore = prev.cpuScore || 0
      
      let message = 'You played ' + card.rank + card.suit
      if (peggingScore > 0) {
        message += ' +' + peggingScore + ' points!'
        addDebugLog('Player pegging: +' + peggingScore + ' (Total: ' + newTotal + ')')
      }
      addDebugLog('Player played: ' + card.rank + card.suit + ' (Total: ' + newTotal + ')')

      if (playerScore >= 121) {
        addDebugLog('PLAYER WINS!')
        return {
          ...prev,
          playerHand: newHand || [],
          peggingCards: newPeggingCards,
          peggingTotal: newTotal,
          playerScore: 121,
          phase: 'gameover',
          gameOver: true,
          winner: 'player',
          message: 'You win! 🎉',
          isCpuThinking: false,
        }
      }

      // Check if both hands are empty
      if (newHand.length === 0 && (!prev.cpuHand || prev.cpuHand.length === 0)) {
        addDebugLog('Both hands empty - scoring')
        return endPeggingAndScore(prev)
      }

      // CPU's turn
      if (prev.cpuHand && prev.cpuHand.length > 0) {
        setTimeout(() => {
          handleCpuPlay()
        }, 800)
        
        return {
          ...prev,
          playerHand: newHand || [],
          peggingCards: newPeggingCards,
          peggingTotal: newTotal,
          playerScore,
          cpuScore,
          currentPlayer: 'cpu',
          isCpuThinking: true,
          message: message + ' CPU is thinking...',
          lastPeggingScore: peggingScore,
          playerPassed: false,
        }
      }

      return {
        ...prev,
        playerHand: newHand || [],
        peggingCards: newPeggingCards,
        peggingTotal: newTotal,
        playerScore,
        cpuScore,
        currentPlayer: 'player',
        message: message + ' Continue.',
        lastPeggingScore: peggingScore,
      }
    })
  }, [])

  const handleCpuPlay = useCallback(() => {
    setGameState(prev => {
      if (prev.phase !== 'play' || prev.currentPlayer !== 'cpu') return prev
      if (!prev.cpuHand || prev.cpuHand.length === 0) {
        return { ...prev, isCpuThinking: false }
      }
      if (prev.peggingComplete) return prev
      if (prev.roundComplete) return prev

      // Check if CPU can play any card
      const canPlay = prev.cpuHand.some(card => 
        (prev.peggingTotal || 0) + getCardValue(card) <= 31
      )

      if (!canPlay) {
        addDebugLog('CPU says "Go"')
        
        // Check if player can play
        const playerCanPlay = prev.playerHand && prev.playerHand.some(card => 
          (prev.peggingTotal || 0) + getCardValue(card) <= 31
        )

        if (!playerCanPlay) {
          addDebugLog('Both passed - ENDING PEGGING')
          return endPeggingAndScore(prev)
        }

        return {
          ...prev,
          currentPlayer: 'player',
          isCpuThinking: false,
          message: 'CPU says "Go". Your turn.',
          cpuPassed: true,
        }
      }

      // CPU can play - select a card
      const difficultyLevel = getDifficultyLevel(prev.difficulty)
      const cardIndex = selectPlayCard(
        prev.cpuHand,
        prev.peggingTotal || 0,
        prev.peggingCards || [],
        difficultyLevel
      )

      if (cardIndex === -1) {
        return { ...prev, isCpuThinking: false }
      }

      const card = prev.cpuHand[cardIndex]
      if (!card) {
        return { ...prev, isCpuThinking: false }
      }

      const cardValue = getCardValue(card)
      const newTotal = (prev.peggingTotal || 0) + cardValue
      const newHand = prev.cpuHand.filter((_, idx) => idx !== cardIndex)
      const newPeggingCards = [...(prev.peggingCards || []), { ...card, player: 'cpu' }]
      
      const peggingScore = calculatePeggingScore(newPeggingCards, 'cpu')
      let cpuScore = (prev.cpuScore || 0) + peggingScore
      let playerScore = prev.playerScore || 0
      
      let message = 'CPU played ' + card.rank + card.suit
      if (peggingScore > 0) {
        message += ' +' + peggingScore + ' points!'
        addDebugLog('CPU pegging: +' + peggingScore + ' (Total: ' + newTotal + ')')
      }
      addDebugLog('CPU played: ' + card.rank + card.suit + ' (Total: ' + newTotal + ')')

      if (cpuScore >= 121) {
        addDebugLog('CPU WINS!')
        return {
          ...prev,
          cpuHand: newHand || [],
          peggingCards: newPeggingCards,
          peggingTotal: newTotal,
          cpuScore: 121,
          phase: 'gameover',
          gameOver: true,
          winner: 'cpu',
          message: 'CPU wins! Better luck next time.',
          isCpuThinking: false,
        }
      }

      // Check if both hands are empty
      if (newHand.length === 0 && (!prev.playerHand || prev.playerHand.length === 0)) {
        addDebugLog('Both hands empty - scoring')
        return endPeggingAndScore(prev)
      }

      // Check if player can play
      const playerCanPlay = prev.playerHand && prev.playerHand.some(card => 
        newTotal + getCardValue(card) <= 31
      )

      if (!playerCanPlay && newTotal < 31) {
        addDebugLog('Player cannot play')
        const cpuCanStillPlay = newHand.some(card => 
          newTotal + getCardValue(card) <= 31
        )
        
        if (!cpuCanStillPlay) {
          addDebugLog('Both passed - ENDING PEGGING')
          return endPeggingAndScore(prev)
        }

        return {
          ...prev,
          cpuHand: newHand || [],
          peggingCards: newPeggingCards,
          peggingTotal: newTotal,
          cpuScore,
          currentPlayer: 'cpu',
          isCpuThinking: true,
          message: message + ' You say "Go". CPU continues...',
          lastPeggingScore: peggingScore,
        }
      }

      return {
        ...prev,
        cpuHand: newHand || [],
        peggingCards: newPeggingCards,
        peggingTotal: newTotal,
        cpuScore,
        currentPlayer: 'player',
        isCpuThinking: false,
        message: message + ' Your turn.',
        lastPeggingScore: peggingScore,
        cpuPassed: false,
      }
    })
  }, [])

  const startNewRound = (prev, playerScore, cpuScore, message) => {
    const deck = shuffleDeck(createDeck())
    const { playerHand, cpuHand } = dealCards(deck)
    const remainingDeck = deck.slice(12)
    
    addDebugLog('New round - Dealer: ' + (prev.isPlayerDealer ? 'Player' : 'CPU'))
    
    return {
      ...prev,
      playerHand: playerHand || [],
      cpuHand: cpuHand || [],
      crib: [],
      starterCard: null,
      deck: remainingDeck || [],
      phase: 'discard',
      currentPlayer: 'player',
      peggingCards: [],
      peggingTotal: 0,
      message: 'Select 2 cards for the crib',
      playerScore: playerScore || 0,
      cpuScore: cpuScore || 0,
      isCpuThinking: false,
      roundNumber: (prev.roundNumber || 0) + 1,
      isPlayerDealer: !prev.isPlayerDealer,
      waitingForCut: false,
      playerCutCard: null,
      cpuCutCard: null,
      lastPeggingScore: 0,
      playerPassed: false,
      cpuPassed: false,
      peggingComplete: false,
      showingScores: false,
      roundComplete: false,
    }
  }

  useEffect(() => {
    if (gameState.currentPlayer === 'cpu' && gameState.phase === 'play' && !gameState.isCpuThinking && !gameState.peggingComplete) {
      handleCpuPlay()
    }
  }, [gameState.currentPlayer, gameState.phase, gameState.isCpuThinking, gameState.peggingComplete, handleCpuPlay])

  useEffect(() => {
    startNewGame('medium')
  }, [])

  const renderGame = () => {
    if (gameState.gameOver) {
      return (
        <div className={styles.gameOverContainer}>
          <h2>{gameState.message}</h2>
          <div className={styles.finalScores}>
            <div>You: {gameState.playerScore}</div>
            <div>CPU: {gameState.cpuScore}</div>
          </div>
          <button 
            className={styles.button}
            onClick={() => startNewGame(gameState.difficulty)}
          >
            Play Again
          </button>
          <div className={styles.difficultySelector}>
            <button 
              className={styles.difficultyButton}
              onClick={() => startNewGame('medium')}
            >
              Medium
            </button>
            <button 
              className={styles.difficultyButton}
              onClick={() => startNewGame('hard')}
            >
              Hard
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className={styles.gameContainer}>
        <div className={styles.header}>
          <h1>Cribbage</h1>
          <div className={styles.difficulty}>
            Difficulty: {gameState.difficulty.charAt(0).toUpperCase() + gameState.difficulty.slice(1)}
          </div>
        </div>

        <div className={styles.boardSection}>
          <Board 
            playerScore={gameState.playerScore || 0}
            cpuScore={gameState.cpuScore || 0}
            isPlayerDealer={gameState.isPlayerDealer}
          />
        </div>

        <div className={styles.gameArea}>
          <ScoreDisplay 
            playerScore={gameState.playerScore || 0}
            cpuScore={gameState.cpuScore || 0}
            message={gameState.message}
          />

          {gameState.phase === 'cut' && gameState.waitingForCut && (
            <div className={styles.cutSection}>
              <h3>Cut for first dealer - click the deck!</h3>
              <div className={styles.cutDeck}>
                <div className={styles.deckCard} onClick={handleCut}>
                  <div className={styles.deckBack}>🃏</div>
                  <div className={styles.deckLabel}>Click to cut</div>
                </div>
              </div>
            </div>
          )}

          {gameState.playerCutCard && gameState.cpuCutCard && (
            <div className={styles.cutResult}>
              <div className={styles.cutCard}>
                <span>Your cut: </span>
                <Card card={gameState.playerCutCard} small={true} />
              </div>
              <div className={styles.cutCard}>
                <span>CPU cut: </span>
                <Card card={gameState.cpuCutCard} small={true} />
              </div>
              <div className={styles.cutResultText}>
                {gameState.isPlayerDealer ? '🃏 You are dealer!' : '🃏 CPU is dealer!'}
              </div>
            </div>
          )}

          <div className={styles.handsSection}>
            <div className={styles.hand}>
              <h3>CPU Hand ({gameState.cpuHand ? gameState.cpuHand.length : 0} cards)</h3>
              <div className={styles.cards}>
                {gameState.cpuHand && gameState.cpuHand.map((_, idx) => (
                  <Card key={idx} hidden={true} />
                ))}
              </div>
            </div>

            {gameState.starterCard && (
              <div className={styles.cribSection}>
                <h3>Starter Card</h3>
                <div className={styles.starterCard}>
                  <Card card={gameState.starterCard} />
                </div>
                <h3>Crib ({gameState.crib ? gameState.crib.length : 0} cards)</h3>
                <div className={styles.cards}>
                  {gameState.crib && gameState.crib.map((card, idx) => (
                    <Card key={idx} card={card} small={true} />
                  ))}
                </div>
              </div>
            )}

            <div className={styles.hand}>
              <h3>Your Hand ({gameState.playerHand ? gameState.playerHand.length : 0} cards)</h3>
              <div className={styles.cards}>
                {gameState.playerHand && gameState.playerHand.map((card, idx) => (
                  <Card 
                    key={idx} 
                    card={card} 
                    onClick={() => {
                      if (gameState.phase === 'discard') {
                        handleCardSelect(idx)
                      } else if (gameState.phase === 'play' && gameState.currentPlayer === 'player' && !gameState.peggingComplete) {
                        handlePlayCard(idx)
                      }
                    }}
                    selectable={gameState.phase === 'discard' || (gameState.phase === 'play' && gameState.currentPlayer === 'player' && !gameState.peggingComplete)}
                  />
                ))}
              </div>
            </div>
          </div>

          {gameState.phase === 'play' && !gameState.peggingComplete && (
            <div className={styles.peggingSection}>
              <h3>Pegging (Total: {gameState.peggingTotal || 0})</h3>
              <div className={styles.peggingCards}>
                {gameState.peggingCards && gameState.peggingCards.map((card, idx) => (
                  <Card key={idx} card={card} small={true} />
                ))}
              </div>
              {gameState.lastPeggingScore > 0 && (
                <div className={styles.scoreNotification}>
                  +{gameState.lastPeggingScore} points!
                </div>
              )}
              <div className={styles.goButtonContainer}>
                <button 
                  className={styles.goButton}
                  onClick={handleGo}
                  disabled={gameState.currentPlayer !== 'player' || gameState.isCpuThinking}
                >
                  Say "Go"
                </button>
              </div>
            </div>
          )}

          <GameControls 
            phase={gameState.phase}
            onNewGame={() => startNewGame(gameState.difficulty)}
          />

          <div className={styles.debugLog}>
            <details open>
              <summary>Debug Log (click to expand/hide)</summary>
              <div className={styles.logEntries}>
                {debugLog.slice(-30).map((entry, idx) => (
                  <div key={idx} className={styles.logEntry}>{entry}</div>
                ))}
              </div>
            </details>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      {renderGame()}
    </div>
  )
}