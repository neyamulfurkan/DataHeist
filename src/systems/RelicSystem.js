console.log('[RelicSystem] Loading RelicSystem singleton...');

import { GAME_CONFIG } from '../config.js';
import { RELIC_LIBRARY, getRelicById, getRelicsByTier } from '../data/relicDefinitions.js';
import Relic from '../entities/Relic.js';

class RelicSystem {
  static instance = null;

  constructor() {
    if (RelicSystem.instance) {
      console.log('[RelicSystem] Returning existing singleton instance');
      return RelicSystem.instance;
    }

    console.log('[RelicSystem] Creating new singleton instance');

    this.activeRelics = [];
    this.triggerHistory = [];

    RelicSystem.instance = this;
    console.log('[RelicSystem] Singleton instance created successfully');
  }

  setRelics(relics) {
    if (!Array.isArray(relics)) {
      console.error('[RelicSystem] setRelics: Invalid relics array:', relics);
      return;
    }

    this.activeRelics = relics.map(r => {
      if (r instanceof Relic) {
        return r;
      }
      if (typeof r === 'object' && r.id) {
        return Relic.fromJSON(r);
      }
      if (typeof r === 'string') {
        return new Relic(r);
      }
      console.error('[RelicSystem] setRelics: Invalid relic:', r);
      return null;
    }).filter(r => r !== null);

    console.log('[RelicSystem] setRelics: Active relics set:', this.activeRelics.length);
  }

  trigger(triggerType, context = {}) {
    if (!triggerType || typeof triggerType !== 'string') {
      console.error('[RelicSystem] trigger: Invalid triggerType:', triggerType);
      return [];
    }

    const triggeredEffects = [];

    this.activeRelics.forEach(relic => {
      if (relic.hasTrigger(triggerType)) {
        const effects = relic.trigger(triggerType, context);
        if (effects) {
          // DON'T apply here - let BattleScene handle application
          // This prevents double-application bugs
          
          triggeredEffects.push({
            relicId: relic.id,
            relicName: relic.name,
            effects: effects
          });
        }
      }
    });

    if (triggeredEffects.length > 0) {
      this.triggerHistory.push({
        trigger: triggerType,
        timestamp: Date.now(),
        relicsTriggered: triggeredEffects.length
      });

      console.log('[RelicSystem] trigger: Triggered', triggeredEffects.length, 'relics for', triggerType);
    }

    return triggeredEffects;
  }

  /**
   * Apply relic effects to game state
   * @param {Object} effects - Effects object from relic
   * @param {string} triggerType - When this triggered
   * @param {Object} context - Game state context
   * @private
   */
  _applyRelicEffects(effects, triggerType, context) {
    if (!effects || !context.gameState) {
      return;
    }

    const gameState = context.gameState;
    const player = gameState.player;
    const enemy = gameState.enemy;

    // Apply effects based on trigger type
    switch (triggerType) {
      case 'onCombatStart':
        if (effects.bonusStartingCPU > 0) {
          player.maxCPU += effects.bonusStartingCPU;
          player.currentCPU = player.maxCPU;
          console.log('[RelicSystem] Applied bonusStartingCPU:', effects.bonusStartingCPU);
        }
        if (effects.maxTraceIncrease > 0) {
          player.maxTrace += effects.maxTraceIncrease;
          console.log('[RelicSystem] Applied maxTraceIncrease:', effects.maxTraceIncrease);
        }
        if (effects.startingBlock > 0) {
          player.gainBlock(effects.startingBlock, 'relic:ghost_protocol');
          console.log('[RelicSystem] Applied startingBlock:', effects.startingBlock);
        }
        if (effects.upgradeRandomCard > 0) {
          const deck = player.deck.getAllCards();
          const upgradeableCards = deck.filter(c => c.upgradeLevel < 1);
          if (upgradeableCards.length > 0) {
            const randomIndex = Math.floor(Math.random() * upgradeableCards.length);
            upgradeableCards[randomIndex].upgrade();
            console.log('[RelicSystem] Applied upgradeRandomCard');
          }
        }
        break;

      case 'onTurnStart':
        if (effects.traceReductionPerTurn > 0) {
          player.modifyTrace(-effects.traceReductionPerTurn, 'relic:stealth_module');
          console.log('[RelicSystem] Applied traceReductionPerTurn:', effects.traceReductionPerTurn);
        }
        if (effects.bonusCardsPerTurn > 0) {
          const bonusCards = player.deck.draw(effects.bonusCardsPerTurn);
          console.log('[RelicSystem] Applied bonusCardsPerTurn:', bonusCards.length);
        }
        break;

      case 'onDamageDealt':
        if (effects.damageBonus > 0 && context.damage) {
          context.damage += effects.damageBonus;
          console.log('[RelicSystem] Applied damageBonus:', effects.damageBonus);
        }
        break;

      case 'onBlockGained':
        if (effects.blockBonus > 0 && context.block) {
          context.block += effects.blockBonus;
          console.log('[RelicSystem] Applied blockBonus:', effects.blockBonus);
        }
        break;

      case 'onCombatEnd':
        if (effects.creditsPerCombat > 0 && gameState.runData) {
          gameState.runData.credits += effects.creditsPerCombat;
          console.log('[RelicSystem] Applied creditsPerCombat:', effects.creditsPerCombat);
        }
        if (effects.traceHealPerCombat > 0) {
          player.modifyTrace(-effects.traceHealPerCombat, 'relic:trace_eraser');
          console.log('[RelicSystem] Applied traceHealPerCombat:', effects.traceHealPerCombat);
        }
        break;

      case 'onTurnEnd':
        if (effects.retainRandomCards > 0 && player.deck.hand.length > 0) {
          const hand = player.deck.hand;
          for (let i = 0; i < Math.min(effects.retainRandomCards, hand.length); i++) {
            const randomIndex = Math.floor(Math.random() * hand.length);
            const cardToRetain = hand[randomIndex];
            if (cardToRetain && !cardToRetain.keywords.includes('retain')) {
              cardToRetain.keywords.push('retain');
              console.log('[RelicSystem] Applied retainRandomCards to:', cardToRetain.name);
            }
          }
        }
        if (effects.traceIncreasePerTurn > 0) {
          player.modifyTrace(effects.traceIncreasePerTurn, 'relic:overclocking_chip');
          console.log('[RelicSystem] Applied traceIncreasePerTurn:', effects.traceIncreasePerTurn);
        }
        break;

      case 'onCardPlay':
        // Special effects like firstCardFree, duplicateFirstCard are handled in CombatSystem
        // because they need specific game logic context
        break;

      case 'onCardCostCalculation':
        // Handled in CombatSystem during cost calculation
        break;
    }
  }

  getAggregatedEffects() {
    const aggregated = {
      bonusStartingCPU: 0,
      maxTraceIncrease: 0,
      traceReductionPerTurn: 0,
      traceIncreasePerTurn: 0,
      damageBonus: 0,
      blockBonus: 0,
      creditsPerCombat: 0,
      bonusCardsPerTurn: 0,
      retainRandomCards: 0,
      startingBlock: 0,
      firstCardFree: false,
      firstCardCostReduction: 0,
      upgradeRandomCard: 0,
      traceHealPerCombat: 0,
      duplicateFirstCard: false,
      exploitCostReduction: 0
    };

    this.activeRelics.forEach(relic => {
      Object.keys(relic.effects).forEach(key => {
        const value = relic.effects[key];
        if (typeof value === 'number') {
          aggregated[key] = (aggregated[key] || 0) + value;
        } else if (typeof value === 'boolean') {
          aggregated[key] = aggregated[key] || value;
        }
      });
    });

    return aggregated;
  }

  hasRelic(relicId) {
    return this.activeRelics.some(r => r.id === relicId);
  }

  getRelicByTrigger(triggerType) {
    return this.activeRelics.filter(r => r.hasTrigger(triggerType));
  }

  clear() {
    this.activeRelics = [];
    this.triggerHistory = [];
    console.log('[RelicSystem] clear: All relics cleared');
  }

  getStats() {
    return {
      activeRelics: this.activeRelics.length,
      totalTriggers: this.triggerHistory.length,
      relicNames: this.activeRelics.map(r => r.name)
    };
  }
}

const relicSystem = new RelicSystem();

console.log('[RelicSystem] ✅ RelicSystem singleton loaded successfully');

export default relicSystem;