/**
 * config.js
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
 * ✓ Console logs use [config.js] prefix
 * ✓ File length is within ±20% of estimate
 * 
 * Purpose: Central configuration file containing ALL game constants, balance values, and settings
 * Dependencies: NONE (base file)
 * Used by: ALL other files in the project
 */

console.log('[config.js] Loading game configuration...');

/**
 * @typedef {Object} GameConfig
 * Main configuration object containing all game constants and settings
 */
export const GAME_CONFIG = {
  // ============================================================================
  // PHASER ENGINE CONFIGURATION
  // ============================================================================
  PHASER: {
    WIDTH: 1280,
    HEIGHT: 720,
    CANVAS_ID: 'game-canvas',
    PARENT: 'game-container',
    BACKGROUND_COLOR: '#0a0e27',
    PIXEL_ART: false,
    ANTIALIAS: true,
    RENDER_TYPE: 'AUTO', // AUTO, CANVAS, or WEBGL
    PHYSICS: {
      DEFAULT: 'arcade',
      ARCADE: {
        gravity: { y: 0 },
        debug: false
      }
    },
    SCALE: {
      MODE: 'FIT', // FIT, SMOOTH, or NONE
      AUTO_CENTER: 'CENTER_BOTH',
      MIN_WIDTH: 800,
      MIN_HEIGHT: 600,
      MAX_WIDTH: 1920,
      MAX_HEIGHT: 1080
    },
    FPS: {
      TARGET: 60,
      MIN: 30,
      SMOOTH_STEP: true,
      PANIC_MAX: 120
    }
  },

  // ============================================================================
  // GAME RULES - CORE GAMEPLAY
  // ============================================================================
  GAMEPLAY: {
    // Card Management
    BASE_HAND_SIZE: 5,
    MAX_HAND_SIZE: 10,
    STARTING_DRAW_SIZE: 5,
    CARDS_DRAWN_PER_TURN: 5,
    
    // CPU (Energy) System
    STARTING_CPU: 3,
    MAX_CPU: 3,
    MIN_CPU_COST: 0,
    MAX_CPU_COST: 3,
    
    // Trace (Health) System
    STARTING_TRACE: 0,
    MAX_TRACE: 100,
    MIN_TRACE: 0,
    TRACE_GAME_OVER_THRESHOLD: 100,
    
    // Block (Shield) System
    STARTING_BLOCK: 0,
    MAX_BLOCK: 999,
    BLOCK_CARRIES_OVER: false, // Block resets each turn
    
    // Turn System
    STARTING_TURN: 1,
    MAX_TURNS_PER_COMBAT: 99,
    TURN_TIME_LIMIT: null, // null = no time limit (turn-based)
    
    // Deck Constraints
    MIN_DECK_SIZE: 1,
    MAX_DECK_SIZE: 50,
    STARTING_DECK_SIZE: 10,
    
    // Status Effect Limits
    MAX_STATUS_STACKS: 99,
    MIN_STATUS_STACKS: 0,
    STATUS_DURATION_PERMANENT: -1
  },

  // ============================================================================
  // COMBAT BALANCE - DAMAGE & EFFECTS
  // ============================================================================
  COMBAT: {
    // Damage Multipliers
    WEAK_MULTIPLIER: 0.75,
    VULNERABLE_MULTIPLIER: 1.5,
    STRENGTH_BONUS_PER_STACK: 2,
    DEXTERITY_BLOCK_BONUS_PER_STACK: 2,
    
    // Minimum Values
    MIN_DAMAGE: 0,
    MIN_BLOCK: 0,
    MIN_HEAL: 0,
    
    // Maximum Values
    MAX_DAMAGE_PER_HIT: 999,
    MAX_BLOCK_PER_CARD: 999,
    MAX_HEAL_PER_TURN: 50,
    
    // Status Effect Values
    POISON_DAMAGE_PER_STACK: 3,
    REGEN_HEAL_PER_STACK: 2,
    BURN_DAMAGE_PER_STACK: 2,
    BURN_DURATION_REDUCTION: 1,
    
    // Critical Hit System (if implemented)
    BASE_CRIT_CHANCE: 0,
    CRIT_DAMAGE_MULTIPLIER: 2.0,
    
    // ICE AI Behavior
    AI_INTENT_RANDOMNESS: 0.1, // 10% chance to deviate from pattern
    AI_DIFFICULTY_SCALING: 1.0, // Multiplier for later acts
    AI_AGGRESSIVE_THRESHOLD: 0.5, // HP % when behavior changes
    
    // Trace Generation
    TRACE_PER_DAMAGE_TAKEN: 1.0, // 1:1 ratio
    TRACE_REDUCTION_FLOOR: 0, // Can't reduce below 0
    TRACE_INCREASE_FLOOR: 0,
    TRACE_INCREASE_CEILING: 100
  },

  // ============================================================================
  // CARD BALANCE - RARITY & REWARDS
  // ============================================================================
  CARDS: {
    // Rarity Distribution Weights (Act 1)
    ACT1_COMMON_WEIGHT: 70,
    ACT1_UNCOMMON_WEIGHT: 25,
    ACT1_RARE_WEIGHT: 5,
    ACT1_LEGENDARY_WEIGHT: 0,
    
    // Rarity Distribution Weights (Act 2)
    ACT2_COMMON_WEIGHT: 60,
    ACT2_UNCOMMON_WEIGHT: 30,
    ACT2_RARE_WEIGHT: 10,
    ACT2_LEGENDARY_WEIGHT: 0,
    
    // Rarity Distribution Weights (Act 3)
    ACT3_COMMON_WEIGHT: 50,
    ACT3_UNCOMMON_WEIGHT: 35,
    ACT3_RARE_WEIGHT: 13,
    ACT3_LEGENDARY_WEIGHT: 2,
    
    // Card Reward Counts
    BASE_CARD_REWARD_CHOICES: 3,
    ELITE_CARD_REWARD_CHOICES: 3,
    BOSS_CARD_REWARD_CHOICES: 5,
    
    // Upgrade Values (applied when card is upgraded)
    UPGRADE_DAMAGE_BONUS: 3,
    UPGRADE_BLOCK_BONUS: 2,
    UPGRADE_CPU_REDUCTION: 1,
    UPGRADE_DRAW_BONUS: 1,
    
    // Card Limits
    MAX_COPIES_IN_DECK: 99, // No limit
    MAX_UPGRADE_LEVEL: 1, // Cards can only be upgraded once
    
    // Skip Card Option
    ALLOW_SKIP_CARD_REWARD: true,
    SKIP_CARD_CREDITS_BONUS: 50
  },

  // ============================================================================
  // REWARD SCALING - CREDITS & DROPS
  // ============================================================================
  REWARDS: {
    // Combat Credits
    BASE_COMBAT_CREDITS: 30,
    COMBAT_CREDITS_VARIANCE: 10, // ±10 credits
    ELITE_COMBAT_CREDITS: 70,
    ELITE_CREDITS_VARIANCE: 10,
    BOSS_COMBAT_CREDITS: 150,
    BOSS_CREDITS_VARIANCE: 0,
    
    // Event Credits
    EVENT_CREDITS_MIN: 10,
    EVENT_CREDITS_MAX: 80,
    
    // Meta-Progression Conversion
    CREDIT_TO_META_CONVERSION: 0.1, // 10% of run credits → permanent
    META_CREDITS_ON_DEFEAT: 0.05, // 5% conversion on loss
    META_CREDITS_ON_VICTORY: 0.15, // 15% conversion on win
    
    // Relic Drops
    BOSS_GUARANTEED_RELIC: true,
    ELITE_RELIC_CHANCE: 0.1, // 10% chance
    COMBAT_RELIC_CHANCE: 0.01, // 1% chance
    
    // Special Rewards
    RARE_EVENT_CHANCE: 0.1, // 10% chance for rare event after combat
    BONUS_REWARD_CHANCE: 0.05 // 5% chance for extra reward
  },

  // ============================================================================
  // MAP GENERATION - NETWORK STRUCTURE
  // ============================================================================
  MAP: {
    // Map Structure
    NODES_PER_ACT: 15,
    ACTS_PER_RUN: 3,
    ROWS_PER_ACT: 6,
    
    // Node Distribution
    COMBAT_NODE_RATIO: 0.50, // 50% combat nodes
    ELITE_NODE_RATIO: 0.15, // 15% elite nodes
    EVENT_NODE_RATIO: 0.20, // 20% event nodes
    UPGRADE_NODE_RATIO: 0.10, // 10% upgrade terminals
    REWARD_NODE_RATIO: 0.05, // 5% data vaults
    
    // Node Connections
    MIN_CONNECTIONS_PER_NODE: 1,
    MAX_CONNECTIONS_PER_NODE: 2,
    CONNECTION_PROXIMITY_THRESHOLD: 200, // pixels
    
    // Node Placement
    NODE_HORIZONTAL_SPACING: 200,
    NODE_VERTICAL_SPACING: 120,
    NODE_RANDOM_OFFSET: 30, // ±30 pixels random offset
    
    // Special Rules
    ELITE_ADJACENT_FORBIDDEN: true, // No adjacent elite nodes
    MIN_NODES_BEFORE_ELITE: 3,
    BOSS_NODE_ROW: 6, // Always last row
    
    // Visual Settings
    PATH_LINE_WIDTH: 3,
    PATH_LINE_COLOR: 0x00f0ff,
    PATH_LINE_ALPHA: 0.6,
    VISITED_PATH_COLOR: 0x1a1a2e,
    VISITED_PATH_ALPHA: 0.3
  },

  // ============================================================================
  // UI & VISUAL CONSTANTS - COLORS & DIMENSIONS
  // ============================================================================
  UI: {
    // Color Palette (Cyberpunk Theme)
    COLORS: {
      // Primary Colors
      BACKGROUND_DARK: '#0a0e27',
      BACKGROUND_MID: '#1a1a2e',
      
      // Accent Colors
      CYAN_PRIMARY: '#00f0ff',
      MAGENTA_PRIMARY: '#ff00ff',
      GREEN_SUCCESS: '#00ff88',
      RED_WARNING: '#ff0055',
      YELLOW_CAUTION: '#ffcc00',
      
      // Card Type Colors
      EXPLOIT_COLOR: '#00f0ff', // Cyan
      DEFENSE_COLOR: '#ff00ff', // Magenta
      UTILITY_COLOR: '#00ff88', // Green
      VIRUS_COLOR: '#ff0055', // Red
      
      // Rarity Colors
      COMMON_COLOR: '#cccccc',
      UNCOMMON_COLOR: '#00ff88',
      RARE_COLOR: '#00f0ff',
      LEGENDARY_COLOR: '#ff00ff',
      
      // UI Elements
      TEXT_PRIMARY: '#ffffff',
      TEXT_SECONDARY: '#cccccc',
      TEXT_DISABLED: '#666666',
      
      // Status Effects
      BUFF_COLOR: '#00ff88',
      DEBUFF_COLOR: '#ff0055',
      NEUTRAL_COLOR: '#ffcc00',
      
      // Trace Meter
      TRACE_LOW: '#00ff88', // < 33%
      TRACE_MED: '#ffcc00', // 33-66%
      TRACE_HIGH: '#ff0055', // > 66%
      
      // Intent Colors
      INTENT_ATTACK: '#ff0055',
      INTENT_DEFEND: '#00f0ff',
      INTENT_BUFF: '#00ff88',
      INTENT_DEBUFF: '#ff00ff'
    },
    
    // Hex to Number Conversion (for Phaser)
    COLOR_HEX: {
      BACKGROUND_DARK: 0x0a0e27,
      BACKGROUND_MID: 0x1a1a2e,
      CYAN_PRIMARY: 0x00f0ff,
      MAGENTA_PRIMARY: 0xff00ff,
      GREEN_SUCCESS: 0x00ff88,
      RED_WARNING: 0xff0055,
      YELLOW_CAUTION: 0xffcc00,
      WHITE: 0xffffff,
      BLACK: 0x000000
    },
    
    // Card Dimensions
    CARD: {
      WIDTH: 200,
      HEIGHT: 300,
      BORDER_WIDTH: 3,
      CORNER_RADIUS: 8,
      SHADOW_OFFSET: 5,
      SHADOW_BLUR: 10,
      
      // Card Spacing
      HAND_SPACING: 20,
      HAND_Y_POSITION: 580,
      HAND_ARC_STRENGTH: 30, // Vertical arc for hand fan
      
      // Hover Effects
      HOVER_SCALE: 1.1,
      HOVER_Y_OFFSET: -30,
      SELECTED_SCALE: 1.2,
      
      // Icon Sizes
      ICON_SIZE: 40,
      TYPE_ICON_SIZE: 30,
      COST_ICON_SIZE: 35
    },
    
    // HUD Elements
    HUD: {
      TRACE_METER_WIDTH: 300,
      TRACE_METER_HEIGHT: 30,
      TRACE_METER_X: 640,
      TRACE_METER_Y: 30,
      
      CPU_DISPLAY_X: 100,
      CPU_DISPLAY_Y: 30,
      CPU_ORB_SIZE: 40,
      CPU_ORB_SPACING: 10,
      
      DECK_COUNT_X: 60,
      DECK_COUNT_Y: 690,
      
      DISCARD_COUNT_X: 1220,
      DISCARD_COUNT_Y: 690,
      
      EXHAUST_COUNT_X: 1100,
      EXHAUST_COUNT_Y: 690,
      
      END_TURN_BUTTON_X: 640,
      END_TURN_BUTTON_Y: 690,
      END_TURN_BUTTON_WIDTH: 160,
      END_TURN_BUTTON_HEIGHT: 45,
      
      PILE_CARD_WIDTH: 60,
      PILE_CARD_HEIGHT: 90
    },
    
// Enemy Display
    ENEMY: {
      SPRITE_X: 640,
      SPRITE_Y: 200,
      SPRITE_SCALE: 0.4,
      
      HP_BAR_WIDTH: 300,
      HP_BAR_HEIGHT: 20,
      HP_BAR_X: 640,
      HP_BAR_Y: 420,
      
      INTENT_ICON_SIZE: 35,
      INTENT_ICON_X: 640,
      INTENT_ICON_Y: 70,
      
      NAME_TEXT_Y: 180,
      STATUS_EFFECTS_Y: 380,
      STATUS_ICON_SIZE: 30,
      STATUS_ICON_SPACING: 35
    },
    
    // Map Nodes
    NODE: {
      SIZE: 60,
      ICON_SIZE: 40,
      LABEL_OFFSET_Y: 40,
      
      // Node States
      AVAILABLE_ALPHA: 1.0,
      UNAVAILABLE_ALPHA: 0.3,
      VISITED_ALPHA: 0.5,
      CLEARED_ALPHA: 0.6,
      
      // Hover Effect
      HOVER_SCALE: 1.2,
      HOVER_GLOW: true
    },
    
    // Text Styles
    TEXT: {
      FONT_FAMILY: 'Share Tech Mono, Courier Prime, monospace',
      
      TITLE: {
        fontSize: '48px',
        fontWeight: 'bold',
        color: '#00f0ff'
      },
      
      SUBTITLE: {
        fontSize: '32px',
        fontWeight: 'normal',
        color: '#ffffff'
      },
      
      BODY: {
        fontSize: '24px',
        fontWeight: 'normal',
        color: '#cccccc'
      },
      
      CARD_NAME: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#ffffff'
      },
      
      CARD_DESCRIPTION: {
        fontSize: '16px',
        fontWeight: 'normal',
        color: '#cccccc',
        wordWrap: { width: 180 }
      },
      
      CARD_COST: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#00f0ff'
      },
      
      DAMAGE_NUMBER: {
        fontSize: '36px',
        fontWeight: 'bold',
        color: '#ff0055'
      },
      
      BUTTON: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#ffffff'
      }
    },
    
    // Layout Spacing
    PADDING: {
      SCREEN_EDGE: 20,
      CONTAINER: 15,
      ELEMENT: 10,
      SMALL: 5
    },
    
    // Z-Index Layers
    Z_INDEX: {
      BACKGROUND: 0,
      MAP_PATHS: 10,
      MAP_NODES: 20,
      ENEMY: 30,
      CARDS: 40,
      HOVER_CARD: 50,
      HUD: 60,
      TOOLTIPS: 70,
      MODALS: 80,
      DEBUG: 100
    }
  },

  // ============================================================================
  // ANIMATION TIMINGS - TWEENS & EFFECTS
  // ============================================================================
  ANIMATION: {
    CARD_PLAY_DURATION: 300,
    CARD_DRAW_DURATION: 400,
    TOOLTIP_DELAY: 150,
    CARD_DISCARD_DURATION: 250,
    CARD_EXHAUST_DURATION: 500,
    CARD_HOVER_DURATION: 150,
    
    // Combat Animations
    DAMAGE_NUMBER_DURATION: 500,
    DAMAGE_NUMBER_RISE: 50, // pixels
    BLOCK_GAIN_DURATION: 300,
    HEAL_EFFECT_DURATION: 400,
    
    // Trace Meter
    TRACE_UPDATE_DURATION: 400,
    TRACE_PULSE_DURATION: 200,
    TRACE_WARNING_INTERVAL: 1000, // Pulse when high
    
    // Turn Transitions
    TURN_TRANSITION_DELAY: 800,
    PHASE_TRANSITION_DURATION: 500,
    
    // Victory/Defeat
    VICTORY_SCREEN_DELAY: 2000,
    DEFEAT_SCREEN_DELAY: 1500,
    SCREEN_FADE_DURATION: 1000,
    
    // UI Elements
    BUTTON_HOVER_DURATION: 100,
    BUTTON_CLICK_DURATION: 150,
    TOOLTIP_FADE_DURATION: 200,
    MODAL_FADE_DURATION: 300,
    
    // Map Animations
    NODE_APPEAR_DURATION: 300,
    NODE_SELECT_DURATION: 250,
    PATH_DRAW_DURATION: 400,
    
    // Status Effects
    STATUS_APPLY_DURATION: 300,
    STATUS_TICK_DURATION: 400,
    STATUS_REMOVE_DURATION: 250,
    
    // General
    QUICK_FADE: 150,
    MEDIUM_FADE: 300,
    SLOW_FADE: 500,
    
    // Easing Functions (for reference)
    EASE_IN: 'Power2.easeIn',
    EASE_OUT: 'Power2.easeOut',
    EASE_IN_OUT: 'Power2.easeInOut',
    ELASTIC: 'Elastic.easeOut',
    BOUNCE: 'Bounce.easeOut'
  },

  // ============================================================================
  // AUDIO SETTINGS - MUSIC & SOUND
  // ============================================================================
  AUDIO: {
    // Volume Settings
    DEFAULT_MUSIC_VOLUME: 0.7,
    DEFAULT_SFX_VOLUME: 0.8,
    MIN_VOLUME: 0.0,
    MAX_VOLUME: 1.0,
    
    // Music Transitions
    MUSIC_FADE_DURATION: 1000, // ms
    MUSIC_CROSSFADE_DURATION: 1500,
    
    // Sound Categories
    CATEGORIES: {
      MUSIC: 'music',
      SFX: 'sfx',
      UI: 'ui',
      COMBAT: 'combat',
      AMBIENT: 'ambient'
    },
    
    // Asset Keys (for reference)
    MUSIC_KEYS: {
      MAIN_MENU: 'music_menu',
      MAP: 'music_map',
      COMBAT: 'music_combat',
      BOSS: 'music_boss',
      VICTORY: 'music_victory'
    },
    
    SFX_KEYS: {
      CARD_PLAY: 'sfx_card_play',
      CARD_DRAW: 'sfx_card_draw',
      DAMAGE: 'sfx_damage',
      BLOCK: 'sfx_block',
      TRACE_INCREASE: 'sfx_trace',
      TURN_END: 'sfx_turn_end',
      VICTORY: 'sfx_victory',
      DEFEAT: 'sfx_defeat',
      BUTTON_CLICK: 'sfx_ui_click',
      BUTTON_HOVER: 'sfx_ui_hover',
      NODE_SELECT: 'sfx_node_click'
    }
  },

  // ============================================================================
  // ASSET FILE PATHS - FOR LOADING
  // ============================================================================
  ASSETS: {
    // Base Paths
    SPRITE_PATH: 'assets/sprites/',
    AUDIO_PATH: 'assets/audio/',
    FONT_PATH: 'assets/fonts/',
    
    // Sprite Folders
    CARDS: 'assets/sprites/cards/',
    RUNNERS: 'assets/sprites/runners/',
    ICE: 'assets/sprites/enemies/',
    UI: 'assets/sprites/ui/',
    ICONS: 'assets/sprites/icons/',
    EFFECTS: 'assets/sprites/effects/',
    
    // Audio Folders
    MUSIC: 'assets/audio/music/',
    SFX: 'assets/audio/sfx/',
    
    // Placeholder Assets (if real assets not available)
    USE_PLACEHOLDERS: false,
    PLACEHOLDER_COLOR: 0x444444
  },

  // ============================================================================
  // DIFFICULTY MODIFIERS - OPTIONAL CHALLENGES
  // ============================================================================
  DIFFICULTY: {
    // Base Difficulty
    BASE_DIFFICULTY: 1.0,
    
    // Modifiers (unlocked after first victory)
    AGGRESSIVE_ICE: {
      enabled: false,
      damageMultiplier: 1.5,
      rewardMultiplier: 1.5,
      traceMultiplier: 1.3
    },
    
    LOW_BANDWIDTH: {
      enabled: false,
      startingCPU: 2,
      maxCPU: 2,
      rewardMultiplier: 1.3
    },
    
    MINIMAL_DECK: {
      enabled: false,
      startingDeckSize: 7,
      rewardMultiplier: 1.4
    },
    
    ELITE_RUSH: {
      enabled: false,
      eliteNodeRatio: 0.35, // Double elite nodes
      rewardMultiplier: 1.6
    },
    
    // Act Scaling
    ACT_DIFFICULTY_MULTIPLIER: [1.0, 1.3, 1.6], // Act 1, 2, 3
    
    // Boss Scaling
    BOSS_HP_MULTIPLIER: [1.0, 1.5, 2.0] // Act 1, 2, 3 bosses
  },

  // ============================================================================
  // DEVELOPMENT & DEBUG FLAGS
  // ============================================================================
  // Development & Debug flags
  DEBUG_MODE: true, // Set false for production
  LOG_VERBOSE: true, // Extra console logging
  SKIP_INTRO: false,
  UNLOCK_ALL_CONTENT: false,
  
  // Performance Monitoring
  PERFORMANCE_WARNING_MS: 16, // Warn if operation exceeds 16ms
  
  // Debug Features
  SHOW_FPS: true,
  SHOW_HITBOXES: false,
  GOD_MODE: false, // Invincibility
  INFINITE_CPU: false,
  LOG_VERBOSE: true, // Extra console logging
  LOG_PERFORMANCE: true,
  
  // Performance Monitoring
  PERFORMANCE_WARNING_MS: 16, // Warn if frame exceeds 16ms
  MAX_FRAME_TIME: 16,
  MAX_ANIMATION_DURATION: 1000,
  
  // Storage Fallbacks
  ENABLE_LOCALSTORAGE_FALLBACK: true,
  ENABLE_MEMORY_FALLBACK: true,
  
  // Testing Shortcuts
  ENABLE_DEBUG_SHORTCUTS: true, // G, W, L, C keys
  ENABLE_CONSOLE_COMMANDS: true,
  
  // Error Handling
  SHOW_ERROR_MODALS: true,
  LOG_ERRORS_TO_SERVER: false, // Future feature
  
  // Version
  VERSION: '1.0.0',
  BUILD_DATE: '2025-01-14',
  
  // Feature Flags
  FEATURES: {
    DAILY_CHALLENGES: false, // Not implemented yet
    LEADERBOARDS: false,
    ACHIEVEMENTS: true,
    CLOUD_SAVES: false,
    MOBILE_SUPPORT: false
  }
};

// ============================================================================
// RUNTIME CONFIGURATION VALIDATION
// ============================================================================

/**
 * Validates configuration object on load
 * Throws errors if critical values are missing or invalid
 */
function validateConfig() {
  console.log('[config.js] Validating configuration...');
  
  const errors = [];
  
  // Check critical gameplay values
  if (GAME_CONFIG.GAMEPLAY.BASE_HAND_SIZE <= 0) {
    errors.push('BASE_HAND_SIZE must be > 0');
  }
  
  if (GAME_CONFIG.GAMEPLAY.MAX_HAND_SIZE < GAME_CONFIG.GAMEPLAY.BASE_HAND_SIZE) {
    errors.push('MAX_HAND_SIZE must be >= BASE_HAND_SIZE');
  }
  
  if (GAME_CONFIG.GAMEPLAY.MAX_TRACE <= 0) {
    errors.push('MAX_TRACE must be > 0');
  }
  
  // Check rarity weights sum correctly
  const act1Total = GAME_CONFIG.CARDS.ACT1_COMMON_WEIGHT + 
                    GAME_CONFIG.CARDS.ACT1_UNCOMMON_WEIGHT + 
                    GAME_CONFIG.CARDS.ACT1_RARE_WEIGHT;
  
  if (act1Total !== 100) {
    console.warn('[config.js] ACT1 rarity weights sum to', act1Total, '(expected 100)');
  }
  
  // Check Phaser config
  if (GAME_CONFIG.PHASER.WIDTH <= 0 || GAME_CONFIG.PHASER.HEIGHT <= 0) {
    errors.push('Phaser canvas dimensions must be > 0');
  }
  
  // Check animation timings are positive
  if (GAME_CONFIG.ANIMATION.CARD_PLAY_DURATION <= 0) {
    errors.push('Animation durations must be > 0');
  }
  
  // Verify color palette completeness
  const requiredColors = ['BACKGROUND_DARK', 'CYAN_PRIMARY', 'MAGENTA_PRIMARY'];
  requiredColors.forEach(colorKey => {
    if (!GAME_CONFIG.UI.COLORS[colorKey]) {
      errors.push(`Missing required color: ${colorKey}`);
    }
  });
  
  if (errors.length > 0) {
    console.error('[config.js] ❌ Configuration validation failed:');
    errors.forEach(err => console.error(`  - ${err}`));
    throw new Error(`Configuration validation failed with ${errors.length} errors`);
  }
  
  console.log('[config.js] ✅ Configuration validated successfully');
  
  // Log configuration summary
  if (GAME_CONFIG.LOG_VERBOSE) {
    console.log('[config.js] Configuration summary:', {
      version: GAME_CONFIG.VERSION,
      debugMode: GAME_CONFIG.DEBUG_MODE,
      canvasSize: `${GAME_CONFIG.PHASER.WIDTH}x${GAME_CONFIG.PHASER.HEIGHT}`,
      baseHandSize: GAME_CONFIG.GAMEPLAY.BASE_HAND_SIZE,
      startingCPU: GAME_CONFIG.GAMEPLAY.STARTING_CPU,
      maxTrace: GAME_CONFIG.GAMEPLAY.MAX_TRACE,
      actsPerRun: GAME_CONFIG.MAP.ACTS_PER_RUN,
      nodesPerAct: GAME_CONFIG.MAP.NODES_PER_ACT
    });
  }
}

// Run validation on load
try {
  validateConfig();
} catch (error) {
  console.error('[config.js] CRITICAL ERROR during validation:', error);
  throw error;
}

// ============================================================================
// HELPER FUNCTIONS (for color conversion, etc.)
// ============================================================================

/**
 * Convert hex color string to Phaser numeric format
 * @param {string} hex - Hex color (e.g., '#00f0ff')
 * @returns {number} Phaser color number (e.g., 0x00f0ff)
 */
export function hexToNumber(hex) {
  if (typeof hex !== 'string') {
    console.error('[config.js] hexToNumber: Invalid input, expected string, got', typeof hex);
    return 0x000000;
  }
  
  const cleaned = hex.replace('#', '');
  const number = parseInt(cleaned, 16);
  
  if (isNaN(number)) {
    console.error('[config.js] hexToNumber: Failed to parse hex color:', hex);
    return 0x000000;
  }
  
  return number;
}

/**
 * Get color by name from palette
 * @param {string} colorName - Color name (e.g., 'CYAN_PRIMARY')
 * @returns {string} Hex color string
 */
export function getColor(colorName) {
  const color = GAME_CONFIG.UI.COLORS[colorName];
  
  if (!color) {
    console.warn('[config.js] getColor: Color not found:', colorName);
    return GAME_CONFIG.UI.COLORS.TEXT_PRIMARY; // Fallback to white
  }
  
  return color;
}

/**
 * Get color as number for Phaser
 * @param {string} colorName - Color name from palette
 * @returns {number} Phaser color number
 */
export function getColorNumber(colorName) {
  const hex = getColor(colorName);
  return hexToNumber(hex);
}

// ============================================================================
// EXPORTS
// ============================================================================

console.log('[config.js] ✅ Module loaded successfully');
console.log('[config.js] Debug mode:', GAME_CONFIG.DEBUG_MODE);
console.log('[config.js] Version:', GAME_CONFIG.VERSION);

// Default export
export default GAME_CONFIG;

// Named exports for convenience
export const {
  PHASER,
  GAMEPLAY,
  COMBAT,
  CARDS,
  REWARDS,
  MAP,
  UI,
  ANIMATION,
  AUDIO,
  ASSETS,
  DIFFICULTY,
  DEBUG_MODE,
  VERSION
} = GAME_CONFIG; 
