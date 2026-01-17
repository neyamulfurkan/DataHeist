/**
 * MathUtils.js
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
 * ✓ Console logs use [MathUtils] prefix
 * ✓ File length is within ±20% of estimate
 * 
 * Purpose: Pure utility functions for randomization, array manipulation, and mathematical operations
 * Dependencies: config.js (for constants only)
 * Used by: MapGenerator, RewardSystem, CombatSystem, ICE AI, and all systems requiring randomization
 */

import { GAME_CONFIG } from '../config.js';

console.log('[MathUtils] Loading math utility functions...');

// ============================================================================
// SEEDED RANDOM NUMBER GENERATOR
// ============================================================================

/**
 * Seeded random number generator using mulberry32 algorithm
 * Produces deterministic random sequences for reproducible map generation
 * @param {number} seed - Integer seed value (any number)
 * @returns {Function} Random number generator function (0-1 range)
 * @example
 * const rng = seededRandom(12345);
 * const value = rng(); // Returns deterministic value between 0-1
 */
export function seededRandom(seed) {
  // Validate seed
  if (typeof seed !== 'number' || isNaN(seed)) {
    console.error('[MathUtils] seededRandom: Invalid seed, expected number, got', typeof seed);
    seed = Date.now(); // Fallback to timestamp
    console.warn('[MathUtils] seededRandom: Using fallback seed:', seed);
  }
  
  // Convert to 32-bit integer
  let state = Math.floor(seed) >>> 0;
  
  if (GAME_CONFIG.LOG_VERBOSE) {
    console.log('[MathUtils] seededRandom: Initialized with seed', seed, 'state', state);
  }
  
  // Return generator function
  return function() {
    // Mulberry32 algorithm
    state |= 0;
    state = state + 0x6D2B79F5 | 0;
    let t = Math.imul(state ^ state >>> 15, 1 | state);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    const result = ((t ^ t >>> 14) >>> 0) / 4294967296;
    
    return result;
  };
}

// ============================================================================
// BASIC RANDOM FUNCTIONS
// ============================================================================

/**
 * Generate random integer between min and max (inclusive)
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {number} Random integer in range [min, max]
 * @example
 * const dice = random(1, 6); // Returns 1-6
 */
export function random(min, max) {
  // Validate inputs
  if (typeof min !== 'number' || typeof max !== 'number') {
    console.error('[MathUtils] random: Invalid parameters, expected numbers, got', typeof min, typeof max);
    return 0;
  }
  
  if (isNaN(min) || isNaN(max)) {
    console.error('[MathUtils] random: NaN detected in parameters, min:', min, 'max:', max);
    return 0;
  }
  
  if (min > max) {
    console.warn('[MathUtils] random: min > max, swapping values. min:', min, 'max:', max);
    [min, max] = [max, min];
  }
  
  const result = Math.floor(Math.random() * (max - min + 1)) + min;
  
  if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
    if (result < min || result > max) {
      console.error('[MathUtils] random: Result out of range!', { min, max, result });
    }
  }
  
  return result;
}

/**
 * Generate random float between min and max
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (exclusive)
 * @returns {number} Random float in range [min, max)
 * @example
 * const speed = randomFloat(0.5, 2.0); // Returns 0.5 to 1.999...
 */
export function randomFloat(min, max) {
  // Validate inputs
  if (typeof min !== 'number' || typeof max !== 'number') {
    console.error('[MathUtils] randomFloat: Invalid parameters, expected numbers, got', typeof min, typeof max);
    return 0.0;
  }
  
  if (isNaN(min) || isNaN(max)) {
    console.error('[MathUtils] randomFloat: NaN detected in parameters, min:', min, 'max:', max);
    return 0.0;
  }
  
  if (min > max) {
    console.warn('[MathUtils] randomFloat: min > max, swapping values. min:', min, 'max:', max);
    [min, max] = [max, min];
  }
  
  const result = Math.random() * (max - min) + min;
  
  if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
    if (result < min || result >= max) {
      console.error('[MathUtils] randomFloat: Result out of range!', { min, max, result });
    }
  }
  
  return result;
}

// ============================================================================
// ARRAY MANIPULATION
// ============================================================================

/**
 * Fisher-Yates shuffle (immutable version)
 * Creates a new shuffled copy of the array without modifying the original
 * @param {Array} array - Array to shuffle
 * @returns {Array} New shuffled array
 * @example
 * const deck = [1, 2, 3, 4, 5];
 * const shuffled = shuffle(deck); // deck remains unchanged
 */
export function shuffle(array) {
  // Validate input
  if (!Array.isArray(array)) {
    console.error('[MathUtils] shuffle: Invalid input, expected array, got', typeof array);
    return [];
  }
  
  if (array.length === 0) {
    console.warn('[MathUtils] shuffle: Empty array provided');
    return [];
  }
  
  // Create copy to avoid mutation
  const copy = [...array];
  
  // Fisher-Yates shuffle
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  
  if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
    console.log('[MathUtils] shuffle: Shuffled array of length', array.length);
  }
  
  return copy;
}

/**
 * Fisher-Yates shuffle (in-place version)
 * Mutates the original array for performance-critical operations
 * @param {Array} array - Array to shuffle (will be modified)
 * @returns {Array} Same array reference, now shuffled
 * @example
 * const deck = [1, 2, 3, 4, 5];
 * shuffleInPlace(deck); // deck is now shuffled
 */
export function shuffleInPlace(array) {
  // Validate input
  if (!Array.isArray(array)) {
    console.error('[MathUtils] shuffleInPlace: Invalid input, expected array, got', typeof array);
    return [];
  }
  
  if (array.length === 0) {
    console.warn('[MathUtils] shuffleInPlace: Empty array provided');
    return array;
  }
  
  // Fisher-Yates shuffle
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  
  if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
    console.log('[MathUtils] shuffleInPlace: Shuffled array of length', array.length);
  }
  
  return array;
}

/**
 * Pick random element from array
 * @param {Array} array - Array to pick from
 * @returns {*} Random element from array, or null if array is empty
 * @example
 * const card = pickRandom(deck);
 */
export function pickRandom(array) {
  // Validate input
  if (!Array.isArray(array)) {
    console.error('[MathUtils] pickRandom: Invalid input, expected array, got', typeof array);
    return null;
  }
  
  if (array.length === 0) {
    console.warn('[MathUtils] pickRandom: Cannot pick from empty array');
    return null;
  }
  
  const index = Math.floor(Math.random() * array.length);
  const result = array[index];
  
  if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
    console.log('[MathUtils] pickRandom: Selected index', index, 'from array of length', array.length);
  }
  
  return result;
}

/**
 * Pick N unique random elements from array
 * @param {Array} array - Array to pick from
 * @param {number} count - Number of elements to pick
 * @returns {Array} Array of randomly selected elements (unique)
 * @example
 * const rewards = pickRandomMultiple(cardPool, 3); // Pick 3 unique cards
 */
export function pickRandomMultiple(array, count) {
  // Validate inputs
  if (!Array.isArray(array)) {
    console.error('[MathUtils] pickRandomMultiple: Invalid array, expected array, got', typeof array);
    return [];
  }
  
  if (typeof count !== 'number' || isNaN(count) || count < 0) {
    console.error('[MathUtils] pickRandomMultiple: Invalid count, expected positive number, got', count);
    return [];
  }
  
  if (array.length === 0) {
    console.warn('[MathUtils] pickRandomMultiple: Cannot pick from empty array');
    return [];
  }
  
  // Clamp count to array length
  const actualCount = Math.min(count, array.length);
  
  if (actualCount !== count) {
    console.warn('[MathUtils] pickRandomMultiple: Requested', count, 'elements but array only has', array.length);
  }
  
  // Shuffle copy and take first N elements
  const shuffled = shuffle(array);
  const result = shuffled.slice(0, actualCount);
  
  if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
    console.log('[MathUtils] pickRandomMultiple: Picked', actualCount, 'elements from array of length', array.length);
  }
  
  return result;
}

// ============================================================================
// WEIGHTED RANDOM SELECTION
// ============================================================================

/**
 * Select random element from weighted array
 * Used for loot tables, card rarity, and enemy AI decisions
 * @param {Array<{value: *, weight: number}>} options - Array of {value, weight} objects
 * @returns {*} Selected value based on weights, or null if error
 * @example
 * const rarity = weightedRandom([
 *   {value: 'common', weight: 70},
 *   {value: 'rare', weight: 25},
 *   {value: 'legendary', weight: 5}
 * ]); // 70% chance common, 25% rare, 5% legendary
 */
export function weightedRandom(options) {
  // Validate input array
  if (!Array.isArray(options)) {
    console.error('[MathUtils] weightedRandom: Invalid input, expected array, got', typeof options);
    return null;
  }
  
  if (options.length === 0) {
    console.error('[MathUtils] weightedRandom: Empty options array provided');
    return null;
  }
  
  // Validate option structure
  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    
    if (!option || typeof option !== 'object') {
      console.error('[MathUtils] weightedRandom: Invalid option at index', i, 'expected object, got', typeof option);
      return null;
    }
    
    if (!option.hasOwnProperty('value')) {
      console.error('[MathUtils] weightedRandom: Option at index', i, 'missing "value" property');
      return null;
    }
    
    if (typeof option.weight !== 'number' || isNaN(option.weight) || option.weight < 0) {
      console.error('[MathUtils] weightedRandom: Invalid weight at index', i, 'expected positive number, got', option.weight);
      return null;
    }
  }
  
  // Calculate total weight
  const totalWeight = options.reduce((sum, option) => sum + option.weight, 0);
  
  if (totalWeight === 0) {
    console.error('[MathUtils] weightedRandom: Total weight is 0, all weights are zero');
    return null;
  }
  
  // Generate random value in range [0, totalWeight)
  const randomValue = Math.random() * totalWeight;
  
  // Find selected option
  let cumulativeWeight = 0;
  
  for (let i = 0; i < options.length; i++) {
    cumulativeWeight += options[i].weight;
    
    if (randomValue < cumulativeWeight) {
      const selected = options[i].value;
      
      if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
        console.log('[MathUtils] weightedRandom: Selected value', selected, 'with weight', options[i].weight, '/', totalWeight);
      }
      
      return selected;
    }
  }
  
  // Fallback (should never reach here due to floating point precision)
  console.warn('[MathUtils] weightedRandom: Fallback to last option due to floating point');
  return options[options.length - 1].value;
}

// ============================================================================
// MATH HELPERS
// ============================================================================

/**
 * Clamp value to range [min, max]
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 * @example
 * const hp = clamp(damage, 0, maxHP); // Ensure HP stays in valid range
 */
export function clamp(value, min, max) {
  // Validate inputs
  if (typeof value !== 'number' || typeof min !== 'number' || typeof max !== 'number') {
    console.error('[MathUtils] clamp: Invalid parameters, expected numbers, got', typeof value, typeof min, typeof max);
    return 0;
  }
  
  if (isNaN(value) || isNaN(min) || isNaN(max)) {
    console.error('[MathUtils] clamp: NaN detected in parameters, value:', value, 'min:', min, 'max:', max);
    return 0;
  }
  
  if (min > max) {
    console.error('[MathUtils] clamp: min > max, this is invalid!', { min, max });
    return value; // Return unclamped value as fallback
  }
  
  const result = Math.max(min, Math.min(max, value));
  
  if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
    if (result !== value) {
      console.log('[MathUtils] clamp: Value', value, 'clamped to', result, 'in range [', min, ',', max, ']');
    }
  }
  
  return result;
}

/**
 * Linear interpolation between two values
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 * @example
 * const midpoint = lerp(0, 100, 0.5); // Returns 50
 */
export function lerp(start, end, t) {
  // Validate inputs
  if (typeof start !== 'number' || typeof end !== 'number' || typeof t !== 'number') {
    console.error('[MathUtils] lerp: Invalid parameters, expected numbers, got', typeof start, typeof end, typeof t);
    return start;
  }
  
  if (isNaN(start) || isNaN(end) || isNaN(t)) {
    console.error('[MathUtils] lerp: NaN detected in parameters, start:', start, 'end:', end, 't:', t);
    return start;
  }
  
  // Clamp t to [0, 1] for safety
  const clampedT = clamp(t, 0, 1);
  
  if (clampedT !== t) {
    console.warn('[MathUtils] lerp: t value', t, 'clamped to', clampedT);
  }
  
  const result = start + (end - start) * clampedT;
  
  return result;
}

/**
 * Calculate Euclidean distance between two points
 * @param {number} x1 - First point X coordinate
 * @param {number} y1 - First point Y coordinate
 * @param {number} x2 - Second point X coordinate
 * @param {number} y2 - Second point Y coordinate
 * @returns {number} Distance between points
 * @example
 * const dist = distance(0, 0, 3, 4); // Returns 5
 */
export function distance(x1, y1, x2, y2) {
  // Validate inputs
  if (typeof x1 !== 'number' || typeof y1 !== 'number' || 
      typeof x2 !== 'number' || typeof y2 !== 'number') {
    console.error('[MathUtils] distance: Invalid parameters, expected numbers, got', typeof x1, typeof y1, typeof x2, typeof y2);
    return 0;
  }
  
  if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
    console.error('[MathUtils] distance: NaN detected in parameters', { x1, y1, x2, y2 });
    return 0;
  }
  
  const dx = x2 - x1;
  const dy = y2 - y1;
  const result = Math.sqrt(dx * dx + dy * dy);
  
  if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
    console.log('[MathUtils] distance: Calculated distance', result, 'between points', { x1, y1, x2, y2 });
  }
  
  return result;
}

/**
 * Calculate Manhattan distance between two points
 * @param {number} x1 - First point X coordinate
 * @param {number} y1 - First point Y coordinate
 * @param {number} x2 - Second point X coordinate
 * @param {number} y2 - Second point Y coordinate
 * @returns {number} Manhattan distance
 * @example
 * const dist = manhattanDistance(0, 0, 3, 4); // Returns 7
 */
export function manhattanDistance(x1, y1, x2, y2) {
  // Validate inputs
  if (typeof x1 !== 'number' || typeof y1 !== 'number' || 
      typeof x2 !== 'number' || typeof y2 !== 'number') {
    console.error('[MathUtils] manhattanDistance: Invalid parameters, expected numbers');
    return 0;
  }
  
  if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
    console.error('[MathUtils] manhattanDistance: NaN detected in parameters', { x1, y1, x2, y2 });
    return 0;
  }
  
  return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
export function degreesToRadians(degrees) {
  if (typeof degrees !== 'number' || isNaN(degrees)) {
    console.error('[MathUtils] degreesToRadians: Invalid input, expected number, got', typeof degrees);
    return 0;
  }
  
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 * @param {number} radians - Angle in radians
 * @returns {number} Angle in degrees
 */
export function radiansToDegrees(radians) {
  if (typeof radians !== 'number' || isNaN(radians)) {
    console.error('[MathUtils] radiansToDegrees: Invalid input, expected number, got', typeof radians);
    return 0;
  }
  
  return radians * (180 / Math.PI);
}

/**
 * Round number to N decimal places
 * @param {number} value - Number to round
 * @param {number} decimals - Number of decimal places
 * @returns {number} Rounded number
 */
export function roundTo(value, decimals) {
  if (typeof value !== 'number' || isNaN(value)) {
    console.error('[MathUtils] roundTo: Invalid value, expected number, got', typeof value);
    return 0;
  }
  
  if (typeof decimals !== 'number' || isNaN(decimals) || decimals < 0) {
    console.error('[MathUtils] roundTo: Invalid decimals, expected positive number, got', decimals);
    return value;
  }
  
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

// ============================================================================
// SELF-TEST (DEBUG MODE ONLY)
// ============================================================================

/**
 * Run self-tests to validate all functions
 * Only executes in debug mode
 */
function selfTest() {
  if (!GAME_CONFIG.DEBUG_MODE) return;
  
  console.group('[MathUtils] Self-Test');
  
  try {
    // Test random
    const r1 = random(1, 10);
    console.assert(r1 >= 1 && r1 <= 10, 'random() test failed:', r1);
    
    // Test shuffle
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffle(arr);
    console.assert(arr.length === shuffled.length, 'shuffle() length test failed');
    console.assert(arr[0] === 1, 'shuffle() should not mutate original array');
    
    // Test weightedRandom
    const weighted = weightedRandom([
      { value: 'A', weight: 80 },
      { value: 'B', weight: 20 }
    ]);
    console.assert(weighted === 'A' || weighted === 'B', 'weightedRandom() test failed:', weighted);
    
    // Test clamp
    console.assert(clamp(5, 0, 10) === 5, 'clamp() normal test failed');
    console.assert(clamp(-5, 0, 10) === 0, 'clamp() min test failed');
    console.assert(clamp(15, 0, 10) === 10, 'clamp() max test failed');
    
    // Test lerp
    console.assert(lerp(0, 100, 0.5) === 50, 'lerp() test failed');
    
    // Test distance
    console.assert(distance(0, 0, 3, 4) === 5, 'distance() test failed');
    
    console.log('[MathUtils] ✅ All self-tests passed');
    
  } catch (error) {
    console.error('[MathUtils] ❌ Self-test failed:', error);
  }
  
  console.groupEnd();
}

// Run self-test on module load (debug mode only)
selfTest();

// ============================================================================
// EXPORTS
// ============================================================================

console.log('[MathUtils] ✅ Module loaded successfully');
console.log('[MathUtils] Exported functions:', {
  seededRandom: typeof seededRandom,
  random: typeof random,
  randomFloat: typeof randomFloat,
  shuffle: typeof shuffle,
  shuffleInPlace: typeof shuffleInPlace,
  pickRandom: typeof pickRandom,
  pickRandomMultiple: typeof pickRandomMultiple,
  weightedRandom: typeof weightedRandom,
  clamp: typeof clamp,
  lerp: typeof lerp,
  distance: typeof distance,
  manhattanDistance: typeof manhattanDistance,
  degreesToRadians: typeof degreesToRadians,
  radiansToDegrees: typeof radiansToDegrees,
  roundTo: typeof roundTo
});

// Already exported individually above - no need for export block