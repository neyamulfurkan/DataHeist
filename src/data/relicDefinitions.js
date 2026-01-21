console.log('[relicDefinitions.js] Loading relic library...');

import { GAME_CONFIG } from '../config.js';

export const RELIC_LIBRARY = {
  relic_stealth_module: {
    id: 'relic_stealth_module',
    name: 'Stealth Module',
    description: 'Reduce Trace by 2 at the end of combat (only if you took damage this turn).',
    tier: 'base',
    spriteKey: 'relic_stealth_module',
    effects: {
      traceReductionPerTurn: 2,
      requiresDamageTaken: true
    },
    triggers: ['onTurnEnd']
  },

  relic_execution_cache: {
    id: 'relic_execution_cache',
    name: 'Execution Cache',
    description: 'The first card you play each combat costs 1 less CPU (minimum 0).',
    tier: 'base',
    spriteKey: 'relic_execution_cache',
    effects: {
      firstCardCostReduction: 1,
      oncePerCombat: true
    },
    triggers: ['onCardPlay']
  },

  relic_trace_buffer: {
    id: 'relic_trace_buffer',
    name: 'Trace Buffer',
    description: 'Increase max Trace by 20.',
    tier: 'base',
    spriteKey: 'relic_trace_buffer',
    effects: {
      maxTraceIncrease: 20
    },
    triggers: ['onCombatStart']
  },

  relic_exploit_amplifier: {
    id: 'relic_exploit_amplifier',
    name: 'Exploit Amplifier',
    description: 'Deal +2 damage with all attacks. Gain +1 Trace per attack.',
    tier: 'base',
    spriteKey: 'relic_exploit_amplifier',
    effects: {
      damageBonus: 2,
      traceIncreasePerAttack: 1
    },
    triggers: ['onDamageDealt']
  },

  relic_defense_matrix: {
    id: 'relic_defense_matrix',
    name: 'Defense Matrix',
    description: 'Gain +1 Block with all Defense cards.',
    tier: 'base',
    spriteKey: 'relic_defense_matrix',
    effects: {
      blockBonus: 1
    },
    triggers: ['onBlockGained']
  },

  relic_data_siphon: {
    id: 'relic_data_siphon',
    name: 'Data Siphon',
    description: 'Gain 10 credits after each combat.',
    tier: 'advanced',
    spriteKey: 'relic_data_siphon',
    effects: {
      creditsPerCombat: 10
    },
    triggers: ['onCombatEnd']
  },

  relic_overclocking_chip: {
    id: 'relic_overclocking_chip',
    name: 'Overclocking Chip',
    description: 'Gain +1 max CPU permanently. Increase Trace by 5 each turn.',
    tier: 'elite',
    spriteKey: 'relic_overclocking_chip',
    effects: {
      bonusStartingCPU: 1,
      traceIncreasePerTurn: 5
    },
    triggers: ['onCombatStart', 'onTurnEnd']
  },

  relic_neural_link: {
    id: 'relic_neural_link',
    name: 'Neural Link',
    description: 'Draw 1 extra card at start of turn. Discard 1 random card at end of turn.',
    tier: 'advanced',
    spriteKey: 'relic_neural_link',
    effects: {
      bonusCardsPerTurn: 1,
      randomDiscardPerTurn: 1
    },
    triggers: ['onTurnStart', 'onTurnEnd']
  },

  relic_quantum_cache: {
    id: 'relic_quantum_cache',
    name: 'Quantum Cache',
    description: 'Retain 1 random card at end of turn.',
    tier: 'advanced',
    spriteKey: 'relic_quantum_cache',
    effects: {
      retainRandomCards: 1
    },
    triggers: ['onTurnEnd']
  },

  relic_ghost_protocol: {
    id: 'relic_ghost_protocol',
    name: 'Ghost Protocol',
    description: 'Start each combat with 5 Block.',
    tier: 'elite',
    spriteKey: 'relic_ghost_protocol',
    effects: {
      startingBlock: 5
    },
    triggers: ['onCombatStart']
  },

  relic_system_backdoor: {
    id: 'relic_system_backdoor',
    name: 'System Backdoor',
    description: 'First card each combat costs 0.',
    tier: 'elite',
    spriteKey: 'relic_system_backdoor',
    effects: {
      firstCardFree: true
    },
    triggers: ['onCardPlay']
  },

  relic_ai_companion: {
    id: 'relic_ai_companion',
    name: 'AI Companion',
    description: 'Upgrade 1 random card at start of each combat.',
    tier: 'elite',
    spriteKey: 'relic_ai_companion',
    effects: {
      upgradeRandomCard: 1
    },
    triggers: ['onCombatStart']
  },

  relic_trace_eraser: {
    id: 'relic_trace_eraser',
    name: 'Trace Eraser',
    description: 'Heal 5 Trace after each combat.',
    tier: 'elite',
    spriteKey: 'relic_trace_eraser',
    effects: {
      traceHealPerCombat: 5
    },
    triggers: ['onCombatEnd']
  },

  relic_memory_core: {
    id: 'relic_memory_core',
    name: 'Memory Core',
    description: 'Duplicate the first card you play each combat.',
    tier: 'elite',
    spriteKey: 'relic_memory_core',
    effects: {
      duplicateFirstCard: true
    },
    triggers: ['onCardPlay']
  },

  relic_exploit_framework: {
    id: 'relic_exploit_framework',
    name: 'Exploit Framework',
    description: 'All Exploit cards cost 1 less CPU (minimum 0).',
    tier: 'elite',
    spriteKey: 'relic_exploit_framework',
    effects: {
      exploitCostReduction: 1
    },
    triggers: ['onCardCostCalculation']
  }
};

export const RELICS_BY_TIER = {
  base: Object.values(RELIC_LIBRARY).filter(r => r.tier === 'base'),
  advanced: Object.values(RELIC_LIBRARY).filter(r => r.tier === 'advanced'),
  elite: Object.values(RELIC_LIBRARY).filter(r => r.tier === 'elite')
};

export function getRelicById(relicId) {
  if (!relicId || typeof relicId !== 'string') {
    console.error('[relicDefinitions.js] getRelicById: Invalid relicId:', relicId);
    return null;
  }

  const relic = RELIC_LIBRARY[relicId];
  if (!relic) {
    console.warn('[relicDefinitions.js] getRelicById: Relic not found:', relicId);
    return null;
  }

  return relic;
}

export function getRelicsByTier(tier) {
  if (!RELICS_BY_TIER[tier]) {
    console.error('[relicDefinitions.js] getRelicsByTier: Invalid tier:', tier);
    return [];
  }

  return RELICS_BY_TIER[tier];
}

console.log('[relicDefinitions.js] ✅ Module loaded successfully');
console.log('[relicDefinitions.js] Total relics:', Object.keys(RELIC_LIBRARY).length);
console.log('[relicDefinitions.js] By tier:', {
  base: RELICS_BY_TIER.base.length,
  advanced: RELICS_BY_TIER.advanced.length,
  elite: RELICS_BY_TIER.elite.length
});

export default RELIC_LIBRARY;