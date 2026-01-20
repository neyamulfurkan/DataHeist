/**
 * iceDefinitions.js
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
 * ✓ Console logs use [iceDefinitions] prefix
 * ✓ File length is within ±20% of estimate
 * 
 * Purpose: Complete enemy ICE definitions with AI behavior patterns and reward structures
 * Dependencies: config.js, MathUtils.js
 * Used by: ICE.js, CombatSystem.js, MapGenerator.js, RewardSystem.js
 */

import { GAME_CONFIG } from '../config.js';
import { weightedRandom } from '../utils/MathUtils.js';

console.log('[iceDefinitions] Loading ICE enemy definitions...');

export const ICE_LIBRARY = {
  // ============================================================================
  // ACT 1 ENEMIES - TIER 1 (4 enemies)
  // ============================================================================
  
  ice_guardian: {
    id: "ice_guardian",
    name: "Guardian ICE",
    type: "firewall",
    tier: 1,
    maxHP: 40,
    intentPool: [
      { type: "attack", value: 12, weight: 50 },
      { type: "defend", value: 6, weight: 20 },
      { type: "trace", value: 8, weight: 30 }
    ],
    aiLogic: function(gameState) {
      if (!gameState || !gameState.player) {
        console.error('[iceDefinitions] ice_guardian.aiLogic: Invalid gameState');
        return { type: "attack", value: 8 };
      }
      
      const selectedIntent = weightedRandom(
        this.intentPool.map(intent => ({ value: intent, weight: intent.weight }))
      );
      
      if (!selectedIntent) {
        console.error('[iceDefinitions] ice_guardian.aiLogic: weightedRandom failed, using fallback');
        return { type: "attack", value: 8 };
      }
      
      if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
        console.log('[iceDefinitions] ice_guardian.aiLogic: Selected intent', selectedIntent.type);
      }
      
      return selectedIntent;
    },
    rewards: {
      credits: 30,
      cardChoices: 3,
      cardPool: "common"
    },
    spriteKey: "ice_guardian",
    description: "Basic security ICE. Primarily attacks but can defend or trace."
  },

  ice_sentry: {
    id: "ice_sentry",
    name: "Sentry ICE",
    type: "sentry",
    tier: 1,
    maxHP: 35,
    intentPool: [
      { type: "attack", value: 14, weight: 60 },
      { type: "attack", value: 8, weight: 25 },
      { type: "trace", value: 6, weight: 15 }
    ],
    aiLogic: function(gameState) {
      if (!gameState || !gameState.player || !gameState.enemy) {
        console.error('[iceDefinitions] ice_sentry.aiLogic: Invalid gameState');
        return { type: "attack", value: 10 };
      }
      
      const lowHealth = gameState.enemy.currentHP < (gameState.enemy.maxHP * 0.3);
      
      if (lowHealth) {
        if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
          console.log('[iceDefinitions] ice_sentry.aiLogic: Low health, aggressive attack');
        }
        return { type: "attack", value: 18 };
      }
      
      const selectedIntent = weightedRandom(
        this.intentPool.map(intent => ({ value: intent, weight: intent.weight }))
      );
      
      if (!selectedIntent) {
        console.error('[iceDefinitions] ice_sentry.aiLogic: weightedRandom failed');
        return { type: "attack", value: 10 };
      }
      
      return selectedIntent;
    },
    rewards: {
      credits: 28,
      cardChoices: 3,
      cardPool: "common"
    },
    spriteKey: "ice_sentry",
    description: "Aggressive attacker. Becomes more dangerous at low health."
  },

  ice_tracer: {
    id: "ice_tracer",
    name: "Tracer ICE",
    type: "tracer",
    tier: 1,
    maxHP: 30,
    intentPool: [
      { type: "attack", value: 7, weight: 25 },
      { type: "trace", value: 15, weight: 75 }
    ],
    aiLogic: function(gameState) {
      if (!gameState || !gameState.player) {
        console.error('[iceDefinitions] ice_tracer.aiLogic: Invalid gameState');
        return { type: "trace", value: 8 };
      }
      
      const playerTrace = gameState.player.currentTrace || 0;
      const maxTrace = gameState.player.maxTrace || 100;
      const tracePercent = playerTrace / maxTrace;
      
      if (tracePercent < 0.5) {
        if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
          console.log('[iceDefinitions] ice_tracer.aiLogic: Player trace low, prioritizing trace attack');
        }
        return { type: "trace", value: 18 };
      }
      
      const selectedIntent = weightedRandom(
        this.intentPool.map(intent => ({ value: intent, weight: intent.weight }))
      );
      
      if (!selectedIntent) {
        console.error('[iceDefinitions] ice_tracer.aiLogic: weightedRandom failed');
        return { type: "trace", value: 8 };
      }
      
      return selectedIntent;
    },
    rewards: {
      credits: 25,
      cardChoices: 3,
      cardPool: "common"
    },
    spriteKey: "ice_tracer",
    description: "Trace specialist. Rapidly increases player trace level, especially when trace is low."
  },

  ice_barrier: {
    id: "ice_barrier",
    name: "Barrier ICE",
    type: "firewall",
    tier: 1,
    maxHP: 45,
    intentPool: [
      { type: "attack", value: 7, weight: 40 },
      { type: "defend", value: 10, weight: 50 },
      { type: "defend", value: 15, weight: 10 }
    ],
    aiLogic: function(gameState) {
      if (!gameState || !gameState.enemy) {
        console.error('[iceDefinitions] ice_barrier.aiLogic: Invalid gameState');
        return { type: "defend", value: 10 };
      }
      
      const currentBlock = gameState.enemy.block || 0;
      
      if (currentBlock === 0) {
        if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
          console.log('[iceDefinitions] ice_barrier.aiLogic: No block, defending');
        }
        return { type: "defend", value: 12 };
      }
      
      const selectedIntent = weightedRandom(
        this.intentPool.map(intent => ({ value: intent, weight: intent.weight }))
      );
      
      if (!selectedIntent) {
        console.error('[iceDefinitions] ice_barrier.aiLogic: weightedRandom failed');
        return { type: "defend", value: 10 };
      }
      
      return selectedIntent;
    },
    rewards: {
      credits: 32,
      cardChoices: 3,
      cardPool: "common"
    },
    spriteKey: "ice_barrier",
    description: "Defensive ICE. Frequently gains block to protect itself."
  },

  // ============================================================================
  // ACT 2 ENEMIES - TIER 2 (2 enemies)
  // ============================================================================

  ice_adaptive: {
    id: "ice_adaptive",
    name: "Adaptive ICE",
    type: "adaptive",
    tier: 2,
    maxHP: 60,
    intentPool: [
      { type: "attack", value: 12, weight: 50 },
      { type: "defend", value: 10, weight: 30 },
      { type: "applyStatus", status: "weak", stacks: 1, weight: 20 }
    ],
    aiLogic: function(gameState) {
      if (!gameState || !gameState.cardsPlayedThisTurn) {
        console.error('[iceDefinitions] ice_adaptive.aiLogic: Invalid gameState');
        return { type: "attack", value: 12 };
      }
      
      if (!Array.isArray(gameState.cardsPlayedThisTurn) || gameState.cardsPlayedThisTurn.length === 0) {
        if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
          console.log('[iceDefinitions] ice_adaptive.aiLogic: No cards played, using default intent');
        }
        const selectedIntent = weightedRandom(
          this.intentPool.map(intent => ({ value: intent, weight: intent.weight }))
        );
        return selectedIntent || { type: "attack", value: 12 };
      }
      
      const lastCard = gameState.cardsPlayedThisTurn[gameState.cardsPlayedThisTurn.length - 1];
      
      if (!lastCard || !lastCard.type) {
        console.warn('[iceDefinitions] ice_adaptive.aiLogic: Last card invalid');
        return { type: "attack", value: 12 };
      }
      
      if (lastCard.type === "exploit") {
        if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
          console.log('[iceDefinitions] ice_adaptive.aiLogic: Player attacked, defending');
        }
        return { type: "defend", value: 12 };
      } else if (lastCard.type === "defense") {
        if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
          console.log('[iceDefinitions] ice_adaptive.aiLogic: Player defended, attacking harder');
        }
        return { type: "attack", value: 15 };
      } else if (lastCard.type === "utility") {
        if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
          console.log('[iceDefinitions] ice_adaptive.aiLogic: Player used utility, applying weak');
        }
        return { type: "applyStatus", status: "weak", stacks: 2 };
      }
      
      const selectedIntent = weightedRandom(
        this.intentPool.map(intent => ({ value: intent, weight: intent.weight }))
      );
      
      return selectedIntent || { type: "attack", value: 12 };
    },
    rewards: {
      credits: 50,
      cardChoices: 3,
      cardPool: "uncommon"
    },
    spriteKey: "ice_adaptive",
    description: "Learns from player actions. Responds to the type of card played."
  },

  ice_corruptor: {
    id: "ice_corruptor",
    name: "Corruptor ICE",
    type: "sentry",
    tier: 2,
    maxHP: 55,
    intentPool: [
      { type: "attack", value: 9, weight: 40 },
      { type: "applyStatus", status: "vulnerable", stacks: 2, weight: 35 },
      { type: "applyStatus", status: "weak", stacks: 1, weight: 25 }
    ],
    aiLogic: function(gameState) {
      if (!gameState || !gameState.player || !gameState.player.statusEffects) {
        console.error('[iceDefinitions] ice_corruptor.aiLogic: Invalid gameState');
        return { type: "attack", value: 9 };
      }
      
      const hasVulnerable = gameState.player.statusEffects.some(effect => effect.type === 'vulnerable');
      const hasWeak = gameState.player.statusEffects.some(effect => effect.type === 'weak');
      
      if (hasVulnerable && hasWeak) {
        if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
          console.log('[iceDefinitions] ice_corruptor.aiLogic: Player fully debuffed, attacking');
        }
        return { type: "attack", value: 14 };
      }
      
      if (!hasVulnerable && Math.random() < 0.6) {
        if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
          console.log('[iceDefinitions] ice_corruptor.aiLogic: Applying vulnerable');
        }
        return { type: "applyStatus", status: "vulnerable", stacks: 2 };
      }
      
      if (!hasWeak && Math.random() < 0.5) {
        if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
          console.log('[iceDefinitions] ice_corruptor.aiLogic: Applying weak');
        }
        return { type: "applyStatus", status: "weak", stacks: 1 };
      }
      
      const selectedIntent = weightedRandom(
        this.intentPool.map(intent => ({ value: intent, weight: intent.weight }))
      );
      
      return selectedIntent || { type: "attack", value: 9 };
    },
    rewards: {
      credits: 48,
      cardChoices: 3,
      cardPool: "uncommon"
    },
    spriteKey: "ice_corruptor",
    description: "Debuff specialist. Applies vulnerable and weak, then exploits them."
  },

  // ============================================================================
  // ACT 3 ENEMIES - TIER 2 ELITE (2 enemies)
  // ============================================================================

  ice_enforcer: {
    id: "ice_enforcer",
    name: "Enforcer ICE",
    type: "sentry",
    tier: 2,
    maxHP: 80,
    intentPool: [
      { type: "attack", value: 15, weight: 45 },
      { type: "multiAttack", value: 7, hits: 2, weight: 30 },
      { type: "defend", value: 12, weight: 15 },
      { type: "trace", value: 10, weight: 10 }
    ],
    aiLogic: function(gameState) {
      if (!gameState || !gameState.enemy || !gameState.turn) {
        console.error('[iceDefinitions] ice_enforcer.aiLogic: Invalid gameState');
        return { type: "attack", value: 15 };
      }
      
      const turn = gameState.turn || 1;
      const pattern = turn % 3;
      
      if (pattern === 0) {
        if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
          console.log('[iceDefinitions] ice_enforcer.aiLogic: Pattern turn 0, multi-attack');
        }
        return { type: "multiAttack", value: 8, hits: 2 };
      } else if (pattern === 1) {
        if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
          console.log('[iceDefinitions] ice_enforcer.aiLogic: Pattern turn 1, heavy attack');
        }
        return { type: "attack", value: 18 };
      } else {
        if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
          console.log('[iceDefinitions] ice_enforcer.aiLogic: Pattern turn 2, defend');
        }
        return { type: "defend", value: 15 };
      }
    },
    rewards: {
      credits: 65,
      cardChoices: 3,
      cardPool: "uncommon"
    },
    spriteKey: "ice_striker",
    description: "Elite enforcer. Follows a 3-turn pattern: multi-attack, heavy attack, defend."
  },

  ice_phantom: {
    id: "ice_phantom",
    name: "Phantom ICE",
    type: "adaptive",
    tier: 2,
    maxHP: 70,
    intentPool: [
      { type: "attack", value: 10, weight: 40 },
      { type: "trace", value: 12, weight: 35 },
      { type: "applyStatus", status: "weak", stacks: 2, weight: 25 }
    ],
    aiLogic: function(gameState) {
      if (!gameState || !gameState.player || !gameState.enemy) {
        console.error('[iceDefinitions] ice_phantom.aiLogic: Invalid gameState');
        return { type: "attack", value: 10 };
      }
      
      const playerBlock = gameState.player.block || 0;
      const enemyHP = gameState.enemy.currentHP || 0;
      const enemyMaxHP = gameState.enemy.maxHP || 1;
      const hpPercent = enemyHP / enemyMaxHP;
      
      if (playerBlock > 10) {
        if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
          console.log('[iceDefinitions] ice_phantom.aiLogic: High player block, applying weak');
        }
        return { type: "applyStatus", status: "weak", stacks: 2 };
      }
      
      if (hpPercent < 0.4) {
        if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
          console.log('[iceDefinitions] ice_phantom.aiLogic: Low health, desperate trace attack');
        }
        return { type: "trace", value: 15 };
      }
      
      const selectedIntent = weightedRandom(
        this.intentPool.map(intent => ({ value: intent, weight: intent.weight }))
      );
      
      return selectedIntent || { type: "attack", value: 10 };
    },
    rewards: {
      credits: 70,
      cardChoices: 3,
      cardPool: "rare"
    },
    spriteKey: "ice_phantom",
    description: "Elusive elite. Adapts to player defenses and becomes desperate when wounded."
  },

  // ============================================================================
  // BOSS ENEMIES - TIER 3 (3 bosses)
  // ============================================================================

  // ============================================================================
  // ACT 3 ENEMIES - TIER 2 SCALED (2 enemies)
  // ============================================================================

  ice_warden: {
    id: "ice_warden",
    name: "Warden ICE",
    type: "firewall",
    tier: 3,
    maxHP: 75,
    intentPool: [
      { type: "attack", value: 16, weight: 50 },
      { type: "defend", value: 14, weight: 30 },
      { type: "trace", value: 12, weight: 20 }
    ],
    aiLogic: function(gameState) {
      if (!gameState || !gameState.enemy) {
        console.error('[iceDefinitions] ice_warden.aiLogic: Invalid gameState');
        return { type: "attack", value: 16 };
      }
      
      const enemyBlock = gameState.enemy.block || 0;
      
      if (enemyBlock > 15) {
        if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
          console.log('[iceDefinitions] ice_warden.aiLogic: High block, attacking');
        }
        return { type: "attack", value: 20 };
      }
      
      const selectedIntent = weightedRandom(
        this.intentPool.map(intent => ({ value: intent, weight: intent.weight }))
      );
      
      return selectedIntent || { type: "attack", value: 16 };
    },
    rewards: {
      credits: 68,
      cardChoices: 3,
      cardPool: "uncommon"
    },
    spriteKey: "ice_striker",
    description: "Act 3 heavy defender. Balances offense and defense."
  },

  ice_assassin: {
    id: "ice_assassin",
    name: "Assassin ICE",
    type: "sentry",
    tier: 3,
    maxHP: 65,
    intentPool: [
      { type: "attack", value: 18, weight: 60 },
      { type: "multiAttack", value: 9, hits: 2, weight: 30 },
      { type: "applyStatus", status: "vulnerable", stacks: 2, weight: 10 }
    ],
    aiLogic: function(gameState) {
      if (!gameState || !gameState.player) {
        console.error('[iceDefinitions] ice_assassin.aiLogic: Invalid gameState');
        return { type: "attack", value: 18 };
      }
      
      const playerBlock = gameState.player.block || 0;
      
      if (playerBlock < 5) {
        if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
          console.log('[iceDefinitions] ice_assassin.aiLogic: Low player block, multi-attack');
        }
        return { type: "multiAttack", value: 10, hits: 2 };
      }
      
      const selectedIntent = weightedRandom(
        this.intentPool.map(intent => ({ value: intent, weight: intent.weight }))
      );
      
      return selectedIntent || { type: "attack", value: 18 };
    },
    rewards: {
      credits: 72,
      cardChoices: 3,
      cardPool: "uncommon"
    },
    spriteKey: "ice_phantom",
    description: "Act 3 aggressive striker. Punishes low block with multi-attacks."
  },
  ice_firewall_boss: {
    id: "ice_firewall_boss",
    name: "Mega-Firewall",
    type: "boss",
    tier: 3,
    maxHP: 150,
    phases: [
      {
        hpThreshold: 100,
        intentPool: [
          { type: "attack", value: 15, weight: 70 },
          { type: "defend", value: 15, weight: 30 }
        ]
      },
      {
        hpThreshold: 50,
        intentPool: [
          { type: "attack", value: 20, weight: 50 },
          { type: "trace", value: 10, weight: 30 },
          { type: "applyStatus", status: "vulnerable", stacks: 2, weight: 20 }
        ]
      },
      {
        hpThreshold: 0,
        intentPool: [
          { type: "multiAttack", value: 10, hits: 3, weight: 60 },
          { type: "trace", value: 15, weight: 40 }
        ]
      }
    ],
    aiLogic: function(gameState) {
      if (!gameState || !gameState.enemy) {
        console.error('[iceDefinitions] ice_firewall_boss.aiLogic: Invalid gameState');
        return { type: "attack", value: 15 };
      }
      
      const currentHP = gameState.enemy.currentHP || 0;
      
      let currentPhase = null;
      for (let i = 0; i < this.phases.length; i++) {
        if (currentHP > this.phases[i].hpThreshold) {
          currentPhase = this.phases[i];
          break;
        }
      }
      
      if (!currentPhase) {
        currentPhase = this.phases[this.phases.length - 1];
      }
      
      if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
        console.log('[iceDefinitions] ice_firewall_boss.aiLogic: Current HP', currentHP, 'Phase threshold', currentPhase.hpThreshold);
      }
      
      const selectedIntent = weightedRandom(
        currentPhase.intentPool.map(intent => ({ value: intent, weight: intent.weight }))
      );
      
      if (!selectedIntent) {
        console.error('[iceDefinitions] ice_firewall_boss.aiLogic: weightedRandom failed');
        return { type: "attack", value: 15 };
      }
      
      return selectedIntent;
    },
    rewards: {
      credits: 100,
      cardChoices: 5,
      cardPool: "rare",
      guaranteedRelic: true
    },
    spriteKey: "ice_firewall_boss",
    description: "Act 1 Boss. Massive corporate firewall. Changes tactics as it weakens across 3 phases."
  },

  ice_overseer_boss: {
    id: "ice_overseer_boss",
    name: "Overseer Protocol",
    type: "boss",
    tier: 3,
    maxHP: 200,
    phases: [
      {
        hpThreshold: 140,
        intentPool: [
          { type: "attack", value: 18, weight: 50 },
          { type: "defend", value: 20, weight: 30 },
          { type: "trace", value: 8, weight: 20 }
        ]
      },
      {
        hpThreshold: 80,
        intentPool: [
          { type: "multiAttack", value: 12, hits: 2, weight: 45 },
          { type: "applyStatus", status: "vulnerable", stacks: 3, weight: 30 },
          { type: "trace", value: 12, weight: 25 }
        ]
      },
      {
        hpThreshold: 0,
        intentPool: [
          { type: "multiAttack", value: 15, hits: 2, weight: 50 },
          { type: "attack", value: 25, weight: 30 },
          { type: "trace", value: 20, weight: 20 }
        ]
      }
    ],
    aiLogic: function(gameState) {
      if (!gameState || !gameState.enemy || !gameState.turn) {
        console.error('[iceDefinitions] ice_overseer_boss.aiLogic: Invalid gameState');
        return { type: "attack", value: 18 };
      }
      
      const currentHP = gameState.enemy.currentHP || 0;
      const turn = gameState.turn || 1;
      
      let currentPhase = null;
      for (let i = 0; i < this.phases.length; i++) {
        if (currentHP > this.phases[i].hpThreshold) {
          currentPhase = this.phases[i];
          break;
        }
      }
      
      if (!currentPhase) {
        currentPhase = this.phases[this.phases.length - 1];
      }
      
      if (turn % 4 === 0 && currentHP < 100) {
        if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
          console.log('[iceDefinitions] ice_overseer_boss.aiLogic: Special every-4-turns massive attack');
        }
        return { type: "attack", value: 30 };
      }
      
      if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
        console.log('[iceDefinitions] ice_overseer_boss.aiLogic: Turn', turn, 'HP', currentHP, 'Phase threshold', currentPhase.hpThreshold);
      }
      
      const selectedIntent = weightedRandom(
        currentPhase.intentPool.map(intent => ({ value: intent, weight: intent.weight }))
      );
      
      return selectedIntent || { type: "attack", value: 18 };
    },
    rewards: {
      credits: 150,
      cardChoices: 5,
      cardPool: "rare",
      guaranteedRelic: true
    },
    spriteKey: "ice_overmind_boss",
    description: "Act 2 Boss. Advanced AI overseer. Multi-phase combat with special every-4-turns attack."
  },

  ice_sentinel_boss: {
    id: "ice_sentinel_boss",
    name: "Sentinel Prime",
    type: "boss",
    tier: 3,
    maxHP: 250,
    phases: [
      {
        hpThreshold: 188,
        intentPool: [
          { type: "attack", value: 20, weight: 60 },
          { type: "defend", value: 25, weight: 40 }
        ]
      },
      {
        hpThreshold: 125,
        intentPool: [
          { type: "multiAttack", value: 15, hits: 2, weight: 50 },
          { type: "applyStatus", status: "weak", stacks: 3, weight: 30 },
          { type: "defend", value: 20, weight: 20 }
        ]
      },
      {
        hpThreshold: 63,
        intentPool: [
          { type: "multiAttack", value: 18, hits: 2, weight: 45 },
          { type: "attack", value: 28, weight: 35 },
          { type: "trace", value: 18, weight: 20 }
        ]
      },
      {
        hpThreshold: 0,
        intentPool: [
          { type: "multiAttack", value: 20, hits: 3, weight: 60 },
          { type: "trace", value: 25, weight: 40 }
        ]
      }
    ],
    aiLogic: function(gameState) {
      if (!gameState || !gameState.enemy || !gameState.player || !gameState.turn) {
        console.error('[iceDefinitions] ice_sentinel_boss.aiLogic: Invalid gameState');
        return { type: "attack", value: 20 };
      }
      
      const currentHP = gameState.enemy.currentHP || 0;
      const turn = gameState.turn || 1;
      const playerTrace = gameState.player.currentTrace || 0;
      const maxTrace = gameState.player.maxTrace || 100;
      
      let currentPhase = null;
      for (let i = 0; i < this.phases.length; i++) {
        if (currentHP > this.phases[i].hpThreshold) {
          currentPhase = this.phases[i];
          break;
        }
      }
      
      if (!currentPhase) {
        currentPhase = this.phases[this.phases.length - 1];
      }
      
      if (playerTrace < maxTrace * 0.3 && currentHP < 125) {
        if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
          console.log('[iceDefinitions] ice_sentinel_boss.aiLogic: Player trace low, aggressive trace attack');
        }
        return { type: "trace", value: 22 };
      }
      
      if (turn % 5 === 0) {
        if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
          console.log('[iceDefinitions] ice_sentinel_boss.aiLogic: Turn', turn, 'special ultimate attack');
        }
        return { type: "multiAttack", value: 25, hits: 3 };
      }
      
      if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
        console.log('[iceDefinitions] ice_sentinel_boss.aiLogic: Turn', turn, 'HP', currentHP, 'Phase threshold', currentPhase.hpThreshold);
      }
      
      const selectedIntent = weightedRandom(
        currentPhase.intentPool.map(intent => ({ value: intent, weight: intent.weight }))
      );
      
      return selectedIntent || { type: "attack", value: 20 };
    },
    rewards: {
      credits: 200,
      cardChoices: 5,
      cardPool: "rare",
      guaranteedRelic: true
    },
    spriteKey: "ice_core_boss",
    description: "Act 3 Boss. Ultimate security sentinel. Four-phase combat with devastating attacks every 5 turns."
  }
};

console.log('[iceDefinitions] Validating ICE library...');

function validateICELibrary() {
  const errors = [];
  const warnings = [];
  
  const iceArray = Object.values(ICE_LIBRARY);
  
  if (iceArray.length < 11) {
    errors.push(`Insufficient ICE definitions: ${iceArray.length} (minimum 11 required)`);
  }
  
  iceArray.forEach((ice, index) => {
    if (!ice.id) errors.push(`ICE at index ${index} missing id`);
    if (!ice.name) errors.push(`ICE ${ice.id} missing name`);
    if (!ice.type) errors.push(`ICE ${ice.id} missing type`);
    if (typeof ice.tier !== 'number') errors.push(`ICE ${ice.id} missing or invalid tier`);
    if (typeof ice.maxHP !== 'number' || ice.maxHP <= 0) errors.push(`ICE ${ice.id} invalid maxHP: ${ice.maxHP}`);
    
    // Boss ICE use phases array instead of intentPool
    if (ice.type === 'boss') {
      if (!Array.isArray(ice.phases)) errors.push(`Boss ICE ${ice.id} missing phases array`);
    } else {
      if (!Array.isArray(ice.intentPool)) errors.push(`ICE ${ice.id} missing intentPool array`);
    }
    if (typeof ice.aiLogic !== 'function') errors.push(`ICE ${ice.id} missing aiLogic function`);
    if (!ice.rewards) errors.push(`ICE ${ice.id} missing rewards object`);
    if (!ice.spriteKey) errors.push(`ICE ${ice.id} missing spriteKey`);
    if (!ice.description) warnings.push(`ICE ${ice.id} missing description`);
    
    // Validate intentPool for regular ICE
    if (ice.type !== 'boss' && Array.isArray(ice.intentPool)) {
      if (ice.intentPool.length === 0) {
        errors.push(`ICE ${ice.id} has empty intentPool`);
      }
      
      ice.intentPool.forEach((intent, intentIndex) => {
        if (!intent.type) errors.push(`ICE ${ice.id} intent ${intentIndex} missing type`);
        if (typeof intent.weight !== 'number') errors.push(`ICE ${ice.id} intent ${intentIndex} invalid weight`);
        if (intent.type === 'attack' || intent.type === 'defend' || intent.type === 'trace') {
          if (typeof intent.value !== 'number') errors.push(`ICE ${ice.id} intent ${intentIndex} missing value`);
        }
      });
    }
    
    // Validate phases for boss ICE
    if (ice.type === 'boss' && Array.isArray(ice.phases)) {
      if (ice.phases.length === 0) {
        errors.push(`Boss ICE ${ice.id} has empty phases array`);
      }
      
      ice.phases.forEach((phase, phaseIndex) => {
        if (typeof phase.hpThreshold !== 'number') {
          errors.push(`Boss ICE ${ice.id} phase ${phaseIndex} missing hpThreshold`);
        }
        if (!Array.isArray(phase.intentPool)) {
          errors.push(`Boss ICE ${ice.id} phase ${phaseIndex} missing intentPool`);
        } else {
          phase.intentPool.forEach((intent, intentIndex) => {
            if (!intent.type) errors.push(`Boss ICE ${ice.id} phase ${phaseIndex} intent ${intentIndex} missing type`);
            if (typeof intent.weight !== 'number') errors.push(`Boss ICE ${ice.id} phase ${phaseIndex} intent ${intentIndex} invalid weight`);
          });
        }
      });
    }
    
    if (ice.rewards) {
      if (typeof ice.rewards.credits !== 'number') errors.push(`ICE ${ice.id} invalid rewards.credits`);
      if (typeof ice.rewards.cardChoices !== 'number') errors.push(`ICE ${ice.id} invalid rewards.cardChoices`);
      if (!ice.rewards.cardPool) errors.push(`ICE ${ice.id} missing rewards.cardPool`);
    }
  });
  
  if (errors.length > 0) {
    console.error('[iceDefinitions] ❌ Validation failed with', errors.length, 'errors:');
    errors.forEach(err => console.error(`  - ${err}`));
    throw new Error(`ICE library validation failed with ${errors.length} errors`);
  }
  
  if (warnings.length > 0) {
    console.warn('[iceDefinitions] ⚠️ Validation warnings:');
    warnings.forEach(warn => console.warn(`  - ${warn}`));
  }
  
  console.log('[iceDefinitions] ✅ Validation passed');
  console.log('[iceDefinitions] Total ICE definitions:', iceArray.length);
}

try {
  validateICELibrary();
} catch (error) {
  console.error('[iceDefinitions] CRITICAL ERROR during validation:', error);
  throw error;
}

export const ICE_BY_TIER = {
  tier1: Object.values(ICE_LIBRARY).filter(ice => ice.tier === 1 && ice.type !== 'boss'),
  tier2: Object.values(ICE_LIBRARY).filter(ice => ice.tier === 2 && ice.type !== 'boss'),
  tier3: Object.values(ICE_LIBRARY).filter(ice => ice.tier === 3 && ice.type !== 'boss')
};

export const BOSSES = Object.values(ICE_LIBRARY).filter(ice => ice.type === 'boss');

// ELITE ENEMIES: Separate pool for elite combat nodes
export const ELITE_ICE = {
  tier1: ['ice_barrier', 'ice_sentry'], // Act 1 elites
  tier2: ['ice_enforcer', 'ice_phantom', 'ice_adaptive'], // Act 2 elites
  tier3: ['ice_warden', 'ice_assassin', 'ice_corruptor'] // Act 3 elites
};

console.log('[iceDefinitions] ✅ Module loaded successfully');
console.log('[iceDefinitions] ICE by tier:', {
  tier1: ICE_BY_TIER.tier1.length,
  tier2: ICE_BY_TIER.tier2.length,
  bosses: BOSSES.length
});

export default ICE_LIBRARY;

// Export elite pools for MapGenerator
export { ELITE_ICE };