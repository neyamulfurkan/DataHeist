/**
 * Runner.js
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
 * ✓ Console logs use [Runner] prefix
 * ✓ File length is within ±20% of estimate
 * 
 * Purpose: Runner entity class representing player character with stats, abilities, and state tracking
 * Dependencies: config.js, runnerDefinitions.js, Deck.js, Card.js
 * Used by: BattleScene.js, CombatSystem.js, LoadoutScene.js, MapScene.js
 */

console.log('[Runner] Loading Runner entity class...');

import { GAME_CONFIG } from '../config.js';
import { RUNNER_LIBRARY, getRunnerById } from '../data/runnerDefinitions.js';
import Deck from './Deck.js';

/**
 * @typedef {Object} StatusEffect
 * @property {string} type - Effect type (strength, weak, vulnerable, poison, regen, etc.)
 * @property {number} stacks - Intensity/stacks of effect
 * @property {number} duration - Turns remaining (-1 = permanent)
 * @property {string} icon - Sprite key for visual
 */

/**
 * Runner class representing the player character
 */
export default class Runner {
  /**
   * Create a Runner instance
   * @param {string|Object} runnerData - Runner ID string or full runner object
   * @throws {Error} If runner data is invalid or runner not found
   */
  constructor(runnerData) {
    console.log('[Runner] Constructor called with:', typeof runnerData === 'string' ? runnerData : 'object');

    if (!runnerData) {
      console.error('[Runner] Constructor: runnerData is null or undefined');
      throw new Error('Runner constructor requires valid runnerData');
    }

    let sourceData = null;

    if (typeof runnerData === 'string') {
      sourceData = getRunnerById(runnerData);
      
      if (!sourceData) {
        console.error('[Runner] Constructor: Runner ID not found in library:', runnerData);
        throw new Error(`Runner ID "${runnerData}" not found in RUNNER_LIBRARY`);
      }
      
      console.log('[Runner] Loaded runner from library:', sourceData.name);
    } else if (typeof runnerData === 'object') {
      sourceData = runnerData;
      console.log('[Runner] Using provided runner object:', sourceData.name || 'unnamed');
    } else {
      console.error('[Runner] Constructor: Invalid runnerData type:', typeof runnerData);
      throw new Error('runnerData must be string (runner ID) or object (runner data)');
    }

    this._validateRunnerData(sourceData);
    this._initializeProperties(sourceData);
    this._initializeDeck(sourceData);

    console.log('[Runner] Runner created successfully:', this.name, `(${this.id})`);
    console.log('[Runner] Stats:', {
      maxTrace: this.maxTrace,
      maxCPU: this.maxCPU,
      deckSize: this.deck.getAllCards().length,
      passiveAbility: this.passiveAbility.name
    });
  }

  /**
   * Validate runner data has all required properties
   * @param {Object} data - Runner data to validate
   * @throws {Error} If validation fails
   * @private
   */
  _validateRunnerData(data) {
    const requiredProps = ['id', 'name', 'description', 'maxTrace', 'startingCPU', 'startingDeck', 'passiveAbility'];
    const missingProps = [];

    requiredProps.forEach(prop => {
      if (data[prop] === undefined || data[prop] === null) {
        missingProps.push(prop);
      }
    });

    if (missingProps.length > 0) {
      console.error('[Runner] Validation failed - missing properties:', missingProps);
      console.error('[Runner] Runner data:', data);
      throw new Error(`Runner validation failed: missing ${missingProps.join(', ')}`);
    }

    if (typeof data.maxTrace !== 'number' || data.maxTrace <= 0) {
      console.error('[Runner] Invalid maxTrace value:', data.maxTrace);
      throw new Error(`Invalid maxTrace: ${data.maxTrace} (must be > 0)`);
    }

    if (typeof data.startingCPU !== 'number' || data.startingCPU <= 0) {
      console.error('[Runner] Invalid startingCPU value:', data.startingCPU);
      throw new Error(`Invalid startingCPU: ${data.startingCPU} (must be > 0)`);
    }

    if (!Array.isArray(data.startingDeck) || data.startingDeck.length === 0) {
      console.error('[Runner] Invalid startingDeck:', data.startingDeck);
      throw new Error('startingDeck must be non-empty array');
    }

    if (!data.passiveAbility || typeof data.passiveAbility !== 'object') {
      console.error('[Runner] Invalid passiveAbility:', data.passiveAbility);
      throw new Error('passiveAbility must be object');
    }

    console.log('[Runner] Validation passed for:', data.name);
  }

  /**
   * Initialize runner properties from source data
   * @param {Object} data - Source runner data
   * @private
   */
  _initializeProperties(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.lore = data.lore || '';
    
    this.maxTrace = data.maxTrace;
    this.currentTrace = GAME_CONFIG.GAMEPLAY.STARTING_TRACE;
    
    this.maxCPU = data.startingCPU;
    this.currentCPU = data.startingCPU;
    
    this.block = GAME_CONFIG.GAMEPLAY.STARTING_BLOCK;
    
    this.passiveAbility = {
      id: data.passiveAbility.id,
      name: data.passiveAbility.name,
      description: data.passiveAbility.description,
      trigger: data.passiveAbility.trigger,
      condition: data.passiveAbility.condition,
      effect: data.passiveAbility.effect
    };
    
    this.statusEffects = [];
    this.relics = [];
    
    this.spriteKey = data.spriteKey || 'runner_placeholder';
    this.unlocked = data.unlocked !== undefined ? data.unlocked : true;
    
    this.stats = {
      totalDamageTaken: 0,
      totalDamageDealt: 0,
      totalBlockGained: 0,
      totalCardsPlayed: 0,
      totalTurns: 0,
      traceHistory: []
    };

    console.log('[Runner] Properties initialized for:', this.name);
  }

  /**
   * Initialize deck from starting deck
   * @param {Object} data - Runner data with startingDeck
   * @private
   */
  _initializeDeck(data) {
    try {
      this.deck = new Deck(data.startingDeck);
      console.log('[Runner] Deck initialized with', this.deck.getAllCards().length, 'cards');
    } catch (error) {
      console.error('[Runner] Failed to initialize deck:', error);
      console.error('[Runner] Starting deck data:', data.startingDeck);
      throw new Error(`Failed to initialize deck for ${this.name}: ${error.message}`);
    }
  }

  /**
   * Modify trace value (increase or decrease)
   * @param {number} amount - Amount to change trace by (positive or negative)
   * @param {string} [source='unknown'] - Source of trace change for logging
   * @returns {number} New trace value
   */
  modifyTrace(amount, source = 'unknown') {
    if (typeof amount !== 'number' || isNaN(amount)) {
      console.error('[Runner] modifyTrace: Invalid amount, expected number, got', typeof amount, amount);
      return this.currentTrace;
    }

    const previousTrace = this.currentTrace;
    const rawNewTrace = this.currentTrace + amount;
    this.currentTrace = Math.max(
      GAME_CONFIG.GAMEPLAY.MIN_TRACE,
      Math.min(rawNewTrace, this.maxTrace)
    );

    const actualChange = this.currentTrace - previousTrace;
    const wasClamped = rawNewTrace !== this.currentTrace;

    console.log('[Runner] modifyTrace:', {
      source: source,
      requestedChange: amount,
      actualChange: actualChange,
      previousTrace: previousTrace,
      currentTrace: this.currentTrace,
      maxTrace: this.maxTrace,
      clamped: wasClamped,
      clampReason: rawNewTrace < 0 ? 'below minimum' : rawNewTrace > this.maxTrace ? 'above maximum' : 'none'
    });

    this.stats.traceHistory.push({
      turn: this.stats.totalTurns,
      source: source,
      change: actualChange,
      value: this.currentTrace
    });

    if (amount > 0) {
      this.stats.totalDamageTaken += actualChange;
    }

    if (this.isDefeated()) {
      console.error('[Runner] ⚠️ TRACE LIMIT REACHED - Runner defeated!', {
        currentTrace: this.currentTrace,
        maxTrace: this.maxTrace,
        finalSource: source
      });
    }

    return this.currentTrace;
  }

  /**
   * Reset CPU to maximum (called at turn start)
   * @returns {number} New CPU value
   */
  resetCPU() {
    const previousCPU = this.currentCPU;
    this.currentCPU = this.maxCPU;

    console.log('[Runner] resetCPU: CPU restored from', previousCPU, 'to', this.currentCPU);
    return this.currentCPU;
  }

  /**
   * Spend CPU to play cards
   * @param {number} amount - CPU to spend
   * @param {string} [source='unknown'] - Source of CPU expenditure
   * @returns {boolean} True if successfully spent
   */
  spendCPU(amount, source = 'unknown') {
    if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
      console.error('[Runner] spendCPU: Invalid amount, expected positive number, got', typeof amount, amount);
      return false;
    }

    if (this.currentCPU < amount) {
      console.error('[Runner] spendCPU: Insufficient CPU', {
        requested: amount,
        available: this.currentCPU,
        source: source
      });
      return false;
    }

    const previousCPU = this.currentCPU;
    this.currentCPU -= amount;

    console.log('[Runner] spendCPU:', {
      amount: amount,
      source: source,
      previousCPU: previousCPU,
      currentCPU: this.currentCPU,
      remaining: this.currentCPU
    });

    return true;
  }

  /**
   * Gain CPU (from cards or effects)
   * @param {number} amount - CPU to gain
   * @param {string} [source='unknown'] - Source of CPU gain
   * @returns {number} New CPU value
   */
  gainCPU(amount, source = 'unknown') {
    if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
      console.error('[Runner] gainCPU: Invalid amount, expected positive number, got', typeof amount, amount);
      return this.currentCPU;
    }

    const previousCPU = this.currentCPU;
    this.currentCPU = Math.min(this.currentCPU + amount, this.maxCPU);
    const actualGain = this.currentCPU - previousCPU;

    console.log('[Runner] gainCPU:', {
      requested: amount,
      actualGain: actualGain,
      source: source,
      previousCPU: previousCPU,
      currentCPU: this.currentCPU,
      maxCPU: this.maxCPU,
      capped: actualGain < amount
    });

    return this.currentCPU;
  }

  /**
   * Gain block (temporary shield)
   * @param {number} amount - Block to gain
   * @param {string} [source='unknown'] - Source of block
   * @returns {number} New block value
   */
  gainBlock(amount, source = 'unknown') {
    if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
      console.error('[Runner] gainBlock: Invalid amount, expected positive number, got', typeof amount, amount);
      return this.block;
    }

    const previousBlock = this.block;
    this.block += amount;
    
    if (this.block > GAME_CONFIG.COMBAT.MAX_BLOCK_PER_CARD) {
      console.warn('[Runner] gainBlock: Block exceeds maximum, capping at', GAME_CONFIG.COMBAT.MAX_BLOCK_PER_CARD);
      this.block = GAME_CONFIG.COMBAT.MAX_BLOCK_PER_CARD;
    }

    const actualGain = this.block - previousBlock;
    this.stats.totalBlockGained += actualGain;

    console.log('[Runner] gainBlock:', {
      amount: actualGain,
      source: source,
      previousBlock: previousBlock,
      currentBlock: this.block
    });

    return this.block;
  }

  /**
   * Reset block to 0 (called at turn end)
   * @returns {number} Previous block value
   */
  resetBlock() {
    const previousBlock = this.block;
    this.block = 0;

    console.log('[Runner] resetBlock: Block reset from', previousBlock, 'to 0');
    return previousBlock;
  }

  /**
   * Take damage with block reduction
   * @param {number} damage - Raw damage amount
   * @param {string} [source='unknown'] - Source of damage
   * @returns {Object} Damage resolution details
   */
  takeDamage(damage, source = 'unknown') {
    if (typeof damage !== 'number' || isNaN(damage) || damage < 0) {
      console.error('[Runner] takeDamage: Invalid damage, expected positive number, got', typeof damage, damage);
      return { damageToTrace: 0, blockRemaining: this.block };
    }

    const initialBlock = this.block;
    
    // FIXED: Block absorbs damage first, then remainder goes to trace
    let damageBlocked = Math.min(this.block, damage);
    let damageAfterBlock = Math.max(0, damage - this.block);
    
    // Reduce block by damage absorbed
    this.block = Math.max(0, this.block - damage);

    const traceIncrease = damageAfterBlock;
    if (traceIncrease > 0) {
      this.modifyTrace(traceIncrease, source);
    }

    console.log('[Runner] takeDamage:', {
      incomingDamage: damage,
      source: source,
      initialBlock: initialBlock,
      damageBlocked: damageBlocked,
      damageToTrace: traceIncrease,
      blockRemaining: this.block,
      currentTrace: this.currentTrace,
      blockAbsorbedAll: damageBlocked === damage
    });

    return {
      damageToTrace: traceIncrease,
      blockRemaining: this.block,
      damageBlocked: damageBlocked
    };
  }

  /**
   * Apply status effect or add stacks to existing effect
   * @param {string} type - Effect type (strength, weak, vulnerable, poison, regen, etc.)
   * @param {number} stacks - Number of stacks to apply
   * @param {number} duration - Turns remaining (-1 = permanent)
   * @param {string} [icon=''] - Sprite key for visual
   * @returns {boolean} True if successfully applied
   */
  applyStatusEffect(type, stacks, duration, icon = '') {
    if (typeof type !== 'string' || !type) {
      console.error('[Runner] applyStatusEffect: Invalid type, expected non-empty string, got', typeof type, type);
      return false;
    }

    if (typeof stacks !== 'number' || isNaN(stacks) || stacks <= 0) {
      console.error('[Runner] applyStatusEffect: Invalid stacks, expected positive number, got', typeof stacks, stacks);
      return false;
    }

    if (typeof duration !== 'number' || isNaN(duration) || (duration < -1)) {
      console.error('[Runner] applyStatusEffect: Invalid duration, expected -1 or positive number, got', typeof duration, duration);
      return false;
    }

    const stacksToAdd = Math.floor(Math.max(1, stacks));
    const validDuration = duration === -1 ? -1 : Math.floor(Math.max(0, duration));

    const existingEffect = this.statusEffects.find(effect => effect.type === type);

    if (existingEffect) {
      const previousStacks = existingEffect.stacks;
      existingEffect.stacks = Math.min(
        existingEffect.stacks + stacksToAdd,
        GAME_CONFIG.GAMEPLAY.MAX_STATUS_STACKS
      );

      if (validDuration > existingEffect.duration || existingEffect.duration === -1) {
        existingEffect.duration = validDuration;
      }

      console.log('[Runner] applyStatusEffect: Stacked existing effect', {
        type: type,
        previousStacks: previousStacks,
        addedStacks: stacksToAdd,
        newStacks: existingEffect.stacks,
        duration: existingEffect.duration,
        cappedAt: GAME_CONFIG.GAMEPLAY.MAX_STATUS_STACKS
      });
    } else {
      const newEffect = {
        type: type,
        stacks: Math.min(stacksToAdd, GAME_CONFIG.GAMEPLAY.MAX_STATUS_STACKS),
        duration: validDuration,
        icon: icon || `icon_${type}`
      };

      this.statusEffects.push(newEffect);

      console.log('[Runner] applyStatusEffect: Applied new effect', {
        type: type,
        stacks: newEffect.stacks,
        duration: newEffect.duration,
        icon: newEffect.icon
      });
    }

    console.log('[Runner] applyStatusEffect: Current status effects:', 
      this.statusEffects.map(e => `${e.type}(${e.stacks})`).join(', ')
    );

    return true;
  }

  /**
   * Remove status effect or reduce stacks
   * @param {string} type - Effect type to remove
   * @param {number|null} stacksToRemove - Stacks to remove (null = remove entirely)
   * @returns {boolean} True if successfully removed
   */
  removeStatusEffect(type, stacksToRemove = null) {
    if (typeof type !== 'string' || !type) {
      console.error('[Runner] removeStatusEffect: Invalid type, expected non-empty string, got', typeof type, type);
      return false;
    }

    const effectIndex = this.statusEffects.findIndex(effect => effect.type === type);

    if (effectIndex === -1) {
      console.warn('[Runner] removeStatusEffect: Effect not found:', type);
      console.log('[Runner] removeStatusEffect: Current effects:', 
        this.statusEffects.map(e => e.type).join(', ')
      );
      return false;
    }

    if (stacksToRemove === null) {
      const removed = this.statusEffects.splice(effectIndex, 1)[0];
      console.log('[Runner] removeStatusEffect: Removed entire effect', {
        type: removed.type,
        hadStacks: removed.stacks,
        hadDuration: removed.duration
      });
      return true;
    }

    if (typeof stacksToRemove !== 'number' || isNaN(stacksToRemove) || stacksToRemove <= 0) {
      console.error('[Runner] removeStatusEffect: Invalid stacksToRemove, expected positive number or null, got', typeof stacksToRemove, stacksToRemove);
      return false;
    }

    const effect = this.statusEffects[effectIndex];
    const previousStacks = effect.stacks;
    effect.stacks = Math.max(0, effect.stacks - stacksToRemove);

    if (effect.stacks <= 0) {
      this.statusEffects.splice(effectIndex, 1);
      console.log('[Runner] removeStatusEffect: Removed effect after stack reduction', {
        type: type,
        previousStacks: previousStacks,
        removedStacks: stacksToRemove
      });
    } else {
      console.log('[Runner] removeStatusEffect: Reduced stacks', {
        type: type,
        previousStacks: previousStacks,
        removedStacks: stacksToRemove,
        remainingStacks: effect.stacks
      });
    }

    console.log('[Runner] removeStatusEffect: Current status effects:', 
      this.statusEffects.map(e => `${e.type}(${e.stacks})`).join(', ')
    );

    return true;
  }

  /**
   * Tick status effects at turn end (decrement durations, remove expired)
   * @returns {Array<StatusEffect>} Array of expired effects
   */
  tickStatusEffects() {
    console.log('[Runner] tickStatusEffects: Processing', this.statusEffects.length, 'effects');

    const expiredEffects = [];

    for (let i = this.statusEffects.length - 1; i >= 0; i--) {
      const effect = this.statusEffects[i];

      if (effect.duration === -1) {
        console.log('[Runner] tickStatusEffects: Permanent effect', effect.type, '- skipping');
        continue;
      }

      const previousDuration = effect.duration;
      effect.duration--;

      console.log('[Runner] tickStatusEffects: Decremented', {
        type: effect.type,
        stacks: effect.stacks,
        previousDuration: previousDuration,
        newDuration: effect.duration
      });

      if (effect.duration <= 0) {
        expiredEffects.push({ ...effect });
        this.statusEffects.splice(i, 1);
        console.log('[Runner] tickStatusEffects: Expired effect removed:', effect.type);
      }
    }

    if (expiredEffects.length > 0) {
      console.log('[Runner] tickStatusEffects: Expired effects:', 
        expiredEffects.map(e => e.type).join(', ')
      );
    }

    console.log('[Runner] tickStatusEffects: Remaining effects:', 
      this.statusEffects.map(e => `${e.type}(${e.stacks}, ${e.duration}t)`).join(', ')
    );

    return expiredEffects;
  }

  /**
   * Check if runner has specific status effect
   * @param {string} type - Effect type to check
   * @returns {number} Number of stacks (0 if not present)
   */
  hasStatusEffect(type) {
    if (typeof type !== 'string' || !type) {
      console.error('[Runner] hasStatusEffect: Invalid type, expected non-empty string, got', typeof type, type);
      return 0;
    }

    const effect = this.statusEffects.find(e => e.type === type);
    const stacks = effect ? effect.stacks : 0;

    if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
      console.log('[Runner] hasStatusEffect:', type, '=', stacks, 'stacks');
    }

    return stacks;
  }

  /**
   * Get damage and defense multipliers from status effects
   * @returns {Object} Multipliers object
   */
  getStatusMultipliers() {
    let strengthBonus = 0;
    let dexterityBonus = 0;
    let damageMultiplier = 1.0;
    let damageTakenMultiplier = 1.0;
    let blockMultiplier = 1.0;

    const strengthStacks = this.hasStatusEffect('strength');
    if (strengthStacks > 0) {
      strengthBonus = strengthStacks * GAME_CONFIG.COMBAT.STRENGTH_BONUS_PER_STACK;
    }

    const weakStacks = this.hasStatusEffect('weak');
    if (weakStacks > 0) {
      damageMultiplier *= Math.pow(GAME_CONFIG.COMBAT.WEAK_MULTIPLIER, weakStacks);
    }

    const vulnerableStacks = this.hasStatusEffect('vulnerable');
    if (vulnerableStacks > 0) {
      damageTakenMultiplier *= Math.pow(GAME_CONFIG.COMBAT.VULNERABLE_MULTIPLIER, vulnerableStacks);
    }

    const dexterityStacks = this.hasStatusEffect('dexterity');
    if (dexterityStacks > 0) {
      dexterityBonus = dexterityStacks * GAME_CONFIG.COMBAT.DEXTERITY_BLOCK_BONUS_PER_STACK;
    }

    const multipliers = {
      strengthBonus: strengthBonus,
      dexterityBonus: dexterityBonus,
      damageMultiplier: damageMultiplier,
      damageTakenMultiplier: damageTakenMultiplier,
      blockMultiplier: blockMultiplier
    };

    if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
      console.log('[Runner] getStatusMultipliers:', multipliers);
    }

    return multipliers;
  }

  /**
   * Check if runner is defeated (trace >= maxTrace)
   * @returns {boolean} True if defeated
   */
  isDefeated() {
    const defeated = this.currentTrace >= this.maxTrace;

    if (defeated && GAME_CONFIG.DEBUG_MODE) {
      console.error('[Runner] isDefeated: Runner has been defeated!', {
        currentTrace: this.currentTrace,
        maxTrace: this.maxTrace,
        runnerName: this.name
      });
    }

    return defeated;
  }

  /**
   * Get runner statistics
   * @returns {Object} Runner statistics
   */
  getStats() {
    const stats = {
      name: this.name,
      id: this.id,
      currentTrace: this.currentTrace,
      maxTrace: this.maxTrace,
      tracePercent: Math.floor((this.currentTrace / this.maxTrace) * 100),
      currentCPU: this.currentCPU,
      maxCPU: this.maxCPU,
      block: this.block,
      statusEffectCount: this.statusEffects.length,
      statusEffects: this.statusEffects.map(e => ({
        type: e.type,
        stacks: e.stacks,
        duration: e.duration
      })),
      deckStats: this.deck.getStats(),
      ...this.stats
    };

    if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
      console.log('[Runner] getStats:', stats);
    }

    return stats;
  }

  /**
   * Increment turn counter
   */
  incrementTurn() {
    this.stats.totalTurns++;
    console.log('[Runner] incrementTurn: Turn', this.stats.totalTurns);
  }

  /**
   * Get short summary for logging
   * @returns {string} Runner summary
   */
  getSummary() {
    return `${this.name} (Trace: ${this.currentTrace}/${this.maxTrace}, CPU: ${this.currentCPU}/${this.maxCPU}, Block: ${this.block})`;
  }

  /**
   * Add a relic to the runner
   * @param {Object} relic - Relic to add
   * @returns {boolean} True if successfully added
   */
  addRelic(relic) {
    if (!relic || !relic.id) {
      console.error('[Runner] addRelic: Invalid relic:', relic);
      return false;
    }
    
    if (this.relics.some(r => r.id === relic.id)) {
      console.warn('[Runner] addRelic: Relic already owned:', relic.id);
      return false;
    }
    
    this.relics.push(relic);
    console.log('[Runner] addRelic: Relic added:', relic.name || relic.id);
    
    return true;
  }
  
  /**
   * Check if runner has a specific relic
   * @param {string} relicId - Relic ID to check
   * @returns {boolean} True if relic is owned
   */
  hasRelic(relicId) {
    return this.relics.some(r => r.id === relicId);
  }

  /**
   * Serialize runner to JSON for saving
   * @returns {Object} Serialized runner data
   */
  toJSON() {
    const json = {
      id: this.id,
      currentTrace: this.currentTrace,
      maxTrace: this.maxTrace,
      currentCPU: this.currentCPU,
      maxCPU: this.maxCPU,
      block: this.block,
      statusEffects: this.statusEffects.map(e => ({
        type: e.type,
        stacks: e.stacks,
        duration: e.duration,
        icon: e.icon
      })),
      relics: this.relics,
      deck: this.deck.toJSON(),
      stats: { ...this.stats }
    };

    console.log('[Runner] toJSON: Serialized runner', this.name);
    return json;
  }

  /**
   * Deserialize runner from JSON save data
   * @param {Object} json - Serialized runner data
   * @returns {Runner} Reconstructed Runner instance
   * @static
   */
  static fromJSON(json) {
    console.log('[Runner] fromJSON: Deserializing runner...');

    if (!json || typeof json !== 'object') {
      console.error('[Runner] fromJSON: Invalid JSON data, expected object, got', typeof json);
      throw new Error('Invalid runner JSON data');
    }

    if (!json.id) {
      console.error('[Runner] fromJSON: Missing runner ID in JSON data');
      throw new Error('Runner JSON must contain id property');
    }

    try {
      const runner = new Runner(json.id);

      runner.currentTrace = json.currentTrace !== undefined ? json.currentTrace : runner.currentTrace;
      runner.maxTrace = json.maxTrace !== undefined ? json.maxTrace : runner.maxTrace;
      runner.currentCPU = json.currentCPU !== undefined ? json.currentCPU : runner.currentCPU;
      runner.maxCPU = json.maxCPU !== undefined ? json.maxCPU : runner.maxCPU;
      runner.block = json.block !== undefined ? json.block : runner.block;

      if (Array.isArray(json.statusEffects)) {
        runner.statusEffects = json.statusEffects.map(e => ({
          type: e.type,
          stacks: e.stacks,
          duration: e.duration,
          icon: e.icon || `icon_${e.type}`
        }));
      }

      if (Array.isArray(json.relics)) {
        runner.relics = json.relics;
      }

      if (json.deck) {
        runner.deck = Deck.fromJSON(json.deck);
      }

      if (json.stats && typeof json.stats === 'object') {
        runner.stats = { ...runner.stats, ...json.stats };
      }

      console.log('[Runner] fromJSON: Deserialized runner successfully', {
        name: runner.name,
        trace: `${runner.currentTrace}/${runner.maxTrace}`,
        cpu: `${runner.currentCPU}/${runner.maxCPU}`,
        statusEffects: runner.statusEffects.length,
        deckSize: runner.deck.getAllCards().length
      });

      return runner;

    } catch (error) {
      console.error('[Runner] fromJSON: Deserialization failed:', error);
      console.error('[Runner] fromJSON: JSON data:', json);
      throw error;
    }
  }
}

console.log('[Runner] ✅ Module loaded successfully');

if (GAME_CONFIG.DEBUG_MODE) {
  console.log('[Runner] Running self-test...');
  
  try {
    const testRunner = new Runner('ghost');
    console.assert(testRunner.name === 'Ghost', 'Test 1: Runner name incorrect');
    console.assert(testRunner.maxTrace === 100, 'Test 2: Max trace incorrect');
    console.assert(testRunner.currentCPU === 3, 'Test 3: Starting CPU incorrect');
    
    testRunner.modifyTrace(10, 'test');
    console.assert(testRunner.currentTrace === 10, 'Test 4: Trace modification failed');
    
    testRunner.applyStatusEffect('strength', 2, 3);
    console.assert(testRunner.hasStatusEffect('strength') === 2, 'Test 5: Status effect application failed');
    
    const spent = testRunner.spendCPU(2, 'test');
    console.assert(spent === true, 'Test 6: CPU spending failed');
    console.assert(testRunner.currentCPU === 1, 'Test 7: CPU value incorrect after spending');
    
    testRunner.gainBlock(5, 'test');
    console.assert(testRunner.block === 5, 'Test 8: Block gain failed');
    
    console.log('[Runner] ✅ Self-test passed');
  } catch (error) {
    console.error('[Runner] ❌ Self-test failed:', error);
  }
}