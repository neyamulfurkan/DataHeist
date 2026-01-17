import { GAME_CONFIG } from '../config.js';

console.log('[Effect.js] Initializing status effect system...');

export const STATUS_EFFECTS = {
  strength: {
    id: 'strength',
    name: 'Strength',
    description: 'Increase damage dealt by 2 per stack',
    type: 'buff',
    defaultDuration: -1,
    icon: 'icon_strength',
    color: 0xff6b6b,
    stackable: true,
    tickBehavior: null
  },
  
  weak: {
    id: 'weak',
    name: 'Weak',
    description: 'Deal 25% less damage',
    type: 'debuff',
    defaultDuration: 2,
    icon: 'icon_weak',
    color: 0x95a5a6,
    stackable: false,
    tickBehavior: null
  },
  
  vulnerable: {
    id: 'vulnerable',
    name: 'Vulnerable',
    description: 'Take 50% more damage',
    type: 'debuff',
    defaultDuration: 2,
    icon: 'icon_vulnerable',
    color: 0xe74c3c,
    stackable: false,
    tickBehavior: null
  },
  
  poison: {
    id: 'poison',
    name: 'Poison',
    description: 'Lose HP at end of turn',
    type: 'debuff',
    defaultDuration: -1,
    icon: 'icon_poison',
    color: 0x2ecc71,
    stackable: true,
    tickBehavior: 'damage',
    tickValue: 3
  },
  
  regen: {
    id: 'regen',
    name: 'Regen',
    description: 'Restore HP at end of turn',
    type: 'buff',
    defaultDuration: -1,
    icon: 'icon_regen',
    color: 0x3498db,
    stackable: true,
    tickBehavior: 'heal',
    tickValue: 2
  },
  
  frail: {
    id: 'frail',
    name: 'Frail',
    description: 'Gain 25% less Block',
    type: 'debuff',
    defaultDuration: 2,
    icon: 'icon_frail',
    color: 0x95a5a6,
    stackable: false,
    tickBehavior: null
  },

  dexterity: {
    id: 'dexterity',
    name: 'Dexterity',
    description: 'Gain 2 additional Block per stack',
    type: 'buff',
    defaultDuration: -1,
    icon: 'icon_dexterity',
    color: 0x00f0ff,
    stackable: true,
    tickBehavior: null
  },

  burn: {
    id: 'burn',
    name: 'Burn',
    description: 'Lose HP at end of turn, decreases by 1 each turn',
    type: 'debuff',
    defaultDuration: -1,
    icon: 'icon_burn',
    color: 0xff6600,
    stackable: true,
    tickBehavior: 'damage_decay',
    tickValue: 2
  }
};

export function createEffect(type, stacks = 1, duration = null) {
  if (!type || typeof type !== 'string') {
    console.error('[Effect] createEffect: Invalid type parameter', { type, typeOf: typeof type });
    return null;
  }

  const effectDef = STATUS_EFFECTS[type];
  
  if (!effectDef) {
    console.error('[Effect] createEffect: Unknown effect type', { type, availableTypes: Object.keys(STATUS_EFFECTS) });
    return null;
  }

  if (typeof stacks !== 'number' || stacks < 1) {
    console.error('[Effect] createEffect: Invalid stacks value', { type, stacks, stacksType: typeof stacks });
    return null;
  }

  const finalStacks = Math.min(Math.floor(stacks), GAME_CONFIG.GAMEPLAY.MAX_STATUS_STACKS);
  
  if (finalStacks !== stacks) {
    console.warn('[Effect] createEffect: Stacks clamped to max', { 
      type, 
      requestedStacks: stacks, 
      finalStacks,
      maxAllowed: GAME_CONFIG.GAMEPLAY.MAX_STATUS_STACKS 
    });
  }

  const finalDuration = duration !== null ? duration : effectDef.defaultDuration;
  
  if (finalDuration !== -1 && (typeof finalDuration !== 'number' || finalDuration < 0)) {
    console.error('[Effect] createEffect: Invalid duration', { 
      type, 
      duration: finalDuration, 
      durationType: typeof finalDuration 
    });
    return null;
  }

  const effect = {
    type: effectDef.id,
    name: effectDef.name,
    description: effectDef.description,
    stacks: finalStacks,
    duration: finalDuration,
    icon: effectDef.icon,
    color: effectDef.color,
    effectType: effectDef.type,
    stackable: effectDef.stackable,
    tickBehavior: effectDef.tickBehavior,
    tickValue: effectDef.tickValue || 0
  };

  console.log('[Effect] createEffect: Created effect', {
    type: effect.type,
    stacks: effect.stacks,
    duration: effect.duration,
    tickBehavior: effect.tickBehavior
  });

  return effect;
}

export function applyEffectToArray(effectsArray, newEffect) {
  if (!Array.isArray(effectsArray)) {
    console.error('[Effect] applyEffectToArray: effectsArray must be an array', { 
      effectsArray, 
      type: typeof effectsArray 
    });
    return [];
  }

  if (!newEffect || !newEffect.type) {
    console.error('[Effect] applyEffectToArray: Invalid effect object', { newEffect });
    return [...effectsArray];
  }

  const effectDef = STATUS_EFFECTS[newEffect.type];
  
  if (!effectDef) {
    console.error('[Effect] applyEffectToArray: Unknown effect type in newEffect', { 
      type: newEffect.type,
      availableTypes: Object.keys(STATUS_EFFECTS)
    });
    return [...effectsArray];
  }

  const existingIndex = effectsArray.findIndex(e => e.type === newEffect.type);

  if (existingIndex === -1) {
    console.log('[Effect] applyEffectToArray: Adding new effect', {
      type: newEffect.type,
      stacks: newEffect.stacks,
      duration: newEffect.duration,
      arrayLengthBefore: effectsArray.length
    });
    
    return [...effectsArray, { ...newEffect }];
  }

  const updatedArray = [...effectsArray];
  const existing = { ...updatedArray[existingIndex] };

  if (effectDef.stackable) {
    const newStacks = existing.stacks + newEffect.stacks;
    const clampedStacks = Math.min(newStacks, GAME_CONFIG.GAMEPLAY.MAX_STATUS_STACKS);
    
    if (clampedStacks !== newStacks) {
      console.warn('[Effect] applyEffectToArray: Stacks clamped to maximum', {
        type: newEffect.type,
        existingStacks: existing.stacks,
        addedStacks: newEffect.stacks,
        resultBeforeClamp: newStacks,
        finalStacks: clampedStacks,
        maxAllowed: GAME_CONFIG.GAMEPLAY.MAX_STATUS_STACKS
      });
    }

    existing.stacks = clampedStacks;
    
    console.log('[Effect] applyEffectToArray: Increased stackable effect', {
      type: existing.type,
      previousStacks: updatedArray[existingIndex].stacks,
      addedStacks: newEffect.stacks,
      newStacks: existing.stacks
    });
  } else {
    if (newEffect.duration === -1 || existing.duration === -1) {
      existing.duration = -1;
    } else {
      existing.duration = Math.max(existing.duration, newEffect.duration);
    }
    
    console.log('[Effect] applyEffectToArray: Extended non-stackable effect duration', {
      type: existing.type,
      previousDuration: updatedArray[existingIndex].duration,
      newDuration: newEffect.duration,
      finalDuration: existing.duration
    });
  }

  updatedArray[existingIndex] = existing;
  return updatedArray;
}

export function tickEffects(effectsArray, target = null) {
  if (!Array.isArray(effectsArray)) {
    console.error('[Effect] tickEffects: effectsArray must be an array', { 
      effectsArray, 
      type: typeof effectsArray 
    });
    return {
      remainingEffects: [],
      tickResults: []
    };
  }

  if (effectsArray.length === 0) {
    console.log('[Effect] tickEffects: No effects to tick');
    return {
      remainingEffects: [],
      tickResults: []
    };
  }

  console.log('[Effect] tickEffects: Processing effects', {
    effectCount: effectsArray.length,
    effects: effectsArray.map(e => ({ type: e.type, stacks: e.stacks, duration: e.duration })),
    targetProvided: !!target
  });

  const tickResults = [];
  const processedEffects = [];

  for (let i = 0; i < effectsArray.length; i++) {
    const effect = { ...effectsArray[i] };
    let shouldRemove = false;

    if (effect.tickBehavior) {
      const behaviorResult = executeTickBehavior(effect, target);
      
      if (behaviorResult) {
        tickResults.push(behaviorResult);
        console.log('[Effect] tickEffects: Executed tick behavior', {
          type: effect.type,
          behavior: effect.tickBehavior,
          result: behaviorResult
        });
      }
    }

    if (effect.duration !== -1) {
      effect.duration = Math.max(0, effect.duration - 1);
      
      console.log('[Effect] tickEffects: Decremented duration', {
        type: effect.type,
        previousDuration: effectsArray[i].duration,
        newDuration: effect.duration
      });

      if (effect.duration === 0) {
        shouldRemove = true;
        console.log('[Effect] tickEffects: Effect expired', {
          type: effect.type,
          finalStacks: effect.stacks
        });
      }
    }

    if (effect.tickBehavior === 'damage_decay' && effect.stacks > 0) {
      effect.stacks = Math.max(0, effect.stacks - 1);
      
      console.log('[Effect] tickEffects: Decayed stacks for burn effect', {
        type: effect.type,
        previousStacks: effectsArray[i].stacks,
        newStacks: effect.stacks
      });

      if (effect.stacks === 0) {
        shouldRemove = true;
        console.log('[Effect] tickEffects: Burn effect depleted', { type: effect.type });
      }
    }

    if (!shouldRemove) {
      processedEffects.push(effect);
    }
  }

  console.log('[Effect] tickEffects: Tick complete', {
    initialCount: effectsArray.length,
    remainingCount: processedEffects.length,
    removedCount: effectsArray.length - processedEffects.length,
    tickResultsCount: tickResults.length
  });

  return {
    remainingEffects: processedEffects,
    tickResults: tickResults
  };
}

function executeTickBehavior(effect, target) {
  if (!effect.tickBehavior) {
    return null;
  }

  const behaviorType = effect.tickBehavior;
  const value = effect.tickValue || 0;
  const totalValue = value * effect.stacks;

  console.log('[Effect] executeTickBehavior: Processing', {
    type: effect.type,
    behavior: behaviorType,
    valuePerStack: value,
    stacks: effect.stacks,
    totalValue: totalValue,
    targetProvided: !!target
  });

  switch (behaviorType) {
    case 'damage':
      return {
        type: 'poison',
        behavior: 'damage',
        value: totalValue,
        effectType: effect.type,
        stacks: effect.stacks
      };

    case 'heal':
      return {
        type: 'regen',
        behavior: 'heal',
        value: totalValue,
        effectType: effect.type,
        stacks: effect.stacks
      };

    case 'damage_decay':
      return {
        type: 'burn',
        behavior: 'damage',
        value: totalValue,
        effectType: effect.type,
        stacks: effect.stacks
      };

    default:
      console.warn('[Effect] executeTickBehavior: Unknown tick behavior', {
        type: effect.type,
        behavior: behaviorType
      });
      return null;
  }
}

export function removeEffect(effectsArray, type, stacksToRemove = null) {
  if (!Array.isArray(effectsArray)) {
    console.error('[Effect] removeEffect: effectsArray must be an array', { 
      effectsArray, 
      arrayType: typeof effectsArray 
    });
    return [];
  }

  if (!type || typeof type !== 'string') {
    console.error('[Effect] removeEffect: Invalid type parameter', { type, typeOf: typeof type });
    return [...effectsArray];
  }

  const existingIndex = effectsArray.findIndex(e => e.type === type);

  if (existingIndex === -1) {
    console.warn('[Effect] removeEffect: Effect not found in array', {
      type,
      currentEffects: effectsArray.map(e => e.type)
    });
    return [...effectsArray];
  }

  const updatedArray = [...effectsArray];

  if (stacksToRemove === null) {
    console.log('[Effect] removeEffect: Removing entire effect', {
      type,
      removedStacks: updatedArray[existingIndex].stacks,
      arrayLengthBefore: updatedArray.length
    });
    
    updatedArray.splice(existingIndex, 1);
    
    console.log('[Effect] removeEffect: Effect removed', {
      type,
      arrayLengthAfter: updatedArray.length
    });
    
    return updatedArray;
  }

  if (typeof stacksToRemove !== 'number' || stacksToRemove < 1) {
    console.error('[Effect] removeEffect: Invalid stacksToRemove', {
      type,
      stacksToRemove,
      stacksType: typeof stacksToRemove
    });
    return [...effectsArray];
  }

  const effect = { ...updatedArray[existingIndex] };
  const originalStacks = effect.stacks;

  effect.stacks = Math.max(0, effect.stacks - stacksToRemove);

  console.log('[Effect] removeEffect: Reduced effect stacks', {
    type,
    originalStacks,
    stacksToRemove,
    newStacks: effect.stacks
  });

  if (effect.stacks === 0) {
    console.log('[Effect] removeEffect: Effect depleted, removing from array', { type });
    updatedArray.splice(existingIndex, 1);
  } else {
    updatedArray[existingIndex] = effect;
  }

  return updatedArray;
}

export function getEffectMultipliers(effectsArray) {
  if (!Array.isArray(effectsArray)) {
    console.error('[Effect] getEffectMultipliers: effectsArray must be an array', { 
      effectsArray, 
      type: typeof effectsArray 
    });
    return {
      damageMultiplier: 1.0,
      damageTakenMultiplier: 1.0,
      blockMultiplier: 1.0,
      strengthBonus: 0,
      dexterityBonus: 0
    };
  }

  if (effectsArray.length === 0) {
    return {
      damageMultiplier: 1.0,
      damageTakenMultiplier: 1.0,
      blockMultiplier: 1.0,
      strengthBonus: 0,
      dexterityBonus: 0
    };
  }

  let damageMultiplier = 1.0;
  let damageTakenMultiplier = 1.0;
  let blockMultiplier = 1.0;
  let strengthBonus = 0;
  let dexterityBonus = 0;

  console.log('[Effect] getEffectMultipliers: Calculating multipliers', {
    effectCount: effectsArray.length,
    effects: effectsArray.map(e => ({ type: e.type, stacks: e.stacks }))
  });

  for (const effect of effectsArray) {
    switch (effect.type) {
      case 'strength':
        strengthBonus += effect.stacks * GAME_CONFIG.COMBAT.STRENGTH_BONUS_PER_STACK;
        console.log('[Effect] getEffectMultipliers: Applied strength', {
          stacks: effect.stacks,
          bonusPerStack: GAME_CONFIG.COMBAT.STRENGTH_BONUS_PER_STACK,
          totalBonus: strengthBonus
        });
        break;

      case 'weak':
        damageMultiplier *= GAME_CONFIG.COMBAT.WEAK_MULTIPLIER;
        console.log('[Effect] getEffectMultipliers: Applied weak', {
          multiplier: GAME_CONFIG.COMBAT.WEAK_MULTIPLIER,
          currentDamageMultiplier: damageMultiplier
        });
        break;

      case 'vulnerable':
        damageTakenMultiplier *= GAME_CONFIG.COMBAT.VULNERABLE_MULTIPLIER;
        console.log('[Effect] getEffectMultipliers: Applied vulnerable', {
          multiplier: GAME_CONFIG.COMBAT.VULNERABLE_MULTIPLIER,
          currentDamageTakenMultiplier: damageTakenMultiplier
        });
        break;

      case 'frail':
        blockMultiplier *= 0.75;
        console.log('[Effect] getEffectMultipliers: Applied frail', {
          multiplier: 0.75,
          currentBlockMultiplier: blockMultiplier
        });
        break;

      case 'dexterity':
        dexterityBonus += effect.stacks * GAME_CONFIG.COMBAT.DEXTERITY_BLOCK_BONUS_PER_STACK;
        console.log('[Effect] getEffectMultipliers: Applied dexterity', {
          stacks: effect.stacks,
          bonusPerStack: GAME_CONFIG.COMBAT.DEXTERITY_BLOCK_BONUS_PER_STACK,
          totalBonus: dexterityBonus
        });
        break;

      default:
        break;
    }
  }

  const result = {
    damageMultiplier,
    damageTakenMultiplier,
    blockMultiplier,
    strengthBonus,
    dexterityBonus
  };

  console.log('[Effect] getEffectMultipliers: Final multipliers', result);

  return result;
}

export function getEffectDescription(effect) {
  if (!effect || !effect.type) {
    console.error('[Effect] getEffectDescription: Invalid effect object', { effect });
    return 'Unknown Effect';
  }

  const effectDef = STATUS_EFFECTS[effect.type];
  
  if (!effectDef) {
    console.error('[Effect] getEffectDescription: Unknown effect type', { 
      type: effect.type,
      availableTypes: Object.keys(STATUS_EFFECTS)
    });
    return `${effect.type} (Unknown)`;
  }

  let description = effect.name || effectDef.name;

  if (effectDef.stackable && effect.stacks > 1) {
    description += ` (${effect.stacks})`;
  }

  if (effect.duration !== -1) {
    const turnText = effect.duration === 1 ? 'turn' : 'turns';
    description += ` (${effect.duration} ${turnText})`;
  }

  description += `: ${effectDef.description}`;

  if (effectDef.stackable) {
    switch (effect.type) {
      case 'strength':
        const strengthBonus = effect.stacks * GAME_CONFIG.COMBAT.STRENGTH_BONUS_PER_STACK;
        description = description.replace('2 per stack', `${strengthBonus} total`);
        break;

      case 'dexterity':
        const dexBonus = effect.stacks * GAME_CONFIG.COMBAT.DEXTERITY_BLOCK_BONUS_PER_STACK;
        description = description.replace('2 additional Block per stack', `${dexBonus} total additional Block`);
        break;

      case 'poison':
        const poisonDamage = effect.stacks * (effectDef.tickValue || 0);
        description = description.replace('Lose HP at end of turn', `Lose ${poisonDamage} HP at end of turn`);
        break;

      case 'regen':
        const regenHeal = effect.stacks * (effectDef.tickValue || 0);
        description = description.replace('Restore HP at end of turn', `Restore ${regenHeal} HP at end of turn`);
        break;

      case 'burn':
        const burnDamage = effect.stacks * (effectDef.tickValue || 0);
        description = description.replace('Lose HP at end of turn, decreases by 1 each turn', 
          `Lose ${burnDamage} HP at end of turn, decreases by 1 each turn`);
        break;

      default:
        break;
    }
  }

  console.log('[Effect] getEffectDescription: Generated description', {
    type: effect.type,
    stacks: effect.stacks,
    duration: effect.duration,
    description
  });

  return description;
}

export function getEffectIcon(type) {
  if (!type || typeof type !== 'string') {
    console.error('[Effect] getEffectIcon: Invalid type parameter', { type, typeOf: typeof type });
    return 'icon_unknown';
  }

  const effectDef = STATUS_EFFECTS[type];
  
  if (!effectDef) {
    console.warn('[Effect] getEffectIcon: Unknown effect type', { 
      type,
      availableTypes: Object.keys(STATUS_EFFECTS)
    });
    return 'icon_unknown';
  }

  return effectDef.icon;
}

export function getEffectColor(type) {
  if (!type || typeof type !== 'string') {
    console.error('[Effect] getEffectColor: Invalid type parameter', { type, typeOf: typeof type });
    return 0xffffff;
  }

  const effectDef = STATUS_EFFECTS[type];
  
  if (!effectDef) {
    console.warn('[Effect] getEffectColor: Unknown effect type', { 
      type,
      availableTypes: Object.keys(STATUS_EFFECTS)
    });
    return 0xffffff;
  }

  return effectDef.color;
}

export function getEffectsByType(effectsArray, effectType) {
  if (!Array.isArray(effectsArray)) {
    console.error('[Effect] getEffectsByType: effectsArray must be an array', { 
      effectsArray, 
      type: typeof effectsArray 
    });
    return [];
  }

  if (!effectType || (effectType !== 'buff' && effectType !== 'debuff')) {
    console.error('[Effect] getEffectsByType: Invalid effectType', { 
      effectType,
      validTypes: ['buff', 'debuff']
    });
    return [];
  }

  return effectsArray.filter(effect => {
    const def = STATUS_EFFECTS[effect.type];
    return def && def.type === effectType;
  });
}

console.log('[Effect.js] Status effect system initialized successfully', {
  totalEffects: Object.keys(STATUS_EFFECTS).length,
  effectTypes: Object.keys(STATUS_EFFECTS),
  exportedFunctions: [
    'createEffect',
    'applyEffectToArray',
    'tickEffects',
    'removeEffect',
    'getEffectMultipliers',
    'getEffectDescription',
    'getEffectIcon',
    'getEffectColor',
    'getEffectsByType'
  ]
});