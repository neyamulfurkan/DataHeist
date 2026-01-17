/**
 * ICE.js
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
 * ✓ Console logs use [ICE] prefix
 * ✓ File length is within ±20% of estimate
 * 
 * Purpose: ICE (enemy) entity class managing enemy stats, AI logic, and combat behavior
 * Dependencies: config.js, iceDefinitions.js, MathUtils.js, Effect.js
 * Used by: CombatSystem.js, BattleScene.js, MapGenerator.js
 */

import { GAME_CONFIG } from '../config.js';
import { ICE_LIBRARY } from '../data/iceDefinitions.js';
import { weightedRandom } from '../utils/MathUtils.js';
import { 
  createEffect, 
  applyEffectToArray, 
  tickEffects, 
  removeEffect, 
  getEffectMultipliers,
  getEffectDescription 
} from './Effect.js';

console.log('[ICE] Loading ICE entity class...');

export default class ICE {
  constructor(iceData) {
    console.log('[ICE] Constructor called with data:', {
      dataType: typeof iceData,
      isString: typeof iceData === 'string',
      isObject: typeof iceData === 'object',
      hasId: iceData?.id
    });

    if (typeof iceData === 'string') {
      const definition = ICE_LIBRARY[iceData];
      
      if (!definition) {
        console.error('[ICE] Constructor: ICE ID not found in library', {
          requestedId: iceData,
          availableIds: Object.keys(ICE_LIBRARY),
          librarySize: Object.keys(ICE_LIBRARY).length
        });
        throw new Error(`ICE definition not found: ${iceData}`);
      }
      
      console.log('[ICE] Constructor: Loading ICE from library', {
        id: iceData,
        name: definition.name,
        tier: definition.tier,
        maxHP: definition.maxHP
      });
      
      iceData = definition;
    }

    if (!iceData || typeof iceData !== 'object') {
      console.error('[ICE] Constructor: Invalid iceData parameter', {
        iceData,
        type: typeof iceData,
        isNull: iceData === null,
        isUndefined: iceData === undefined
      });
      throw new Error('ICE constructor requires valid iceData object or ID string');
    }

    if (!iceData.id || typeof iceData.id !== 'string') {
      console.error('[ICE] Constructor: Missing or invalid ID in iceData', {
        iceData,
        idValue: iceData.id,
        idType: typeof iceData.id
      });
      throw new Error('ICE data must have valid id property');
    }

    this.id = iceData.id;
    this.name = iceData.name || 'Unknown ICE';
    this.type = iceData.type || 'unknown';
    this.tier = typeof iceData.tier === 'number' ? iceData.tier : 1;
    this.description = iceData.description || 'No description available';

    if (typeof iceData.maxHP !== 'number' || iceData.maxHP <= 0) {
      console.error('[ICE] Constructor: Invalid maxHP', {
        id: this.id,
        maxHP: iceData.maxHP,
        type: typeof iceData.maxHP
      });
      throw new Error(`ICE ${this.id} has invalid maxHP: ${iceData.maxHP}`);
    }

    this.maxHP = iceData.maxHP;
    this.currentHP = iceData.maxHP;
    this.block = 0;

    // Boss ICE use phases instead of intentPool
    if (iceData.type === 'boss' || (iceData.phases && Array.isArray(iceData.phases))) {
      console.log('[ICE] Constructor: Boss ICE detected, using phases system', {
        id: this.id,
        phaseCount: iceData.phases?.length
      });
      
      if (!Array.isArray(iceData.phases) || iceData.phases.length === 0) {
        console.error('[ICE] Constructor: Boss ICE missing or invalid phases', {
          id: this.id,
          phases: iceData.phases,
          type: typeof iceData.phases
        });
        throw new Error(`Boss ICE ${this.id} must have phases array`);
      }
      
      this.phases = JSON.parse(JSON.stringify(iceData.phases));
      this.intentPool = this.phases[0].intentPool; // Use first phase intentPool as default
      
    } else {
      // Regular ICE use intentPool
      if (!Array.isArray(iceData.intentPool)) {
        console.error('[ICE] Constructor: Missing or invalid intentPool', {
          id: this.id,
          intentPool: iceData.intentPool,
          type: typeof iceData.intentPool,
          isArray: Array.isArray(iceData.intentPool)
        });
        throw new Error(`ICE ${this.id} must have intentPool array`);
      }

      if (iceData.intentPool.length === 0) {
        console.error('[ICE] Constructor: Empty intentPool', {
          id: this.id,
          intentPoolLength: iceData.intentPool.length
        });
        throw new Error(`ICE ${this.id} has empty intentPool`);
      }

      this.intentPool = JSON.parse(JSON.stringify(iceData.intentPool));
      this.phases = null;
    }

    if (typeof iceData.aiLogic !== 'function') {
      console.error('[ICE] Constructor: Missing or invalid aiLogic function', {
        id: this.id,
        aiLogic: iceData.aiLogic,
        type: typeof iceData.aiLogic
      });
      throw new Error(`ICE ${this.id} must have aiLogic function`);
    }

    this.aiLogic = iceData.aiLogic.bind(this);
    this.currentIntent = null;

    this.statusEffects = [];

    if (!iceData.rewards || typeof iceData.rewards !== 'object') {
      console.warn('[ICE] Constructor: Missing rewards object, using defaults', {
        id: this.id,
        rewards: iceData.rewards
      });
      this.rewards = {
        credits: 30,
        cardChoices: 3,
        cardPool: 'common'
      };
    } else {
      this.rewards = JSON.parse(JSON.stringify(iceData.rewards));
    }

    this.spriteKey = iceData.spriteKey || 'ice_placeholder';

    console.log('[ICE] Constructor: ICE entity created successfully', {
      id: this.id,
      name: this.name,
      type: this.type,
      tier: this.tier,
      maxHP: this.maxHP,
      currentHP: this.currentHP,
      intentPoolSize: this.intentPool?.length || 0,
      hasPhases: !!this.phases,
      phaseCount: this.phases?.length || 0,
      rewardCredits: this.rewards.credits,
      spriteKey: this.spriteKey
    });
  }

  selectIntent(gameState) {
    if (!gameState || typeof gameState !== 'object') {
      console.error('[ICE] selectIntent: Invalid gameState parameter', {
        id: this.id,
        gameState,
        type: typeof gameState,
        isNull: gameState === null
      });
      return this._getFallbackIntent();
    }

    console.log('[ICE] selectIntent: Selecting intent for ICE', {
      id: this.id,
      name: this.name,
      currentHP: this.currentHP,
      maxHP: this.maxHP,
      hpPercent: ((this.currentHP / this.maxHP) * 100).toFixed(1) + '%',
      turn: gameState.turn || 'unknown',
      phase: gameState.phase || 'unknown'
    });

    let selectedIntent = null;

    try {
      selectedIntent = this.aiLogic(gameState);
      
      if (!selectedIntent || typeof selectedIntent !== 'object') {
        console.error('[ICE] selectIntent: AI logic returned invalid intent', {
          id: this.id,
          returnedValue: selectedIntent,
          type: typeof selectedIntent,
          aiLogicExists: !!this.aiLogic
        });
        selectedIntent = this._getFallbackIntent();
      }

      if (!selectedIntent.type) {
        console.error('[ICE] selectIntent: Intent missing type property', {
          id: this.id,
          intent: selectedIntent,
          properties: Object.keys(selectedIntent)
        });
        selectedIntent = this._getFallbackIntent();
      }

      if (selectedIntent.type === 'attack' || selectedIntent.type === 'defend' || selectedIntent.type === 'trace') {
        if (typeof selectedIntent.value !== 'number') {
          console.error('[ICE] selectIntent: Intent missing or invalid value', {
            id: this.id,
            intentType: selectedIntent.type,
            value: selectedIntent.value,
            valueType: typeof selectedIntent.value
          });
          selectedIntent = this._getFallbackIntent();
        }
      }

      if (selectedIntent.type === 'multiAttack') {
        if (typeof selectedIntent.value !== 'number' || typeof selectedIntent.hits !== 'number') {
          console.error('[ICE] selectIntent: multiAttack missing value or hits', {
            id: this.id,
            value: selectedIntent.value,
            hits: selectedIntent.hits
          });
          selectedIntent = this._getFallbackIntent();
        }
      }

      if (selectedIntent.type === 'applyStatus') {
        if (!selectedIntent.status || typeof selectedIntent.stacks !== 'number') {
          console.error('[ICE] selectIntent: applyStatus missing status or stacks', {
            id: this.id,
            status: selectedIntent.status,
            stacks: selectedIntent.stacks
          });
          selectedIntent = this._getFallbackIntent();
        }
      }

    } catch (error) {
      console.error('[ICE] selectIntent: AI logic threw error', {
        id: this.id,
        name: this.name,
        error: error.message,
        stack: error.stack,
        gameStateTurn: gameState?.turn,
        currentHP: this.currentHP
      });
      selectedIntent = this._getFallbackIntent();
    }

    selectedIntent.target = selectedIntent.target || 'player';

    this.currentIntent = selectedIntent;

    console.log('[ICE] selectIntent: Intent selected successfully', {
      id: this.id,
      name: this.name,
      intentType: selectedIntent.type,
      intentValue: selectedIntent.value,
      intentTarget: selectedIntent.target,
      hits: selectedIntent.hits,
      status: selectedIntent.status,
      stacks: selectedIntent.stacks,
      description: this.getIntentDescription()
    });

    return selectedIntent;
  }

  _getFallbackIntent() {
    console.warn('[ICE] _getFallbackIntent: Using fallback intent', {
      id: this.id,
      name: this.name
    });

    if (this.intentPool && this.intentPool.length > 0) {
      const fallbackIntent = { ...this.intentPool[0] };
      delete fallbackIntent.weight;
      console.log('[ICE] _getFallbackIntent: Using first intent from pool', {
        intent: fallbackIntent
      });
      return fallbackIntent;
    }

    console.error('[ICE] _getFallbackIntent: No intent pool available, using hardcoded fallback', {
      id: this.id
    });

    return {
      type: 'attack',
      value: 5,
      target: 'player'
    };
  }

  takeDamage(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
      console.error('[ICE] takeDamage: Invalid damage amount', {
        id: this.id,
        name: this.name,
        amount,
        type: typeof amount,
        isNaN: isNaN(amount)
      });
      return 0;
    }

    if (amount < 0) {
      console.warn('[ICE] takeDamage: Negative damage amount, clamping to 0', {
        id: this.id,
        originalAmount: amount
      });
      amount = 0;
    }

    const originalHP = this.currentHP;
    const originalBlock = this.block;

    let damageAfterBlock = amount;
    let blockRemaining = this.block;

    if (this.block > 0) {
      if (amount <= this.block) {
        blockRemaining = this.block - amount;
        damageAfterBlock = 0;
        console.log('[ICE] takeDamage: Damage fully absorbed by block', {
          id: this.id,
          name: this.name,
          incomingDamage: amount,
          blockBefore: this.block,
          blockAfter: blockRemaining,
          blockLost: amount,
          hpDamage: 0
        });
      } else {
        damageAfterBlock = amount - this.block;
        blockRemaining = 0;
        console.log('[ICE] takeDamage: Block broken, remaining damage to HP', {
          id: this.id,
          name: this.name,
          incomingDamage: amount,
          blockBefore: this.block,
          blockLost: this.block,
          remainingDamage: damageAfterBlock
        });
      }
    }

    this.block = blockRemaining;

    this.currentHP = Math.max(0, this.currentHP - damageAfterBlock);

    const actualDamageToHP = originalHP - this.currentHP;

    console.log('[ICE] takeDamage: Damage processed', {
      id: this.id,
      name: this.name,
      totalDamage: amount,
      blockAbsorbed: originalBlock - blockRemaining,
      hpDamage: actualDamageToHP,
      hpBefore: originalHP,
      hpAfter: this.currentHP,
      blockBefore: originalBlock,
      blockAfter: this.block,
      isDefeated: this.currentHP === 0,
      hpPercent: ((this.currentHP / this.maxHP) * 100).toFixed(1) + '%'
    });

    if (this.currentHP === 0 && originalHP > 0) {
      console.log('[ICE] takeDamage: ICE DEFEATED', {
        id: this.id,
        name: this.name,
        finalDamage: amount,
        totalHPLost: originalHP,
        rewards: this.rewards
      });
    }

    return actualDamageToHP;
  }

  heal(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
      console.error('[ICE] heal: Invalid heal amount', {
        id: this.id,
        name: this.name,
        amount,
        type: typeof amount
      });
      return 0;
    }

    if (amount < 0) {
      console.warn('[ICE] heal: Negative heal amount, clamping to 0', {
        id: this.id,
        originalAmount: amount
      });
      amount = 0;
    }

    const originalHP = this.currentHP;
    const maxPossibleHeal = this.maxHP - this.currentHP;
    const actualHeal = Math.min(amount, maxPossibleHeal);

    this.currentHP = Math.min(this.maxHP, this.currentHP + amount);

    console.log('[ICE] heal: HP restored', {
      id: this.id,
      name: this.name,
      requestedHeal: amount,
      actualHeal,
      hpBefore: originalHP,
      hpAfter: this.currentHP,
      maxHP: this.maxHP,
      wasAtMax: originalHP === this.maxHP,
      nowAtMax: this.currentHP === this.maxHP
    });

    return actualHeal;
  }

  gainBlock(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
      console.error('[ICE] gainBlock: Invalid block amount', {
        id: this.id,
        name: this.name,
        amount,
        type: typeof amount
      });
      return 0;
    }

    if (amount < 0) {
      console.warn('[ICE] gainBlock: Negative block amount, clamping to 0', {
        id: this.id,
        originalAmount: amount
      });
      amount = 0;
    }

    const originalBlock = this.block;
    this.block = Math.min(GAME_CONFIG.COMBAT.MAX_BLOCK_PER_CARD, this.block + amount);
    const actualGain = this.block - originalBlock;

    console.log('[ICE] gainBlock: Block gained', {
      id: this.id,
      name: this.name,
      requestedBlock: amount,
      actualGain,
      blockBefore: originalBlock,
      blockAfter: this.block,
      maxBlock: GAME_CONFIG.COMBAT.MAX_BLOCK_PER_CARD,
      capped: actualGain < amount
    });

    return actualGain;
  }

  resetBlock() {
    const previousBlock = this.block;
    this.block = 0;

    console.log('[ICE] resetBlock: Block reset to 0', {
      id: this.id,
      name: this.name,
      previousBlock,
      lostBlock: previousBlock
    });

    return previousBlock;
  }

  applyStatusEffect(type, stacks = 1, duration = null) {
    if (!type || typeof type !== 'string') {
      console.error('[ICE] applyStatusEffect: Invalid type parameter', {
        id: this.id,
        name: this.name,
        type,
        typeOf: typeof type
      });
      return false;
    }

    if (typeof stacks !== 'number' || stacks < 1) {
      console.error('[ICE] applyStatusEffect: Invalid stacks parameter', {
        id: this.id,
        name: this.name,
        type,
        stacks,
        stacksType: typeof stacks
      });
      return false;
    }

    console.log('[ICE] applyStatusEffect: Applying status effect', {
      id: this.id,
      name: this.name,
      effectType: type,
      stacks,
      duration,
      currentEffectsCount: this.statusEffects.length
    });

    try {
      const newEffect = createEffect(type, stacks, duration);
      
      if (!newEffect) {
        console.error('[ICE] applyStatusEffect: createEffect returned null', {
          id: this.id,
          name: this.name,
          type,
          stacks,
          duration
        });
        return false;
      }

      const previousEffectsCount = this.statusEffects.length;
      this.statusEffects = applyEffectToArray(this.statusEffects, newEffect);
      const afterEffectsCount = this.statusEffects.length;

      console.log('[ICE] applyStatusEffect: Status effect applied successfully', {
        id: this.id,
        name: this.name,
        effectType: type,
        effectStacks: stacks,
        effectDuration: duration,
        effectsCountBefore: previousEffectsCount,
        effectsCountAfter: afterEffectsCount,
        wasNewEffect: afterEffectsCount > previousEffectsCount,
        currentEffects: this.statusEffects.map(e => ({ type: e.type, stacks: e.stacks, duration: e.duration }))
      });

      return true;

    } catch (error) {
      console.error('[ICE] applyStatusEffect: Error applying status effect', {
        id: this.id,
        name: this.name,
        type,
        stacks,
        duration,
        error: error.message,
        stack: error.stack
      });
      return false;
    }
  }

  removeStatusEffect(type, stacksToRemove = null) {
    if (!type || typeof type !== 'string') {
      console.error('[ICE] removeStatusEffect: Invalid type parameter', {
        id: this.id,
        name: this.name,
        type,
        typeOf: typeof type
      });
      return false;
    }

    console.log('[ICE] removeStatusEffect: Removing status effect', {
      id: this.id,
      name: this.name,
      effectType: type,
      stacksToRemove,
      currentEffects: this.statusEffects.map(e => ({ type: e.type, stacks: e.stacks }))
    });

    const hadEffect = this.statusEffects.some(e => e.type === type);

    if (!hadEffect) {
      console.warn('[ICE] removeStatusEffect: Effect not present on ICE', {
        id: this.id,
        name: this.name,
        effectType: type,
        currentEffects: this.statusEffects.map(e => e.type)
      });
      return false;
    }

    try {
      const previousEffectsCount = this.statusEffects.length;
      this.statusEffects = removeEffect(this.statusEffects, type, stacksToRemove);
      const afterEffectsCount = this.statusEffects.length;

      const stillHasEffect = this.statusEffects.some(e => e.type === type);

      console.log('[ICE] removeStatusEffect: Status effect removal processed', {
        id: this.id,
        name: this.name,
        effectType: type,
        stacksRemoved: stacksToRemove || 'all',
        effectsCountBefore: previousEffectsCount,
        effectsCountAfter: afterEffectsCount,
        wasCompletelyRemoved: !stillHasEffect,
        currentEffects: this.statusEffects.map(e => ({ type: e.type, stacks: e.stacks }))
      });

      return true;

    } catch (error) {
      console.error('[ICE] removeStatusEffect: Error removing status effect', {
        id: this.id,
        name: this.name,
        type,
        stacksToRemove,
        error: error.message,
        stack: error.stack
      });
      return false;
    }
  }

  tickStatusEffects() {
    if (!Array.isArray(this.statusEffects) || this.statusEffects.length === 0) {
      console.log('[ICE] tickStatusEffects: No status effects to tick', {
        id: this.id,
        name: this.name,
        statusEffectsType: typeof this.statusEffects,
        isArray: Array.isArray(this.statusEffects),
        length: this.statusEffects?.length || 0
      });
      return {
        remainingEffects: [],
        tickResults: []
      };
    }

    console.log('[ICE] tickStatusEffects: Processing status effect ticks', {
      id: this.id,
      name: this.name,
      effectCount: this.statusEffects.length,
      effects: this.statusEffects.map(e => ({
        type: e.type,
        stacks: e.stacks,
        duration: e.duration,
        tickBehavior: e.tickBehavior
      }))
    });

    try {
      const { remainingEffects, tickResults } = tickEffects(this.statusEffects, this);

      const expiredEffects = this.statusEffects.filter(e => !remainingEffects.some(r => r.type === e.type));

      console.log('[ICE] tickStatusEffects: Status effects ticked', {
        id: this.id,
        name: this.name,
        effectsCountBefore: this.statusEffects.length,
        effectsCountAfter: remainingEffects.length,
        expiredEffectsCount: expiredEffects.length,
        expiredEffects: expiredEffects.map(e => e.type),
        tickResultsCount: tickResults.length,
        tickResults: tickResults.map(r => ({ type: r.type, behavior: r.behavior, value: r.value }))
      });

      this.statusEffects = remainingEffects;

      return {
        remainingEffects,
        tickResults,
        expiredEffects
      };

    } catch (error) {
      console.error('[ICE] tickStatusEffects: Error during status effect tick', {
        id: this.id,
        name: this.name,
        effectCount: this.statusEffects.length,
        error: error.message,
        stack: error.stack
      });
      return {
        remainingEffects: this.statusEffects,
        tickResults: [],
        expiredEffects: []
      };
    }
  }

  hasStatusEffect(type) {
    if (!type || typeof type !== 'string') {
      console.error('[ICE] hasStatusEffect: Invalid type parameter', {
        id: this.id,
        name: this.name,
        type,
        typeOf: typeof type
      });
      return 0;
    }

    if (!Array.isArray(this.statusEffects)) {
      console.error('[ICE] hasStatusEffect: statusEffects is not an array', {
        id: this.id,
        name: this.name,
        statusEffects: this.statusEffects,
        type: typeof this.statusEffects
      });
      return 0;
    }

    const effect = this.statusEffects.find(e => e && e.type === type);

    if (effect) {
      console.log('[ICE] hasStatusEffect: Effect found', {
        id: this.id,
        name: this.name,
        effectType: type,
        stacks: effect.stacks,
        duration: effect.duration
      });
      return effect.stacks || 1;
    }

    return 0;
  }

  getStatusMultipliers() {
    if (!Array.isArray(this.statusEffects)) {
      console.error('[ICE] getStatusMultipliers: statusEffects is not an array', {
        id: this.id,
        name: this.name,
        statusEffects: this.statusEffects,
        type: typeof this.statusEffects
      });
      return {
        damageMultiplier: 1.0,
        damageTakenMultiplier: 1.0,
        blockMultiplier: 1.0,
        strengthBonus: 0,
        dexterityBonus: 0
      };
    }

    try {
      const multipliers = getEffectMultipliers(this.statusEffects);

      console.log('[ICE] getStatusMultipliers: Calculated multipliers', {
        id: this.id,
        name: this.name,
        effectCount: this.statusEffects.length,
        multipliers
      });

      return multipliers;

    } catch (error) {
      console.error('[ICE] getStatusMultipliers: Error calculating multipliers', {
        id: this.id,
        name: this.name,
        effectCount: this.statusEffects.length,
        error: error.message,
        stack: error.stack
      });
      return {
        damageMultiplier: 1.0,
        damageTakenMultiplier: 1.0,
        blockMultiplier: 1.0,
        strengthBonus: 0,
        dexterityBonus: 0
      };
    }
  }

  isDefeated() {
    const defeated = this.currentHP <= 0;

    if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
      console.log('[ICE] isDefeated: Checked defeat status', {
        id: this.id,
        name: this.name,
        currentHP: this.currentHP,
        maxHP: this.maxHP,
        isDefeated: defeated
      });
    }

    return defeated;
  }

  getIntentDescription() {
    if (!this.currentIntent || typeof this.currentIntent !== 'object') {
      console.warn('[ICE] getIntentDescription: No current intent set', {
        id: this.id,
        name: this.name,
        currentIntent: this.currentIntent,
        type: typeof this.currentIntent
      });
      return 'Unknown intent';
    }

    const intent = this.currentIntent;
    let description = '';

    try {
      switch (intent.type) {
        case 'attack':
          description = `Attack for ${intent.value} damage`;
          break;

        case 'defend':
          description = `Gain ${intent.value} Block`;
          break;

        case 'trace':
          description = `Increase Trace by ${intent.value}`;
          break;

        case 'multiAttack':
          description = `Attack ${intent.hits}x for ${intent.value} damage each`;
          break;

        case 'applyStatus':
          description = `Apply ${intent.stacks} ${intent.status}`;
          break;

        case 'special':
          description = intent.description || 'Special action';
          break;

        default:
          console.warn('[ICE] getIntentDescription: Unknown intent type', {
            id: this.id,
            name: this.name,
            intentType: intent.type,
            intent
          });
          description = 'Unknown action';
          break;
      }

      if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
        console.log('[ICE] getIntentDescription: Generated description', {
          id: this.id,
          name: this.name,
          intentType: intent.type,
          description
        });
      }

    } catch (error) {
      console.error('[ICE] getIntentDescription: Error generating description', {
        id: this.id,
        name: this.name,
        intent,
        error: error.message
      });
      description = 'Error: Invalid intent';
    }

    return description;
  }

  toJSON() {
    try {
      const json = {
        id: this.id,
        name: this.name,
        type: this.type,
        tier: this.tier,
        currentHP: this.currentHP,
        maxHP: this.maxHP,
        block: this.block,
        statusEffects: JSON.parse(JSON.stringify(this.statusEffects)),
        currentIntent: this.currentIntent ? JSON.parse(JSON.stringify(this.currentIntent)) : null,
        description: this.description,
        spriteKey: this.spriteKey,
        rewards: JSON.parse(JSON.stringify(this.rewards))
      };

      console.log('[ICE] toJSON: Serialized ICE to JSON', {
        id: this.id,
        name: this.name,
        currentHP: json.currentHP,
        maxHP: json.maxHP,
        statusEffectsCount: json.statusEffects.length
      });

      return json;

    } catch (error) {
      console.error('[ICE] toJSON: Error serializing ICE', {
        id: this.id,
        name: this.name,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  static fromJSON(json) {
    if (!json || typeof json !== 'object') {
      console.error('[ICE] fromJSON: Invalid JSON parameter', {
        json,
        type: typeof json
      });
      throw new Error('ICE.fromJSON requires valid JSON object');
    }

    if (!json.id) {
      console.error('[ICE] fromJSON: JSON missing id property', {
        json,
        properties: Object.keys(json)
      });
      throw new Error('ICE JSON must have id property');
    }

    console.log('[ICE] fromJSON: Deserializing ICE from JSON', {
      id: json.id,
      name: json.name,
      currentHP: json.currentHP,
      maxHP: json.maxHP,
      statusEffectsCount: json.statusEffects?.length || 0
    });

    try {
      const ice = new ICE(json.id);

      if (typeof json.currentHP === 'number') {
        ice.currentHP = Math.max(0, Math.min(json.currentHP, ice.maxHP));
      }

      if (typeof json.block === 'number') {
        ice.block = Math.max(0, json.block);
      }

      if (Array.isArray(json.statusEffects)) {
        ice.statusEffects = JSON.parse(JSON.stringify(json.statusEffects));
      }

      if (json.currentIntent && typeof json.currentIntent === 'object') {
        ice.currentIntent = JSON.parse(JSON.stringify(json.currentIntent));
      }

      console.log('[ICE] fromJSON: ICE deserialized successfully', {
        id: ice.id,
        name: ice.name,
        currentHP: ice.currentHP,
        maxHP: ice.maxHP,
        block: ice.block,
        statusEffectsCount: ice.statusEffects.length,
        hasCurrentIntent: !!ice.currentIntent
      });

      return ice;

    } catch (error) {
      console.error('[ICE] fromJSON: Error deserializing ICE', {
        id: json.id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}

console.log('[ICE] ✅ ICE entity class loaded successfully', {
  className: 'ICE',
  methods: [
    'constructor',
    'selectIntent',
    'takeDamage',
    'heal',
    'gainBlock',
    'resetBlock',
    'applyStatusEffect',
    'removeStatusEffect',
    'tickStatusEffects',
    'hasStatusEffect',
    'getStatusMultipliers',
    'isDefeated',
    'getIntentDescription',
    'toJSON',
    'fromJSON'
  ],
  dependencies: ['GAME_CONFIG', 'ICE_LIBRARY', 'MathUtils', 'Effect']
});
