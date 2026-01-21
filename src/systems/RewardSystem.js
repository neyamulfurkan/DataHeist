/**
 * RewardSystem.js
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
 * ✓ Console logs use [RewardSystem] prefix
 * ✓ File length is within ±20% of estimate
 * 
 * Purpose: Manages post-combat rewards, card selection, credit distribution, and upgrade offerings
 * Dependencies: config.js, cardDefinitions.js, MathUtils.js, Card.js
 * Used by: BattleScene.js, RewardScene.js, MapScene.js
 */

console.log('[RewardSystem] Loading reward distribution system...');

import { GAME_CONFIG } from '../config.js';
import { CARD_LIBRARY, CARDS_BY_RARITY, getCardById, getRandomCards } from '../data/cardDefinitions.js';
import Card from '../entities/Card.js';
import { weightedRandom, random, pickRandomMultiple, clamp } from '../utils/MathUtils.js';
import { RELICS_BY_TIER, getRelicById } from '../data/relicDefinitions.js';
import Relic from '../entities/Relic.js';

/**
 * @typedef {Object} RewardObject
 * @property {number} credits - Credits earned
 * @property {Card[]} cardChoices - Array of cards to choose from (player picks 1)
 * @property {Object|null} relic - Relic object if earned
 * @property {Array<{type: string, amount: number, reason: string}>} bonusRewards - Extra rewards
 * @property {string} encounterType - Type of encounter (combat, elite, boss)
 * @property {number} actNumber - Current act number
 */

class RewardSystem {
  static instance = null;

  constructor() {
    if (RewardSystem.instance) {
      console.log('[RewardSystem] Returning existing singleton instance');
      return RewardSystem.instance;
    }

    console.log('[RewardSystem] Creating new singleton instance');
    
    this.statistics = {
      totalRewardsGenerated: 0,
      totalCreditsAwarded: 0,
      cardsByRarity: {
        common: 0,
        uncommon: 0,
        rare: 0
      },
      relicsAwarded: 0,
      bonusRewardsTriggered: 0
    };

    this.rewardHistory = [];
    this.maxHistoryLength = 100;

    RewardSystem.instance = this;
    console.log('[RewardSystem] Singleton instance created successfully');
  }

  /**
   * Generate rewards for standard combat encounter
   * @param {string} enemyType - Enemy ID that was defeated
   * @param {number} actNumber - Current act (1-3)
   * @param {boolean} wasFlawless - True if player took no damage
   * @returns {RewardObject} Complete reward object
   */
  generateCombatRewards(enemyType, actNumber, wasFlawless = false) {
    console.log('[RewardSystem] generateCombatRewards called:', { enemyType, actNumber, wasFlawless });

    if (typeof enemyType !== 'string' || !enemyType) {
      console.error('[RewardSystem] generateCombatRewards: Invalid enemyType:', enemyType);
      throw new Error('enemyType must be a valid string');
    }

    if (typeof actNumber !== 'number' || actNumber < 1 || actNumber > 3) {
      console.error('[RewardSystem] generateCombatRewards: Invalid actNumber:', actNumber);
      throw new Error('actNumber must be 1, 2, or 3');
    }

    try {
      const baseCredits = this.calculateCreditReward('combat', actNumber, 1.0);
      const flawlessBonus = wasFlawless ? Math.floor(baseCredits * 0.2) : 0;
      const totalCredits = baseCredits + flawlessBonus;

      const cardChoices = this.selectCardRewards(
        GAME_CONFIG.REWARDS.BASE_CARD_REWARD_CHOICES,
        actNumber
      );

      if (!cardChoices || cardChoices.length === 0) {
        console.error('[RewardSystem] generateCombatRewards: Failed to generate card choices');
        throw new Error('Card reward generation failed');
      }

      const bonusRewards = [];
      if (wasFlawless && flawlessBonus > 0) {
        bonusRewards.push({
          type: 'credits',
          amount: flawlessBonus,
          reason: 'Flawless Victory'
        });
        this.statistics.bonusRewardsTriggered++;
      }

      const rewardObject = {
        credits: totalCredits,
        cardChoices: cardChoices,
        relic: null,
        bonusRewards: bonusRewards,
        encounterType: 'combat',
        actNumber: actNumber
      };

      this._recordReward(rewardObject);

      console.log('[RewardSystem] generateCombatRewards: Generated rewards:', {
        credits: rewardObject.credits,
        cardCount: rewardObject.cardChoices.length,
        wasFlawless: wasFlawless
      });

      return rewardObject;

    } catch (error) {
      console.error('[RewardSystem] generateCombatRewards: Failed to generate rewards:', error);
      console.error('[RewardSystem] generateCombatRewards: Input data:', { enemyType, actNumber, wasFlawless });
      throw error;
    }
  }

  /**
   * Generate rewards for elite combat encounter
   * @param {string} enemyType - Elite enemy ID
   * @param {number} actNumber - Current act (1-3)
   * @param {boolean} wasFlawless - True if player took no damage
   * @returns {RewardObject} Complete reward object
   */
  generateEliteRewards(enemyType, actNumber, wasFlawless = false) {
    console.log('[RewardSystem] generateEliteRewards called:', { enemyType, actNumber, wasFlawless });

    if (typeof enemyType !== 'string' || !enemyType) {
      console.error('[RewardSystem] generateEliteRewards: Invalid enemyType:', enemyType);
      throw new Error('enemyType must be a valid string');
    }

    if (typeof actNumber !== 'number' || actNumber < 1 || actNumber > 3) {
      console.error('[RewardSystem] generateEliteRewards: Invalid actNumber:', actNumber);
      throw new Error('actNumber must be 1, 2, or 3');
    }

    try {
      const baseCredits = this.calculateCreditReward('elite', actNumber, 1.0);
      const flawlessBonus = wasFlawless ? Math.floor(baseCredits * 0.3) : 0;
      const totalCredits = baseCredits + flawlessBonus;

      const cardChoices = this.selectCardRewards(
        GAME_CONFIG.REWARDS.ELITE_CARD_REWARD_CHOICES,
        actNumber,
        'uncommon'
      );

      if (!cardChoices || cardChoices.length === 0) {
        console.error('[RewardSystem] generateEliteRewards: Failed to generate card choices');
        throw new Error('Card reward generation failed');
      }

      const bonusRewards = [];
      if (wasFlawless && flawlessBonus > 0) {
        bonusRewards.push({
          type: 'credits',
          amount: flawlessBonus,
          reason: 'Flawless Elite Victory'
        });
        this.statistics.bonusRewardsTriggered++;
      }

      const relicChance = GAME_CONFIG.REWARDS.ELITE_RELIC_CHANCE;
      const earnedRelic = Math.random() < relicChance ? this.selectRelic(actNumber) : null;

      if (earnedRelic) {
        console.log('[RewardSystem] generateEliteRewards: Relic earned:', earnedRelic);
        this.statistics.relicsAwarded++;
      }

      const rewardObject = {
        credits: totalCredits,
        cardChoices: cardChoices,
        relic: earnedRelic,
        bonusRewards: bonusRewards,
        encounterType: 'elite',
        actNumber: actNumber
      };

      this._recordReward(rewardObject);

      console.log('[RewardSystem] generateEliteRewards: Generated elite rewards:', {
        credits: rewardObject.credits,
        cardCount: rewardObject.cardChoices.length,
        hasRelic: !!rewardObject.relic,
        wasFlawless: wasFlawless
      });

      return rewardObject;

    } catch (error) {
      console.error('[RewardSystem] generateEliteRewards: Failed to generate rewards:', error);
      console.error('[RewardSystem] generateEliteRewards: Input data:', { enemyType, actNumber, wasFlawless });
      throw error;
    }
  }

  /**
   * Generate rewards for boss encounter
   * @param {string} bossId - Boss enemy ID
   * @param {number} actNumber - Current act (1-3)
   * @param {boolean} wasFlawless - True if player took no damage
   * @returns {RewardObject} Complete reward object
   */
  generateBossRewards(bossId, actNumber, wasFlawless = false) {
    console.log('[RewardSystem] generateBossRewards called:', { bossId, actNumber, wasFlawless });

    if (typeof bossId !== 'string' || !bossId) {
      console.error('[RewardSystem] generateBossRewards: Invalid bossId:', bossId);
      throw new Error('bossId must be a valid string');
    }

    if (typeof actNumber !== 'number' || actNumber < 1 || actNumber > 3) {
      console.error('[RewardSystem] generateBossRewards: Invalid actNumber:', actNumber);
      throw new Error('actNumber must be 1, 2, or 3');
    }

    try {
      const baseCredits = this.calculateCreditReward('boss', actNumber, 1.0);
      const flawlessBonus = wasFlawless ? Math.floor(baseCredits * 0.5) : 0;
      const totalCredits = baseCredits + flawlessBonus;

      const cardChoices = this.selectCardRewards(
        GAME_CONFIG.REWARDS.BOSS_CARD_REWARD_CHOICES,
        actNumber,
        'rare'
      );

      if (!cardChoices || cardChoices.length === 0) {
        console.error('[RewardSystem] generateBossRewards: Failed to generate card choices');
        throw new Error('Card reward generation failed');
      }

      const bonusRewards = [];
      if (wasFlawless && flawlessBonus > 0) {
        bonusRewards.push({
          type: 'credits',
          amount: flawlessBonus,
          reason: 'Flawless Boss Victory'
        });
        this.statistics.bonusRewardsTriggered++;
      }

      const guaranteedRelic = GAME_CONFIG.REWARDS.BOSS_GUARANTEED_RELIC;
      const earnedRelic = guaranteedRelic ? this.selectRelic(actNumber) : null;

      if (earnedRelic) {
        console.log('[RewardSystem] generateBossRewards: Boss relic earned:', earnedRelic);
        this.statistics.relicsAwarded++;
      } else if (guaranteedRelic) {
        console.error('[RewardSystem] generateBossRewards: Failed to generate guaranteed boss relic');
      }

      const rewardObject = {
        credits: totalCredits,
        cardChoices: cardChoices,
        relic: earnedRelic,
        bonusRewards: bonusRewards,
        encounterType: 'boss',
        actNumber: actNumber
      };

      this._recordReward(rewardObject);

      console.log('[RewardSystem] generateBossRewards: Generated boss rewards:', {
        credits: rewardObject.credits,
        cardCount: rewardObject.cardChoices.length,
        hasRelic: !!rewardObject.relic,
        wasFlawless: wasFlawless
      });

      return rewardObject;

    } catch (error) {
      console.error('[RewardSystem] generateBossRewards: Failed to generate rewards:', error);
      console.error('[RewardSystem] generateBossRewards: Input data:', { bossId, actNumber, wasFlawless });
      throw error;
    }
  }

  /**
   * Select random cards for reward based on rarity weights
   * @param {number} count - Number of cards to offer
   * @param {number} actNumber - Current act (1-3)
   * @param {string|null} rarityBoost - Boost rarity ('uncommon' or 'rare')
   * @returns {Card[]} Array of Card instances
   */
  selectCardRewards(count, actNumber, rarityBoost = null) {
    console.log('[RewardSystem] selectCardRewards called:', { count, actNumber, rarityBoost });

    if (typeof count !== 'number' || count < 1) {
      console.error('[RewardSystem] selectCardRewards: Invalid count:', count);
      return [];
    }

    if (typeof actNumber !== 'number' || actNumber < 1 || actNumber > 3) {
      console.error('[RewardSystem] selectCardRewards: Invalid actNumber:', actNumber);
      return [];
    }

    try {
      const selectedCards = [];
      const usedCardIds = new Set();

      const weights = this.getRarityWeights(actNumber, rarityBoost);
      console.log('[RewardSystem] selectCardRewards: Using rarity weights:', weights);

      for (let i = 0; i < count; i++) {
        let attempts = 0;
        let selectedCard = null;

        while (attempts < 50 && !selectedCard) {
          const rarity = this._selectRarity(weights);
          
          // CRITICAL FIX: Block legendary cards in Act 1
          if (actNumber === 1 && rarity === 'legendary') {
            console.log('[RewardSystem] selectCardRewards: Act 1 cannot drop legendary, rerolling');
            attempts++;
            continue;
          }
          
          const pool = CARDS_BY_RARITY[rarity];
          if (!pool || pool.length === 0) {
            console.error('[RewardSystem] selectCardRewards: Empty card pool for rarity:', rarity);
            attempts++;
            continue;
          }

          const availableCards = pool.filter(cardDef => !usedCardIds.has(cardDef.id));
          
          if (availableCards.length === 0) {
            console.warn('[RewardSystem] selectCardRewards: No available cards for rarity:', rarity);
            attempts++;
            continue;
          }

          const randomIndex = Math.floor(Math.random() * availableCards.length);
          const cardDef = availableCards[randomIndex];

          try {
            const cardInstance = new Card(cardDef.id);
            selectedCard = cardInstance;
            usedCardIds.add(cardDef.id);
            selectedCards.push(cardInstance);

            this.statistics.cardsByRarity[rarity]++;
            console.log('[RewardSystem] selectCardRewards: Selected card', i + 1, '/', count, ':', cardInstance.name, `(${rarity})`);

          } catch (error) {
            console.error('[RewardSystem] selectCardRewards: Failed to create card instance:', error);
            attempts++;
          }
        }

        if (!selectedCard) {
          console.error('[RewardSystem] selectCardRewards: Failed to select card after 50 attempts for slot', i + 1);
        }
      }

      if (selectedCards.length < count) {
        console.warn('[RewardSystem] selectCardRewards: Only generated', selectedCards.length, 'cards out of', count, 'requested');
      }

      console.log('[RewardSystem] selectCardRewards: Successfully generated', selectedCards.length, 'card rewards');
      return selectedCards;

    } catch (error) {
      console.error('[RewardSystem] selectCardRewards: Critical error during card selection:', error);
      console.error('[RewardSystem] selectCardRewards: Input data:', { count, actNumber, rarityBoost });
      return [];
    }
  }

  /**
   * Get rarity weights based on act number and optional boost
   * @param {number} actNumber - Current act (1-3)
   * @param {string|null} rarityBoost - Boost rarity
   * @returns {Object} Rarity weights object
   * @private
   */
  getRarityWeights(actNumber, rarityBoost = null) {
    let weights = {};

    switch (actNumber) {
      case 1:
        weights = {
          common: GAME_CONFIG.CARDS.ACT1_COMMON_WEIGHT,
          uncommon: GAME_CONFIG.CARDS.ACT1_UNCOMMON_WEIGHT,
          rare: GAME_CONFIG.CARDS.ACT1_RARE_WEIGHT
        };
        break;
      case 2:
        weights = {
          common: GAME_CONFIG.CARDS.ACT2_COMMON_WEIGHT,
          uncommon: GAME_CONFIG.CARDS.ACT2_UNCOMMON_WEIGHT,
          rare: GAME_CONFIG.CARDS.ACT2_RARE_WEIGHT
        };
        break;
      case 3:
        weights = {
          common: GAME_CONFIG.CARDS.ACT3_COMMON_WEIGHT,
          uncommon: GAME_CONFIG.CARDS.ACT3_UNCOMMON_WEIGHT,
          rare: GAME_CONFIG.CARDS.ACT3_RARE_WEIGHT
        };
        break;
      default:
        console.warn('[RewardSystem] getRarityWeights: Invalid actNumber, using Act 1 weights');
        weights = {
          common: GAME_CONFIG.CARDS.ACT1_COMMON_WEIGHT,
          uncommon: GAME_CONFIG.CARDS.ACT1_UNCOMMON_WEIGHT,
          rare: GAME_CONFIG.CARDS.ACT1_RARE_WEIGHT
        };
    }

    if (rarityBoost === 'uncommon') {
      weights.uncommon += 20;
      weights.common -= 15;
      weights.rare -= 5;
    } else if (rarityBoost === 'rare') {
      weights.rare += 30;
      weights.uncommon += 10;
      weights.common -= 40;
    }

    weights.common = Math.max(0, weights.common);
    weights.uncommon = Math.max(0, weights.uncommon);
    weights.rare = Math.max(0, weights.rare);

    const total = weights.common + weights.uncommon + weights.rare;
    if (total <= 0) {
      console.error('[RewardSystem] getRarityWeights: Total weight is 0 or negative:', weights);
      return { common: 70, uncommon: 25, rare: 5 };
    }

    return weights;
  }

  /**
   * Select rarity using weighted random
   * @param {Object} weights - Rarity weights
   * @returns {string} Selected rarity
   * @private
   */
  _selectRarity(weights) {
    const options = [
      { value: 'common', weight: weights.common },
      { value: 'uncommon', weight: weights.uncommon },
      { value: 'rare', weight: weights.rare }
    ];

    const selected = weightedRandom(options);
    
    if (!selected) {
      console.error('[RewardSystem] _selectRarity: weightedRandom returned null, defaulting to common');
      return 'common';
    }

    return selected;
  }

  /**
   * Calculate credit reward for encounter
   * @param {string} encounterType - Type of encounter (combat, elite, boss)
   * @param {number} actNumber - Current act (1-3)
   * @param {number} multiplier - Reward multiplier
   * @returns {number} Credit amount
   */
  calculateCreditReward(encounterType, actNumber, multiplier = 1.0) {
    console.log('[RewardSystem] calculateCreditReward called:', { encounterType, actNumber, multiplier });

    if (typeof encounterType !== 'string') {
      console.error('[RewardSystem] calculateCreditReward: Invalid encounterType:', encounterType);
      return 0;
    }

    if (typeof actNumber !== 'number' || actNumber < 1 || actNumber > 3) {
      console.error('[RewardSystem] calculateCreditReward: Invalid actNumber:', actNumber);
      return 0;
    }

    if (typeof multiplier !== 'number' || multiplier < 0) {
      console.error('[RewardSystem] calculateCreditReward: Invalid multiplier:', multiplier);
      multiplier = 1.0;
    }

    try {
      let baseCredits = 0;
      let variance = 0;

      switch (encounterType.toLowerCase()) {
        case 'combat':
          baseCredits = GAME_CONFIG.REWARDS.BASE_COMBAT_CREDITS;
          variance = GAME_CONFIG.REWARDS.COMBAT_CREDITS_VARIANCE;
          break;
        case 'elite':
          baseCredits = GAME_CONFIG.REWARDS.ELITE_COMBAT_CREDITS;
          variance = GAME_CONFIG.REWARDS.ELITE_CREDITS_VARIANCE;
          break;
        case 'boss':
          baseCredits = GAME_CONFIG.REWARDS.BOSS_COMBAT_CREDITS;
          variance = GAME_CONFIG.REWARDS.BOSS_CREDITS_VARIANCE;
          break;
        default:
          console.error('[RewardSystem] calculateCreditReward: Unknown encounterType:', encounterType);
          return 0;
      }

      const actMultiplier = 1 + ((actNumber - 1) * 0.2);
      
      const randomVariance = variance > 0 ? random(-variance, variance) : 0;
      
      const finalCredits = Math.floor(
        baseCredits * actMultiplier * multiplier + randomVariance
      );

      const clampedCredits = Math.max(1, finalCredits);

      console.log('[RewardSystem] calculateCreditReward: Calculated credits:', {
        base: baseCredits,
        actMultiplier: actMultiplier,
        multiplier: multiplier,
        variance: randomVariance,
        final: clampedCredits
      });

      this.statistics.totalCreditsAwarded += clampedCredits;

      return clampedCredits;

    } catch (error) {
      console.error('[RewardSystem] calculateCreditReward: Error during calculation:', error);
      console.error('[RewardSystem] calculateCreditReward: Input data:', { encounterType, actNumber, multiplier });
      return 0;
    }
  }

  /**
   * Get list of upgradeable cards from deck
   * @param {Card[]} deck - Player's current deck
   * @returns {Card[]} Array of cards that can be upgraded
   */
  getUpgradeableCards(deck) {
    console.log('[RewardSystem] getUpgradeableCards called with deck size:', deck ? deck.length : 0);

    if (!Array.isArray(deck)) {
      console.error('[RewardSystem] getUpgradeableCards: Invalid deck, expected array, got', typeof deck);
      return [];
    }

    if (deck.length === 0) {
      console.warn('[RewardSystem] getUpgradeableCards: Empty deck provided');
      return [];
    }

    try {
      const upgradeable = deck.filter(card => {
        if (!card) {
          console.warn('[RewardSystem] getUpgradeableCards: Null card in deck');
          return false;
        }

        const maxLevel = GAME_CONFIG.CARDS.MAX_UPGRADE_LEVEL;
        const canUpgrade = card.upgradeLevel < maxLevel;

        if (!canUpgrade && GAME_CONFIG.LOG_VERBOSE) {
          console.log('[RewardSystem] getUpgradeableCards: Card already max level:', card.name);
        }

        return canUpgrade;
      });

      console.log('[RewardSystem] getUpgradeableCards: Found', upgradeable.length, 'upgradeable cards out of', deck.length, 'total');

      return upgradeable;

    } catch (error) {
      console.error('[RewardSystem] getUpgradeableCards: Error during filtering:', error);
      console.error('[RewardSystem] getUpgradeableCards: Deck size:', deck.length);
      return [];
    }
  }

  /**
   * Generate event reward
   * @param {Object} eventChoice - Event choice object with consequences
   * @returns {RewardObject} Reward object
   */
  generateEventReward(eventChoice) {
    console.log('[RewardSystem] generateEventReward called:', eventChoice);

    if (!eventChoice || typeof eventChoice !== 'object') {
      console.error('[RewardSystem] generateEventReward: Invalid eventChoice:', eventChoice);
      return this._getEmptyReward();
    }

    try {
      const reward = {
        credits: eventChoice.credits || 0,
        cardChoices: [],
        relic: eventChoice.relic || null,
        bonusRewards: [],
        encounterType: 'event',
        actNumber: eventChoice.actNumber || 1
      };

      if (eventChoice.cardReward) {
        const count = eventChoice.cardCount || 1;
        const actNumber = eventChoice.actNumber || 1;
        reward.cardChoices = this.selectCardRewards(count, actNumber);
      }

      if (eventChoice.healTrace) {
        reward.bonusRewards.push({
          type: 'heal',
          amount: eventChoice.healTrace,
          reason: 'Event Choice'
        });
      }

      if (eventChoice.maxTraceIncrease) {
        reward.bonusRewards.push({
          type: 'maxTrace',
          amount: eventChoice.maxTraceIncrease,
          reason: 'Event Choice'
        });
      }

      this._recordReward(reward);

      console.log('[RewardSystem] generateEventReward: Generated event reward:', {
        credits: reward.credits,
        cardCount: reward.cardChoices.length,
        hasRelic: !!reward.relic,
        bonusCount: reward.bonusRewards.length
      });

      return reward;

    } catch (error) {
      console.error('[RewardSystem] generateEventReward: Failed to generate event reward:', error);
      console.error('[RewardSystem] generateEventReward: Event choice data:', eventChoice);
      return this._getEmptyReward();
    }
  }

  /**
   * Get available relic pool for act
   * @param {number} actNumber - Current act (1-3)
   * @returns {string[]} Array of relic IDs
   */
getRelicPool(actNumber) {
    console.log('[RewardSystem] getRelicPool called for act:', actNumber);

    if (typeof actNumber !== 'number' || actNumber < 1 || actNumber > 3) {
      console.error('[RewardSystem] getRelicPool: Invalid actNumber:', actNumber);
      return [];
    }

    const baseRelics = RELICS_BY_TIER.base.map(r => r.id);
    const advancedRelics = RELICS_BY_TIER.advanced.map(r => r.id);
    const eliteRelics = RELICS_BY_TIER.elite.map(r => r.id);
    
    let relicPool = [...baseRelics];
    
    if (actNumber >= 2) {
      relicPool = [...relicPool, ...advancedRelics];
    }
    
    if (actNumber >= 3) {
      relicPool = [...relicPool, ...eliteRelics];
    }

    console.log('[RewardSystem] getRelicPool: Returning', relicPool.length, 'relics for act', actNumber);

    return relicPool;
  }

  /**
   * Select random relic from pool
   * @param {number} actNumber - Current act (1-3)
   * @returns {Object|null} Relic object
   */
  selectRelic(actNumber) {
    console.log('[RewardSystem] selectRelic called for act:', actNumber);

    if (typeof actNumber !== 'number' || actNumber < 1 || actNumber > 3) {
      console.error('[RewardSystem] selectRelic: Invalid actNumber:', actNumber);
      return null;
    }

    try {
      const pool = this.getRelicPool(actNumber);

      if (!pool || pool.length === 0) {
        console.error('[RewardSystem] selectRelic: Empty relic pool for act', actNumber);
        return null;
      }

      const randomIndex = Math.floor(Math.random() * pool.length);
      const relicId = pool[randomIndex];

      const relicData = getRelicById(relicId);
      if (!relicData) {
        console.error('[RewardSystem] selectRelic: Relic data not found:', relicId);
        return null;
      }

      const relic = new Relic(relicId);

      console.log('[RewardSystem] selectRelic: Selected relic:', relic.name);

      return relic;

    } catch (error) {
      console.error('[RewardSystem] selectRelic: Error selecting relic:', error);
      console.error('[RewardSystem] selectRelic: Act number:', actNumber);
      return null;
    }
  }

  /**
   * Select 3 random relics for player to choose from
   * @param {number} actNumber - Current act (1-3)
   * @param {string[]} ownedRelicIds - Relics player already has (to avoid duplicates)
   * @returns {Relic[]} Array of 3 Relic instances
   */
  selectRelicChoices(actNumber, ownedRelicIds = []) {
    console.log('[RewardSystem] selectRelicChoices called for act:', actNumber);

    if (typeof actNumber !== 'number' || actNumber < 1 || actNumber > 3) {
      console.error('[RewardSystem] selectRelicChoices: Invalid actNumber:', actNumber);
      return [];
    }

    try {
      const pool = this.getRelicPool(actNumber);

      if (!pool || pool.length === 0) {
        console.error('[RewardSystem] selectRelicChoices: Empty relic pool for act', actNumber);
        return [];
      }

      // Filter out relics player already owns
      const availablePool = pool.filter(relicId => !ownedRelicIds.includes(relicId));

      if (availablePool.length === 0) {
        console.warn('[RewardSystem] selectRelicChoices: Player owns all relics! Using full pool');
        availablePool.push(...pool);
      }

      // Select 3 unique relics
      const selectedRelics = [];
      const usedIds = new Set();

      const choiceCount = Math.min(3, availablePool.length);

      while (selectedRelics.length < choiceCount) {
        const randomIndex = Math.floor(Math.random() * availablePool.length);
        const relicId = availablePool[randomIndex];

        if (!usedIds.has(relicId)) {
          const relicData = getRelicById(relicId);
          if (relicData) {
            const relic = new Relic(relicId);
            selectedRelics.push(relic);
            usedIds.add(relicId);
          }
        }

        // Safety: prevent infinite loop
        if (usedIds.size >= availablePool.length) break;
      }

      console.log('[RewardSystem] selectRelicChoices: Selected', selectedRelics.length, 'relic choices');
      return selectedRelics;

    } catch (error) {
      console.error('[RewardSystem] selectRelicChoices: Error selecting relics:', error);
      return [];
    }
  }

  /**
   * Get relic name by ID
   * @param {string} relicId - Relic ID
   * @returns {string} Relic display name
   * @private
   */


  /**
   * Record reward to statistics and history
   * @param {RewardObject} reward - Reward object
   * @private
   */
  _recordReward(reward) {
    this.statistics.totalRewardsGenerated++;

    if (this.rewardHistory.length >= this.maxHistoryLength) {
      this.rewardHistory.shift();
    }

    this.rewardHistory.push({
      timestamp: Date.now(),
      encounterType: reward.encounterType,
      credits: reward.credits,
      cardCount: reward.cardChoices.length,
      hasRelic: !!reward.relic
    });

    if (GAME_CONFIG.LOG_VERBOSE) {
      console.log('[RewardSystem] _recordReward: Reward recorded to history');
    }
  }

  /**
   * Get empty reward object
   * @returns {RewardObject} Empty reward
   * @private
   */
  _getEmptyReward() {
    return {
      credits: 0,
      cardChoices: [],
      relic: null,
      bonusRewards: [],
      encounterType: 'none',
      actNumber: 1
    };
  }

  /**
   * Get current statistics
   * @returns {Object} Statistics object
   */
  getStatistics() {
    return {
      ...this.statistics,
      averageCreditsPerReward: this.statistics.totalRewardsGenerated > 0
        ? Math.floor(this.statistics.totalCreditsAwarded /this.statistics.totalRewardsGenerated)
        : 0
    };
  }

  /**
   * Reset statistics
   */
  resetStatistics() {
    console.log('[RewardSystem] resetStatistics: Resetting all statistics');
    
    this.statistics = {
      totalRewardsGenerated: 0,
      totalCreditsAwarded: 0,
      cardsByRarity: {
        common: 0,
        uncommon: 0,
        rare: 0
      },
      relicsAwarded: 0,
      bonusRewardsTriggered: 0
    };

    this.rewardHistory = [];
  }
}

const rewardSystem = new RewardSystem();

console.log('[RewardSystem] ✅ Module loaded successfully');
console.log('[RewardSystem] Singleton instance ready');

if (GAME_CONFIG.DEBUG_MODE) {
  console.log('[RewardSystem] Self-test deferred - will run after systems initialize');
}

export default rewardSystem;