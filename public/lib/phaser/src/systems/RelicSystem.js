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

  getAggregatedEffects() {
    const aggregated = {
      bonusStartingCPU: 0,
      maxTraceIncrease: 0,
      traceReductionPerTurn: 0,
      damageBonus: 0,
      blockBonus: 0,
      creditsPerCombat: 0,
      bonusCardsPerTurn: 0,
      retainRandomCards: 0,
      startingBlock: 0,
      firstCardFree: false,
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