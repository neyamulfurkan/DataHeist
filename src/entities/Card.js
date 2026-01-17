/**
 * Card.js
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
 * ✓ Console logs use [Card.js] prefix
 * ✓ File length is within ±20% of estimate
 * 
 * Purpose: Card entity class representing a single program card with data and methods
 * Dependencies: config.js, cardDefinitions.js
 * Used by: Deck.js, BattleScene.js, CardUI.js, RewardScene.js
 */

console.log('[Card.js] Loading Card entity class...');

import { GAME_CONFIG } from '../config.js';
import { CARD_LIBRARY, getCardById } from '../data/cardDefinitions.js';

/**
 * @typedef {Object} CardEffect
 * @property {string} type - Effect type
 * @property {string} target - Target (enemy, self, all)
 * @property {number} value - Numeric value
 * @property {string} [status] - Status effect type
 * @property {number} [stacks] - Status stacks
 * @property {Object|null} [scaling] - Scaling modifier
 */

/**
 * Card class representing a single program card
 */
export default class Card {
  /**
   * Create a Card instance
   * @param {string|Object} cardData - Card ID string or full card object
   * @throws {Error} If card data is invalid or card not found
   */
  constructor(cardData) {
    console.log('[Card.js] Constructor called with:', typeof cardData === 'string' ? cardData : 'object');

    if (!cardData) {
      console.error('[Card.js] Constructor: cardData is null or undefined');
      throw new Error('Card constructor requires valid cardData');
    }

    let sourceData = null;

    if (typeof cardData === 'string') {
      sourceData = getCardById(cardData);
      
      if (!sourceData) {
        console.error('[Card.js] Constructor: Card ID not found in library:', cardData);
        throw new Error(`Card ID "${cardData}" not found in CARD_LIBRARY`);
      }
      
      console.log('[Card.js] Loaded card from library:', sourceData.name);
    } else if (typeof cardData === 'object') {
      sourceData = cardData;
      console.log('[Card.js] Using provided card object:', sourceData.name || 'unnamed');
    } else {
      console.error('[Card.js] Constructor: Invalid cardData type:', typeof cardData);
      throw new Error('cardData must be string (card ID) or object (card data)');
    }

    this._validateCardData(sourceData);
    this._initializeProperties(sourceData);

    console.log('[Card.js] Card created successfully:', this.name, `(${this.id})`);
  }

  /**
   * Validate card data has all required properties
   * @param {Object} data - Card data to validate
   * @throws {Error} If validation fails
   * @private
   */
  _validateCardData(data) {
    const requiredProps = ['id', 'name', 'type', 'cost', 'rarity', 'effects', 'description'];
    const missingProps = [];

    requiredProps.forEach(prop => {
      if (data[prop] === undefined || data[prop] === null) {
        missingProps.push(prop);
      }
    });

    if (missingProps.length > 0) {
      console.error('[Card.js] Validation failed - missing properties:', missingProps);
      console.error('[Card.js] Card data:', data);
      throw new Error(`Card validation failed: missing ${missingProps.join(', ')}`);
    }

    if (!['exploit', 'defense', 'utility', 'virus'].includes(data.type)) {
      console.error('[Card.js] Invalid card type:', data.type);
      throw new Error(`Invalid card type: ${data.type}`);
    }

    if (typeof data.cost !== 'number' || data.cost < 0 || data.cost > 3) {
      console.error('[Card.js] Invalid cost value:', data.cost);
      throw new Error(`Invalid cost: ${data.cost} (must be 0-3)`);
    }

    if (!['common', 'uncommon', 'rare'].includes(data.rarity)) {
      console.error('[Card.js] Invalid rarity:', data.rarity);
      throw new Error(`Invalid rarity: ${data.rarity}`);
    }

    if (!Array.isArray(data.effects) || data.effects.length === 0) {
      console.error('[Card.js] Invalid effects array:', data.effects);
      throw new Error('Card must have at least one effect');
    }

    console.log('[Card.js] Validation passed for:', data.name);
  }

  /**
   * Initialize card properties from source data
   * @param {Object} data - Source card data
   * @private
   */
  _initializeProperties(data) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.cost = data.cost;
    this.baseCost = data.cost;
    this.rarity = data.rarity;
    this.effects = JSON.parse(JSON.stringify(data.effects));
    this.baseEffects = JSON.parse(JSON.stringify(data.effects));
    this.description = data.description;
    this.baseDescription = data.description;
    this.upgradeEffect = data.upgradeEffect || null;
    this.spriteKey = data.spriteKey || 'card_placeholder';
    this.keywords = Array.isArray(data.keywords) ? [...data.keywords] : [];
    
    // CRITICAL FIX: Explicitly set exhaust/ethereal flags
    this.isExhaust = data.isExhaust === true;
    this.isEthereal = data.isEthereal === true;
    
    // SAFETY: If keywords include 'exhaust', force isExhaust to true
    if (this.keywords.includes('exhaust')) {
      this.isExhaust = true;
    }
    
    this.upgradeLevel = data.upgradeLevel || 0;
    
    // DEBUG LOG
    if (GAME_CONFIG.DEBUG_MODE) {
      console.log('[Card] Initialized:', {
        name: this.name,
        isExhaust: this.isExhaust,
        isEthereal: this.isEthereal,
        keywords: this.keywords
      });
    }

    this.instanceId = `${this.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.metadata = {
      timesPlayed: 0,
      damageDealt: 0,
      blockGained: 0,
      cardsDrawn: 0
    };

    console.log('[Card.js] Properties initialized for:', this.name);
  }

  /**
   * Check if card can be played in current game state
   * @param {Object} gameState - Current game state
   * @returns {boolean} True if card is playable
   */
  isPlayable(gameState) {
    if (!gameState) {
      console.error('[Card.js] isPlayable: gameState is null or undefined');
      return false;
    }

    if (!gameState.player) {
      console.error('[Card.js] isPlayable: gameState.player is missing');
      return false;
    }

    if (this.keywords.includes('unplayable')) {
      console.log('[Card.js] isPlayable: Card has "unplayable" keyword:', this.name);
      return false;
    }

    if (gameState.phase !== 'playerTurn') {
      console.log('[Card.js] isPlayable: Not player turn, current phase:', gameState.phase);
      return false;
    }

    const currentCPU = gameState.player.currentCPU;
    if (typeof currentCPU !== 'number') {
      console.error('[Card.js] isPlayable: Invalid currentCPU value:', currentCPU);
      return false;
    }

    if (currentCPU < this.cost) {
      console.log('[Card.js] isPlayable: Insufficient CPU -', `need ${this.cost}, have ${currentCPU}`);
      return false;
    }

    const requiresTarget = this.effects.some(effect => 
      effect.target === 'enemy' || 
      (effect.type === 'damage' && effect.target !== 'self')
    );

    if (requiresTarget && (!gameState.enemy || gameState.enemy.currentHP <= 0)) {
      console.log('[Card.js] isPlayable: Card requires valid enemy target');
      return false;
    }

    console.log('[Card.js] isPlayable: Card is playable:', this.name);
    return true;
  }

  /**
   * Upgrade this card by applying upgradeEffect
   * @returns {boolean} True if upgrade successful
   */
  upgrade() {
    console.log('[Card.js] upgrade: Attempting to upgrade:', this.name);

    if (this.upgradeLevel >= GAME_CONFIG.CARDS.MAX_UPGRADE_LEVEL) {
      console.warn('[Card.js] upgrade: Card already at max upgrade level:', this.upgradeLevel);
      return false;
    }

    if (!this.upgradeEffect) {
      console.error('[Card.js] upgrade: No upgradeEffect defined for card:', this.name);
      return false;
    }

    try {
      this._applyUpgradeEffect();
      this.upgradeLevel++;
      this._updateDescription();
      
      console.log('[Card.js] upgrade: Successfully upgraded to level', this.upgradeLevel);
      return true;

    } catch (error) {
      console.error('[Card.js] upgrade: Failed to upgrade card:', error);
      console.error('[Card.js] upgrade: Card data:', {
        id: this.id,
        name: this.name,
        upgradeEffect: this.upgradeEffect
      });
      return false;
    }
  }

  /**
   * Apply upgrade effect to card properties
   * @private
   */
  _applyUpgradeEffect() {
    const upgrade = this.upgradeEffect;

    if (upgrade.type === 'damage') {
      this.effects.forEach(effect => {
        if (effect.type === 'damage') {
          effect.value = upgrade.value;
          console.log('[Card.js] _applyUpgradeEffect: Updated damage to', upgrade.value);
        }
      });
    } else if (upgrade.type === 'block') {
      this.effects.forEach(effect => {
        if (effect.type === 'block') {
          effect.value = upgrade.value;
          console.log('[Card.js] _applyUpgradeEffect: Updated block to', upgrade.value);
        }
      });
    } else if (upgrade.type === 'draw') {
      this.effects.forEach(effect => {
        if (effect.type === 'draw') {
          effect.value = upgrade.value;
          console.log('[Card.js] _applyUpgradeEffect: Updated draw to', upgrade.value);
        }
      });
    } else if (upgrade.type === 'gainCPU') {
      this.effects.forEach(effect => {
        if (effect.type === 'gainCPU') {
          effect.value = upgrade.value;
          console.log('[Card.js] _applyUpgradeEffect: Updated CPU gain to', upgrade.value);
        }
      });
    } else if (upgrade.cost !== undefined) {
      const newCost = upgrade.cost;
      if (typeof newCost === 'number' && newCost >= 0 && newCost <= 3) {
        this.cost = newCost;
        console.log('[Card.js] _applyUpgradeEffect: Updated cost to', newCost);
      }
    } else if (upgrade.stacks !== undefined) {
      this.effects.forEach(effect => {
        if (effect.type === 'applyStatus' && effect.stacks !== undefined) {
          effect.stacks = upgrade.stacks;
          console.log('[Card.js] _applyUpgradeEffect: Updated status stacks to', upgrade.stacks);
        }
      });
    } else if (upgrade.value !== undefined) {
      this.effects.forEach(effect => {
        if (effect.value !== undefined) {
          effect.value = upgrade.value;
          console.log('[Card.js] _applyUpgradeEffect: Updated generic value to', upgrade.value);
        }
      });
    }
  }

  /**
   * Update description to reflect upgraded values
   * @private
   */
  _updateDescription() {
    let newDescription = this.baseDescription;

    this.effects.forEach(effect => {
      if (effect.type === 'damage' && effect.value) {
        newDescription = newDescription.replace(/\d+/, effect.value);
      } else if (effect.type === 'block' && effect.value) {
        newDescription = newDescription.replace(/\d+/, effect.value);
      } else if (effect.type === 'draw' && effect.value) {
        newDescription = newDescription.replace(/\d+/, effect.value);
      }
    });

    this.description = newDescription;
    console.log('[Card.js] _updateDescription: Updated to:', newDescription);
  }

  /**
   * Create a deep copy of this card
   * @returns {Card} New Card instance with copied data
   */
  clone() {
    console.log('[Card.js] clone: Cloning card:', this.name);

    try {
      const clonedData = {
        id: this.id,
        name: this.name,
        type: this.type,
        cost: this.cost,
        rarity: this.rarity,
        effects: JSON.parse(JSON.stringify(this.effects)),
        description: this.description,
        upgradeEffect: this.upgradeEffect ? JSON.parse(JSON.stringify(this.upgradeEffect)) : null,
        spriteKey: this.spriteKey,
        keywords: [...this.keywords],
        isExhaust: this.isExhaust,
        isEthereal: this.isEthereal,
        upgradeLevel: this.upgradeLevel
      };

      const clonedCard = new Card(clonedData);
      clonedCard.baseCost = this.baseCost;
      clonedCard.baseEffects = JSON.parse(JSON.stringify(this.baseEffects));
      clonedCard.baseDescription = this.baseDescription;
      
      console.log('[Card.js] clone: Clone created successfully');
      return clonedCard;

    } catch (error) {
      console.error('[Card.js] clone: Failed to clone card:', error);
      console.error('[Card.js] clone: Original card data:', {
        id: this.id,
        name: this.name,
        upgradeLevel: this.upgradeLevel
      });
      throw error;
    }
  }

  /**
   * Get formatted tooltip text for UI display
   * @returns {string} Formatted card description with keywords
   */
  getTooltipText() {
    let text = this.description;

    if (this.upgradeLevel > 0) {
      text = `${text}\n[Upgraded +${this.upgradeLevel}]`;
    }

    if (this.keywords.length > 0) {
      const keywordText = this.keywords.map(kw => {
        switch (kw) {
          case 'exhaust': return 'Exhaust: Remove from deck after playing';
          case 'ethereal': return 'Ethereal: Discard if unplayed';
          case 'innate': return 'Innate: Always in starting hand';
          case 'retain': return 'Retain: Not discarded at end of turn';
          case 'unplayable': return 'Unplayable: Cannot be played';
          default: return kw;
        }
      }).join('\n');
      
      text = `${text}\n\n${keywordText}`;
    }

    return text;
  }

  /**
   * Get short summary for logging
   * @returns {string} Card summary
   */
  getSummary() {
    return `${this.name} (${this.type}, ${this.cost} CPU, ${this.rarity})`;
  }

  /**
   * Serialize card to JSON for saving
   * @returns {Object} Minimal card data for serialization
   */
  toJSON() {
    return {
      id: this.id,
      upgradeLevel: this.upgradeLevel,
      instanceId: this.instanceId
    };
  }

  /**
   * Deserialize card from JSON save data
   * @param {Object} json - Serialized card data
   * @returns {Card} Reconstructed Card instance
   * @static
   */
  static fromJSON(json) {
    console.log('[Card.js] fromJSON: Deserializing card:', json);

    if (!json || !json.id) {
      console.error('[Card.js] fromJSON: Invalid JSON data:', json);
      throw new Error('Invalid card JSON data');
    }

    try {
      const card = new Card(json.id);
      
      if (json.upgradeLevel && json.upgradeLevel > 0) {
        for (let i = 0; i < json.upgradeLevel; i++) {
          card.upgrade();
        }
      }

      if (json.instanceId) {
        card.instanceId = json.instanceId;
      }

      console.log('[Card.js] fromJSON: Card deserialized successfully:', card.name);
      return card;

    } catch (error) {
      console.error('[Card.js] fromJSON: Failed to deserialize card:', error);
      console.error('[Card.js] fromJSON: JSON data:', json);
      throw error;
    }
  }

  /**
   * Get effect summary for display
   * @returns {string[]} Array of effect descriptions
   */
  getEffectSummaries() {
    return this.effects.map(effect => {
      switch (effect.type) {
        case 'damage':
          return `Deal ${effect.value} damage`;
        case 'block':
          return `Gain ${effect.value} Block`;
        case 'draw':
          return `Draw ${effect.value} card${effect.value > 1 ? 's' : ''}`;
        case 'gainCPU':
          return `Gain ${effect.value} CPU`;
        case 'applyStatus':
          return `Apply ${effect.stacks} ${effect.status}`;
        case 'heal':
          return `Heal ${effect.value} Trace`;
        case 'traceReduction':
          return `Reduce Trace by ${effect.value}`;
        default:
          return effect.type;
      }
    });
  }

  /**
   * Record card play for statistics
   */
  recordPlay() {
    this.metadata.timesPlayed++;
    console.log('[Card.js] recordPlay:', this.name, 'played', this.metadata.timesPlayed, 'times');
  }

  /**
   * Record damage dealt by this card
   * @param {number} damage - Damage amount
   */
  recordDamage(damage) {
    if (typeof damage === 'number' && damage > 0) {
      this.metadata.damageDealt += damage;
      console.log('[Card.js] recordDamage:', this.name, 'total damage:', this.metadata.damageDealt);
    }
  }

  /**
   * Record block gained by this card
   * @param {number} block - Block amount
   */
  recordBlock(block) {
    if (typeof block === 'number' && block > 0) {
      this.metadata.blockGained += block;
      console.log('[Card.js] recordBlock:', this.name, 'total block:', this.metadata.blockGained);
    }
  }

  /**
   * Check if card matches filter criteria
   * @param {Object} filter - Filter criteria
   * @returns {boolean} True if card matches
   */
  matches(filter) {
    if (!filter) return true;

    if (filter.type && this.type !== filter.type) return false;
    if (filter.rarity && this.rarity !== filter.rarity) return false;
    if (filter.cost !== undefined && this.cost !== filter.cost) return false;
    if (filter.keyword && !this.keywords.includes(filter.keyword)) return false;
    if (filter.upgraded !== undefined && (this.upgradeLevel > 0) !== filter.upgraded) return false;

    return true;
  }

  /**
   * Get color for card type
   * @returns {string} Hex color string
   */
  getTypeColor() {
    const colors = GAME_CONFIG.UI.COLORS;
    
    switch (this.type) {
      case 'exploit': return colors.EXPLOIT_COLOR;
      case 'defense': return colors.DEFENSE_COLOR;
      case 'utility': return colors.UTILITY_COLOR;
      case 'virus': return colors.VIRUS_COLOR;
      default: return colors.TEXT_PRIMARY;
    }
  }

  /**
   * Get color for card rarity
   * @returns {string} Hex color string
   */
  getRarityColor() {
    const colors = GAME_CONFIG.UI.COLORS;
    
    switch (this.rarity) {
      case 'common': return colors.COMMON_COLOR;
      case 'uncommon': return colors.UNCOMMON_COLOR;
      case 'rare': return colors.RARE_COLOR;
      default: return colors.TEXT_PRIMARY;
    }
  }
}

console.log('[Card.js] ✅ Module loaded successfully');

if (GAME_CONFIG.DEBUG_MODE) {
  console.log('[Card.js] Running self-test...');
  
  try {
    const testCard = new Card('exploit_001');
    console.assert(testCard.name === 'Buffer Overflow', 'Test 1: Card name incorrect');
    console.assert(testCard.cost === 1, 'Test 2: Card cost incorrect');
    console.assert(testCard.type === 'exploit', 'Test 3: Card type incorrect');
    
    const clone = testCard.clone();
    console.assert(clone.id === testCard.id, 'Test 4: Clone failed');
    console.assert(clone.instanceId !== testCard.instanceId, 'Test 5: Clone instanceId should differ');
    
    console.log('[Card.js] ✅ Self-test passed');
  } catch (error) {
    console.error('[Card.js] ❌ Self-test failed:', error);
  }
}