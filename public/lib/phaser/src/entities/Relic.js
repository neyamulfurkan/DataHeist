console.log('[Relic] Loading Relic class...');

import { RELIC_LIBRARY } from '../data/relicDefinitions.js';

export default class Relic {
  constructor(relicId) {
    if (!relicId || typeof relicId !== 'string') {
      console.error('[Relic] constructor: Invalid relicId:', relicId);
      throw new Error('Relic constructor requires valid relicId string');
    }

    const relicData = RELIC_LIBRARY[relicId];

    if (!relicData) {
      console.error('[Relic] constructor: Relic definition not found:', relicId);
      throw new Error(`Relic ${relicId} not found in RELIC_LIBRARY`);
    }

    this.id = relicData.id;
    this.name = relicData.name;
    this.description = relicData.description;
    this.tier = relicData.tier;
    this.spriteKey = relicData.spriteKey;
    this.effects = { ...relicData.effects };
    this.triggers = [...relicData.triggers];

    this.timesTriggered = 0;
    this.active = true;

    console.log('[Relic] Created:', this.name);
  }

  hasTrigger(triggerType) {
    return this.triggers.includes(triggerType);
  }

  trigger(triggerType, context = {}) {
    if (!this.active) {
      return null;
    }

    if (!this.hasTrigger(triggerType)) {
      return null;
    }

    this.timesTriggered++;

    console.log('[Relic] Triggered:', {
      relic: this.name,
      trigger: triggerType,
      times: this.timesTriggered
    });

    return this.effects;
  }

  getEffectValue(effectKey) {
    return this.effects[effectKey] || 0;
  }

  hasEffect(effectKey) {
    return this.effects.hasOwnProperty(effectKey);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      tier: this.tier,
      spriteKey: this.spriteKey,
      effects: { ...this.effects },
      triggers: [...this.triggers],
      timesTriggered: this.timesTriggered,
      active: this.active
    };
  }

  static fromJSON(data) {
    if (!data || !data.id) {
      console.error('[Relic] fromJSON: Invalid data:', data);
      return null;
    }

    const relic = new Relic(data.id);
    relic.timesTriggered = data.timesTriggered || 0;
    relic.active = data.active !== undefined ? data.active : true;

    return relic;
  }
}

console.log('[Relic] ✅ Class loaded successfully');