/**
 * runnerDefinitions.js
 * 
 * VALIDATION CHECKLIST (AI must verify):
 * ✓ All imports are valid and files exist
 * ✓ All functions have JSDoc comments
 * ✓ All parameters are validated
 * ✓ All errors are caught and logged
 * ✓ No placeholder comments (TODO, FIXME)
 * ✓ No hardcoded values (use GAME_CONFIG)
 * ✓ All arrays checked for length before access
 * ✓ All event listeners removed in shutdown()
 * ✓ Console logs use [runnerDefinitions.js] prefix
 * ✓ File length is within ±20% of estimate
 * 
 * Purpose: Complete runner/character library containing all playable characters with unique abilities
 * Dependencies: config.js, cardDefinitions.js
 * Used by: Runner.js, LoadoutScene.js, ProgressionSystem.js, BattleScene.js
 */

console.log('[runnerDefinitions.js] Loading runner library...');

import { GAME_CONFIG } from '../config.js';
import { CARD_LIBRARY, getCardById } from './cardDefinitions.js';

// ============================================================================
// RUNNER LIBRARY - ALL PLAYABLE CHARACTERS
// ============================================================================

/**
 * @typedef {Object} PassiveAbility
 * @property {string} id - Unique identifier for the ability
 * @property {string} name - Display name
 * @property {string} description - What the ability does
 * @property {string} trigger - When it activates (onCardPlay, onTurnStart, etc.)
 * @property {Function|null} condition - Optional condition check (card, gameState) => boolean
 * @property {Function} effect - The ability effect (gameState) => void or (damage, gameState) => number
 */

/**
 * @typedef {Object} RunnerDefinition
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} description - One-line summary
 * @property {string} lore - Backstory paragraph
 * @property {number} maxTrace - Starting trace capacity
 * @property {number} startingCPU - CPU per turn
 * @property {string[]} startingDeck - Array of card IDs
 * @property {PassiveAbility} passiveAbility - Unique character ability
 * @property {string} spriteKey - Asset reference
 * @property {string|null} unlockCondition - Achievement ID or null
 * @property {boolean} unlocked - Available to player?
 */

export const RUNNER_LIBRARY = {
  // ============================================================================
  // GHOST - DEFENSIVE STEALTH SPECIALIST (STARTER)
  // ============================================================================
  
  ghost: {
    id: "ghost",
    name: "Ghost",
    description: "Stealth specialist with defensive focus. Reduces trace gain from defense cards.",
    lore: "Once a corporate security consultant, Ghost turned rogue after discovering illegal surveillance programs targeting civilians. Now uses insider knowledge to infiltrate the very systems they once protected. Prefers precision over aggression, believing the best hack is one that goes unnoticed.",
    
    // Stats
    maxTrace: 100,
    startingCPU: 3,
    
    // Starting Deck (10 cards - balanced defensive build)
    // 4 Exploit, 4 Defense, 2 Utility
    startingDeck: [
      "exploit_001",  // Buffer Overflow (6 damage)
      "exploit_001",  // Buffer Overflow (6 damage)
      "exploit_002",  // SQL Injection (5 damage + draw)
      "exploit_006",  // Backdoor Access (3 damage, 0 cost)
      "defense_001",  // Firewall (5 block)
      "defense_001",  // Firewall (5 block)
      "defense_002",  // Encryption (6 block)
      "defense_003",  // Proxy Shield (4 block + draw)
      "utility_001",  // Reboot (draw 2, exhaust)
      "utility_002"   // Cache Hit (draw 1 + gain 1 CPU)
    ],
    
    // Passive Ability - Stealth Protocol
    passiveAbility: {
      id: "stealth_protocol",
      name: "Stealth Protocol",
      description: "Whenever you play a Defense card, reduce your current Trace by 1 (minimum 0).",
      trigger: "onCardPlay",
      
      /**
       * Condition check - triggers on defense card play
       * @param {Object} card - Card being played
       * @param {Object} gameState - Current game state
       * @returns {boolean} True if card is a defense type
       */
      condition: (card, gameState) => {
        if (!card || !card.type) {
          console.error('[runnerDefinitions.js] Ghost ability condition: Invalid card:', card);
          return false;
        }
        
        const isDefense = card.type === "defense";
        
        if (GAME_CONFIG.LOG_VERBOSE && isDefense) {
          console.log('[runnerDefinitions.js] Ghost ability triggered by defense card:', card.name);
        }
        
        return isDefense;
      },
      
      /**
       * Effect - reduce trace gain this turn
       * @param {Object} gameState - Current game state (mutated)
       */
      effect: (gameState) => {
        if (!gameState || !gameState.player) {
          console.error('[runnerDefinitions.js] Ghost ability effect: Invalid game state');
          return;
        }
        
        // IMMEDIATE trace reduction by 1 (no turn-based tracking needed)
        const currentTrace = gameState.player.currentTrace;
        const reductionAmount = 1;
        
        if (currentTrace > 0) {
          gameState.player.modifyTrace(-reductionAmount, 'ghost_stealth_protocol');
          
          console.log('[runnerDefinitions.js] Ghost Stealth Protocol: Reduced trace by', reductionAmount, {
            previousTrace: currentTrace,
            newTrace: gameState.player.currentTrace
          });
        } else {
          console.log('[runnerDefinitions.js] Ghost Stealth Protocol: Trace already at 0, no reduction');
        }
        
        const actualIncrease = 0; // Not used anymore
        
        if (actualIncrease > 0) {
          console.log('[runnerDefinitions.js] Ghost Stealth Protocol activated:', {
            traceReduction: gameState.traceReductionThisTurn,
            increased: actualIncrease,
            capped: gameState.traceReductionThisTurn >= 3
          });
        } else {
          console.warn('[runnerDefinitions.js] Ghost Stealth Protocol at maximum (3)');
        }
      }
    },
    
    // Visual & Unlock
    spriteKey: "runner_ghost_portrait",
    unlockCondition: null, // Starting runner
    unlocked: true
  },

  // ============================================================================
  // DEMON - AGGRESSIVE HIGH-RISK ATTACKER
  // ============================================================================
  
  demon: {
    id: "demon",
    name: "Demon",
    description: "Aggressive hacker with high-risk, high-reward playstyle. Gains bonus damage at high trace.",
    lore: "A chaos-driven hacktivist who thrives on the edge of detection. Demon believes fear is the hacker's greatest weapon. Deliberately triggers security alerts to watch systems panic, treating each intrusion as performance art. Lives for the thrill of the hack, dancing on the razor's edge between success and catastrophic failure.",
    
    // Stats (lower trace capacity for risk/reward)
    maxTrace: 80,
    startingCPU: 3,
    
    // Starting Deck (10 cards - aggressive offensive build)
    // 5 Exploit, 2 Defense, 2 Virus, 1 Utility
    startingDeck: [
      "exploit_001",  // Buffer Overflow (6 damage)
      "exploit_003",  // Brute Force (8 damage)
      "exploit_005",  // Packet Flood (7 damage + 2 trace)
      "exploit_007",  // DDoS Attack (10 damage)
      "exploit_008",  // Phishing Script (5 damage + weak)
      "virus_001",    // Trojan Horse (3 poison)
      "virus_001",    // Trojan Horse (3 poison)
      "defense_001",  // Firewall (5 block)
      "defense_006",  // Honeypot (2 block, 0 cost)
      "utility_003"   // Overclock (gain 2 CPU + 3 trace)
    ],
    
    // Passive Ability - Adrenaline Spike
    passiveAbility: {
      id: "adrenaline_spike",
      name: "Adrenaline Spike",
      description: "Deal +1 damage for every 20 Trace you have (maximum +4 at 80 Trace).",
      trigger: "onDamageCalculation",
      
      /**
       * No condition - always applies to damage calculation
       */
      condition: null,
      
      /**
       * Effect - scale damage based on current trace
       * @param {number} baseDamage - Raw damage before modifiers
       * @param {Object} gameState - Current game state
       * @returns {number} Modified damage value
       */
      effect: (baseDamage, gameState) => {
        if (typeof baseDamage !== 'number') {
          console.error('[runnerDefinitions.js] Demon ability: Invalid baseDamage:', baseDamage);
          return baseDamage || 0;
        }
        
        if (!gameState || !gameState.player) {
          console.error('[runnerDefinitions.js] Demon ability: Invalid game state');
          return baseDamage;
        }
        
        const currentTrace = gameState.player.currentTrace || 0;
        const traceThreshold = 20;
        
        // Calculate bonus damage (1 per 20 trace, max 4)
        const bonusDamage = Math.min(
          Math.floor(currentTrace / traceThreshold),
          4
        );
        
        const finalDamage = baseDamage + bonusDamage;
        
        if (bonusDamage > 0) {
          console.log('[runnerDefinitions.js] Demon Adrenaline Spike active:', {
            baseDamage: baseDamage,
            currentTrace: currentTrace,
            bonusDamage: bonusDamage,
            finalDamage: finalDamage
          });
        }
        
        return finalDamage;
      }
    },
    
    // Visual & Unlock
    spriteKey: "runner_demon_portrait",
    unlockCondition: "defeat_act1_boss",
    unlocked: false
  },

  // ============================================================================
  // ARCHITECT - TACTICAL DECK MANIPULATION SPECIALIST
  // ============================================================================
  
  architect: {
    id: "architect",
    name: "Architect",
    description: "Tactical mastermind specializing in deck manipulation. Draws an extra card each turn.",
    lore: "Former AI researcher who can predict system behavior with uncanny accuracy. Architect approaches hacking like chess, planning three moves ahead. Believes that information asymmetry is the ultimate weapon. Where others see chaos, Architect sees patterns. Every card drawn is another piece of a grand design.",
    
    // Stats
    maxTrace: 100,
    startingCPU: 3,
    
    // Starting Deck (10 cards - utility-focused build)
    // 3 Exploit, 3 Defense, 4 Utility
    startingDeck: [
      "exploit_001",  // Buffer Overflow (6 damage)
      "exploit_002",  // SQL Injection (5 damage + draw)
      "exploit_006",  // Backdoor Access (3 damage, 0 cost)
      "defense_001",  // Firewall (5 block)
      "defense_003",  // Proxy Shield (4 block + draw)
      "defense_006",  // Honeypot (2 block, 0 cost)
      "utility_001",  // Reboot (draw 2, exhaust)
      "utility_002",  // Cache Hit (draw 1 + gain 1 CPU)
      "utility_004",  // Debug Mode (draw 3, discard 1)
      "utility_005"   // Bandwidth Boost (gain 1 CPU)
    ],
    
    // Passive Ability - Strategic Insight
    passiveAbility: {
      id: "strategic_insight",
      name: "Strategic Insight",
      description: "Draw 1 extra card at the start of each turn.",
      trigger: "onTurnStart",
      
      /**
       * No condition - always triggers at turn start
       */
      condition: null,
      
      /**
       * Effect - draw additional card from deck
       * @param {Object} gameState - Current game state (mutated)
       */
      effect: (gameState) => {
        if (!gameState || !gameState.player) {
          console.error('[runnerDefinitions.js] Architect ability: Invalid game state');
          return;
        }
        
        const player = gameState.player;
        
        // Validate deck exists and has cards
        if (!Array.isArray(player.deck)) {
          console.error('[runnerDefinitions.js] Architect ability: Player deck is not an array');
          return;
        }
        
        if (player.deck.length === 0) {
          console.warn('[runnerDefinitions.js] Architect ability: Deck is empty, cannot draw');
          return;
        }
        
        // Validate hand exists
        if (!Array.isArray(player.hand)) {
          console.error('[runnerDefinitions.js] Architect ability: Player hand is not an array');
          player.hand = [];
        }
        
        // Check hand size limit
        const maxHandSize = GAME_CONFIG.GAMEPLAY.MAX_HAND_SIZE || 10;
        if (player.hand.length >= maxHandSize) {
          console.warn('[runnerDefinitions.js] Architect ability: Hand is full, cannot draw:', {
            currentHandSize: player.hand.length,
            maxHandSize: maxHandSize
          });
          return;
        }
        
        // Draw card from top of deck
        const drawnCard = player.deck.shift();
        
        if (!drawnCard) {
          console.error('[runnerDefinitions.js] Architect ability: Failed to draw card from deck');
          return;
        }
        
        player.hand.push(drawnCard);
        
        console.log('[runnerDefinitions.js] Architect Strategic Insight activated:', {
          cardDrawn: drawnCard.name || drawnCard.id,
          deckRemaining: player.deck.length,
          handSize: player.hand.length
        });
      }
    },
    
    // Visual & Unlock
    spriteKey: "runner_architect_portrait",
    unlockCondition: "complete_full_run",
    unlocked: false
  }
};

// ============================================================================
// VALIDATION & HELPER FUNCTIONS
// ============================================================================

/**
 * Validates the runner library on load
 * Checks for missing properties, invalid values, invalid deck compositions
 * @returns {boolean} True if validation passes
 */
function validateRunnerLibrary() {
  console.log('[runnerDefinitions.js] Validating runner library...');
  
  const errors = [];
  const warnings = [];
  const runnerIds = new Set();
  const runnerArray = Object.values(RUNNER_LIBRARY);
  
  // Expected counts
  const expectedRunnerCount = 3;
  const expectedDeckSize = 10;
  
  if (runnerArray.length !== expectedRunnerCount) {
    errors.push(`Expected ${expectedRunnerCount} runners, found ${runnerArray.length}`);
  }
  
  runnerArray.forEach((runner, index) => {
    const runnerRef = `Runner #${index + 1} (${runner.id || 'NO_ID'})`;
    
    // Check required properties
    if (!runner.id) {
      errors.push(`${runnerRef}: Missing id property`);
    } else {
      if (runnerIds.has(runner.id)) {
        errors.push(`${runnerRef}: Duplicate ID detected`);
      }
      runnerIds.add(runner.id);
    }
    
    if (!runner.name) {
      errors.push(`${runnerRef}: Missing name property`);
    }
    
    if (!runner.description) {
      warnings.push(`${runnerRef}: Missing description`);
    }
    
    if (!runner.lore) {
      warnings.push(`${runnerRef}: Missing lore`);
    }
    
    // Validate stats
    if (typeof runner.maxTrace !== 'number') {
      errors.push(`${runnerRef}: Missing or invalid maxTrace`);
    } else if (runner.maxTrace <= 0) {
      errors.push(`${runnerRef}: maxTrace must be > 0`);
    }
    
    if (typeof runner.startingCPU !== 'number') {
      errors.push(`${runnerRef}: Missing or invalid startingCPU`);
    } else if (runner.startingCPU <= 0) {
      errors.push(`${runnerRef}: startingCPU must be > 0`);
    }
    
    // Validate starting deck
    if (!Array.isArray(runner.startingDeck)) {
      errors.push(`${runnerRef}: startingDeck must be an array`);
    } else {
      if (runner.startingDeck.length !== expectedDeckSize) {
        errors.push(`${runnerRef}: startingDeck has ${runner.startingDeck.length} cards, expected ${expectedDeckSize}`);
      }
      
      // Validate all card IDs exist
      runner.startingDeck.forEach((cardId, cardIndex) => {
        if (!cardId || typeof cardId !== 'string') {
          errors.push(`${runnerRef} Deck card #${cardIndex + 1}: Invalid card ID type`);
          return;
        }
        
        const card = getCardById(cardId);
        if (!card) {
          errors.push(`${runnerRef} Deck card #${cardIndex + 1}: Card ID "${cardId}" not found in CARD_LIBRARY`);
        }
      });
      
      // Log deck composition
      if (GAME_CONFIG.LOG_VERBOSE) {
        const deckComposition = {
          exploit: 0,
          defense: 0,
          utility: 0,
          virus: 0
        };
        
        runner.startingDeck.forEach(cardId => {
          const card = getCardById(cardId);
          if (card && card.type) {
            deckComposition[card.type] = (deckComposition[card.type] || 0) + 1;
          }
        });
        
        console.log(`[runnerDefinitions.js] ${runnerRef} deck composition:`, deckComposition);
      }
    }
    
    // Validate passive ability
    if (!runner.passiveAbility) {
      errors.push(`${runnerRef}: Missing passiveAbility`);
    } else {
      const ability = runner.passiveAbility;
      
      if (!ability.id) {
        errors.push(`${runnerRef} Ability: Missing id`);
      }
      
      if (!ability.name) {
        errors.push(`${runnerRef} Ability: Missing name`);
      }
      
      if (!ability.description) {
        warnings.push(`${runnerRef} Ability: Missing description`);
      }
      
      if (!ability.trigger) {
        errors.push(`${runnerRef} Ability: Missing trigger`);
      }
      
      if (typeof ability.effect !== 'function') {
        errors.push(`${runnerRef} Ability: effect must be a function`);
      }
      
      if (ability.condition !== null && typeof ability.condition !== 'function') {
        errors.push(`${runnerRef} Ability: condition must be a function or null`);
      }
    }
    
    // Validate visual assets
    if (!runner.spriteKey) {
      warnings.push(`${runnerRef}: Missing spriteKey`);
    } else if (!runner.spriteKey.startsWith('runner_')) {
      warnings.push(`${runnerRef}: spriteKey should follow naming convention "runner_*"`);
    }
    
    // Validate unlock
    if (typeof runner.unlocked !== 'boolean') {
      errors.push(`${runnerRef}: unlocked must be boolean`);
    }
    
    if (runner.unlockCondition !== null && typeof runner.unlockCondition !== 'string') {
      errors.push(`${runnerRef}: unlockCondition must be string or null`);
    }
  });
  
  // Check that at least one runner is unlocked
  const unlockedCount = runnerArray.filter(r => r.unlocked).length;
  if (unlockedCount === 0) {
    errors.push('At least one runner must be unlocked by default');
  }
  
  // Log results
  console.log('[runnerDefinitions.js] Validation complete:', {
    totalRunners: runnerArray.length,
    unlocked: unlockedCount,
    errors: errors.length,
    warnings: warnings.length
  });
  
  if (warnings.length > 0) {
    console.warn('[runnerDefinitions.js] ⚠️ Validation warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  if (errors.length > 0) {
    console.error('[runnerDefinitions.js] ❌ Validation errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    throw new Error(`Runner validation failed with ${errors.length} errors`);
  }
  
  console.log('[runnerDefinitions.js] ✅ Runner library validated successfully');
  return true;
}

// Run validation on load
try {
  validateRunnerLibrary();
} catch (error) {
  console.error('[runnerDefinitions.js] CRITICAL ERROR during validation:', error);
  throw error;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get runner by ID with validation
 * @param {string} runnerId - Runner ID to retrieve
 * @returns {RunnerDefinition|null} Runner object or null if not found
 */
export function getRunnerById(runnerId) {
  if (!runnerId || typeof runnerId !== 'string') {
    console.error('[runnerDefinitions.js] getRunnerById: Invalid runnerId:', runnerId);
    return null;
  }
  
  const runner = RUNNER_LIBRARY[runnerId];
  
  if (!runner) {
    console.warn('[runnerDefinitions.js] getRunnerById: Runner not found:', runnerId);
    return null;
  }
  
  return runner;
}

/**
 * Get all unlocked runners
 * @returns {RunnerDefinition[]} Array of unlocked runners
 */
export function getUnlockedRunners() {
  const unlocked = Object.values(RUNNER_LIBRARY).filter(runner => runner.unlocked === true);
  
  console.log('[runnerDefinitions.js] getUnlockedRunners:', unlocked.map(r => r.id));
  
  return unlocked;
}

/**
 * Get all runner IDs
 * @returns {string[]} Array of all runner IDs
 */
export function getAllRunnerIds() {
  return Object.keys(RUNNER_LIBRARY);
}

/**
 * Clone runner definition (for game state instances)
 * @param {RunnerDefinition} runner - Runner to clone
 * @returns {RunnerDefinition|null} Deep clone of runner
 */
export function cloneRunner(runner) {
  if (!runner) {
    console.error('[runnerDefinitions.js] cloneRunner: Cannot clone null/undefined runner');
    return null;
  }
  
  try {
    // Clone the runner but preserve the functions (ability logic)
    const cloned = {
      ...runner,
      startingDeck: [...runner.startingDeck],
      passiveAbility: {
        ...runner.passiveAbility,
        // Preserve function references
        condition: runner.passiveAbility.condition,
        effect: runner.passiveAbility.effect
      }
    };
    
    return cloned;
  } catch (error) {
    console.error('[runnerDefinitions.js] cloneRunner: Failed to clone runner:', error);
    return null;
  }
}

/**
 * Check if runner is unlocked
 * @param {string} runnerId - Runner ID to check
 * @returns {boolean} True if unlocked
 */
export function isRunnerUnlocked(runnerId) {
  const runner = getRunnerById(runnerId);
  
  if (!runner) {
    return false;
  }
  
  return runner.unlocked === true;
}

// ============================================================================
// HELPER ARRAYS FOR QUICK ACCESS
// ============================================================================

/**
 * All runners as array
 * @type {RunnerDefinition[]}
 */
export const ALL_RUNNERS = Object.values(RUNNER_LIBRARY);

/**
 * Unlocked runners (filtered dynamically)
 * @returns {RunnerDefinition[]}
 */
export const UNLOCKED_RUNNERS = () => ALL_RUNNERS.filter(r => r.unlocked);

// ============================================================================
// EXPORTS
// ============================================================================

console.log('[runnerDefinitions.js] ✅ Module loaded successfully');
console.log('[runnerDefinitions.js] Total runners:', ALL_RUNNERS.length);
console.log('[runnerDefinitions.js] Unlocked runners:', getUnlockedRunners().length);
console.log('[runnerDefinitions.js] Runner IDs:', getAllRunnerIds());

// Default export
export default RUNNER_LIBRARY;