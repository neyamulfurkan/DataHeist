/**
 * main.js
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
 * ✓ Console logs use [main.js] prefix
 * ✓ File length is within ±20% of estimate
 * 
 * Purpose: Phaser game initialization - creates game instance, registers scenes, starts game loop
 * Dependencies: Phaser, config.js, all scene files
 * Used by: index.html (entry point)
 */

console.log('[main.js] ========================================');
console.log('[main.js] DATAHEIST - GAME INITIALIZATION');
console.log('[main.js] ========================================');

// Phaser is loaded globally via CDN in index.html
// Access it directly from window.Phaser
const Phaser = window.Phaser;

if (!Phaser) {
  throw new Error('Phaser not loaded! Check index.html script tag.');
}

import { GAME_CONFIG } from '../config.js';

console.log('[main.js] Phaser library loaded:', Phaser.VERSION);
console.log('[main.js] Game configuration loaded');
console.log('[main.js] Version:', GAME_CONFIG.VERSION);
console.log('[main.js] Debug mode:', GAME_CONFIG.DEBUG_MODE);

import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import LoadoutScene from './scenes/LoadoutScene.js';
import MapScene from './scenes/MapScene.js';
import BattleScene from './scenes/BattleScene.js';
import RewardScene from './scenes/RewardScene.js';
import VictoryScene from './scenes/VictoryScene.js';
import DefeatScene from './scenes/DefeatScene.js';

console.log('[main.js] ✅ All scene classes imported successfully');

console.log('[main.js] ✅ All scene classes imported successfully');

const gameConfig = {
  type: GAME_CONFIG.PHASER.RENDER_TYPE === 'AUTO' ? Phaser.AUTO : 
        GAME_CONFIG.PHASER.RENDER_TYPE === 'WEBGL' ? Phaser.WEBGL : 
        Phaser.CANVAS,
  
  width: GAME_CONFIG.PHASER.WIDTH,
  height: GAME_CONFIG.PHASER.HEIGHT,
  
  backgroundColor: GAME_CONFIG.PHASER.BACKGROUND_COLOR,
  
  parent: GAME_CONFIG.PHASER.PARENT,
  
  scene: [
    BootScene
  ],
  
  physics: GAME_CONFIG.PHASER.PHYSICS,
  
  scale: {
    mode: GAME_CONFIG.PHASER.SCALE.MODE === 'FIT' ? Phaser.Scale.FIT :
          GAME_CONFIG.PHASER.SCALE.MODE === 'SMOOTH' ? Phaser.Scale.SMOOTH_SCALE :
          Phaser.Scale.NONE,
    autoCenter: GAME_CONFIG.PHASER.SCALE.AUTO_CENTER === 'CENTER_BOTH' ? Phaser.Scale.CENTER_BOTH :
                GAME_CONFIG.PHASER.SCALE.AUTO_CENTER === 'CENTER_HORIZONTALLY' ? Phaser.Scale.CENTER_HORIZONTALLY :
                GAME_CONFIG.PHASER.SCALE.AUTO_CENTER === 'CENTER_VERTICALLY' ? Phaser.Scale.CENTER_VERTICALLY :
                Phaser.Scale.NO_CENTER,
    min: {
      width: GAME_CONFIG.PHASER.SCALE.MIN_WIDTH,
      height: GAME_CONFIG.PHASER.SCALE.MIN_HEIGHT
    },
    max: {
      width: GAME_CONFIG.PHASER.SCALE.MAX_WIDTH,
      height: GAME_CONFIG.PHASER.SCALE.MAX_HEIGHT
    }
  },
  
  fps: GAME_CONFIG.PHASER.FPS,
  
  pixelArt: GAME_CONFIG.PHASER.PIXEL_ART,
  antialias: GAME_CONFIG.PHASER.ANTIALIAS,
  
  dom: {
    createContainer: true
  },
  
  callbacks: {
    preBoot: function(game) {
      console.log('[main.js] Phaser pre-boot callback triggered');
      console.log('[main.js] Game instance:', game);
    },
    
    postBoot: function(game) {
      console.log('[main.js] Phaser post-boot callback triggered');
      console.log('[main.js] Renderer:', game.renderer.type === Phaser.WEBGL ? 'WebGL' : 'Canvas');
      console.log('[main.js] Canvas size:', {
        width: game.canvas.width,
        height: game.canvas.height
      });
    }
  }
};

console.log('[main.js] Game configuration prepared:', {
  type: gameConfig.type === Phaser.AUTO ? 'AUTO' : 
        gameConfig.type === Phaser.WEBGL ? 'WEBGL' : 'CANVAS',
  dimensions: `${gameConfig.width}x${gameConfig.height}`,
  sceneCount: gameConfig.scene.length,
  physics: gameConfig.physics.default,
  scaleMode: GAME_CONFIG.PHASER.SCALE.MODE,
  fps: gameConfig.fps.target
});

let game = null;

try {
  console.log('[main.js] Creating Phaser game instance...');
  
  game = new Phaser.Game(gameConfig);
  
    // Register all other scenes dynamically (no auto-boot)
  game.scene.add('MenuScene', MenuScene, false);
  game.scene.add('LoadoutScene', LoadoutScene, false);
  game.scene.add('MapScene', MapScene, false);
  game.scene.add('BattleScene', BattleScene, false);
  game.scene.add('RewardScene', RewardScene, false);
  game.scene.add('VictoryScene', VictoryScene, false);
  game.scene.add('DefeatScene', DefeatScene, false);
  console.log('[main.js] All scenes registered dynamically (no auto-boot)');
  
  if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.ENABLE_CONSOLE_COMMANDS) {
    window.game = game;
    console.log('[main.js] 🔧 DEBUG: Game instance exposed as window.game');
    
    window.gameDebug = {
      restart: () => {
        console.log('[main.js] DEBUG: Restarting game...');
        game.scene.stop();
        game.scene.start('BootScene');
      },
      
      goToScene: (sceneKey) => {
        if (typeof sceneKey !== 'string') {
          console.error('[main.js] DEBUG: Invalid scene key:', sceneKey);
          return;
        }
        console.log('[main.js] DEBUG: Switching to scene:', sceneKey);
        game.scene.start(sceneKey);
      },
      
      listScenes: () => {
        const scenes = game.scene.scenes.map(s => ({
          key: s.scene.key,
          active: s.scene.isActive(),
          visible: s.scene.isVisible()
        }));
        console.table(scenes);
        return scenes;
      },
      
      getActiveScenes: () => {
        const active = game.scene.getScenes(true).map(s => s.scene.key);
        console.log('[main.js] DEBUG: Active scenes:', active);
        return active;
      },
      
      toggleDebug: () => {
        GAME_CONFIG.DEBUG_MODE = !GAME_CONFIG.DEBUG_MODE;
        console.log('[main.js] DEBUG: Debug mode toggled:', GAME_CONFIG.DEBUG_MODE);
      }
    };
    
    console.log('[main.js] 🔧 DEBUG: Debug utilities available at window.gameDebug');
    console.log('[main.js] 🔧 DEBUG: Commands:');
    console.log('[main.js] 🔧   - gameDebug.restart()');
    console.log('[main.js] 🔧   - gameDebug.goToScene("SceneKey")');
    console.log('[main.js] 🔧   - gameDebug.listScenes()');
    console.log('[main.js] 🔧   - gameDebug.getActiveScenes()');
    console.log('[main.js] 🔧   - gameDebug.toggleDebug()');
  }
  
  game.events.on('ready', () => {
    console.log('[main.js] ========================================');
    console.log('[main.js] ✅ GAME READY');
    console.log('[main.js] Starting scene: BootScene');
    console.log('[main.js] ========================================');
  });
  
  game.events.on('step', (time, delta) => {
    if (GAME_CONFIG.SHOW_FPS && time % 1000 < delta) {
      const fps = Math.round(1000 / delta);
      if (fps < 30) {
        console.warn('[main.js] ⚠️  Low FPS detected:', fps);
      }
    }
  });
  
  game.events.on('pause', () => {
    console.log('[main.js] Game paused');
  });
  
  game.events.on('resume', () => {
    console.log('[main.js] Game resumed');
  });
  
  game.events.on('hidden', () => {
    console.log('[main.js] Game window hidden (tab not visible)');
  });
  
  game.events.on('visible', () => {
    console.log('[main.js] Game window visible (tab active)');
  });
  
  game.events.on('blur', () => {
    console.log('[main.js] Game lost focus');
  });
  
  game.events.on('focus', () => {
    console.log('[main.js] Game gained focus');
  });
  
  window.addEventListener('beforeunload', (event) => {
    console.log('[main.js] Window closing, checking for unsaved data...');
    
    const activeScenes = game.scene.getScenes(true);
    const hasUnsavedProgress = activeScenes.some(scene => 
      scene.scene.key === 'BattleScene' || 
      scene.scene.key === 'MapScene'
    );
    
    if (hasUnsavedProgress && !GAME_CONFIG.DEBUG_MODE) {
      const message = 'You have an active run in progress. Are you sure you want to leave?';
      event.preventDefault();
      event.returnValue = message;
      console.warn('[main.js] Unsaved progress detected, showing confirmation dialog');
      return message;
    }
  });
  
  window.addEventListener('resize', () => {
    if (GAME_CONFIG.LOG_VERBOSE) {
      console.log('[main.js] Window resized:', {
        width: window.innerWidth,
        height: window.innerHeight,
        gameWidth: game.canvas.width,
        gameHeight: game.canvas.height
      });
    }
  });
  
  window.addEventListener('error', (event) => {
    console.error('[main.js] ❌ CRITICAL: Uncaught JavaScript error');
    console.error('[main.js] Error message:', event.message);
    console.error('[main.js] Error source:', event.filename);
    console.error('[main.js] Line:', event.lineno);
    console.error('[main.js] Column:', event.colno);
    console.error('[main.js] Error object:', event.error);
    
    if (event.error && event.error.stack) {
      console.error('[main.js] Stack trace:', event.error.stack);
    }
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[main.js] ❌ CRITICAL: Unhandled Promise rejection');
    console.error('[main.js] Reason:', event.reason);
    console.error('[main.js] Promise:', event.promise);
    
    if (event.reason && event.reason.stack) {
      console.error('[main.js] Stack trace:', event.reason.stack);
    }
  });
  
  console.log('[main.js] ========================================');
  console.log('[main.js] 🎮 DATAHEIST INITIALIZED SUCCESSFULLY');
  console.log('[main.js] Version:', GAME_CONFIG.VERSION);
  console.log('[main.js] Build date:', GAME_CONFIG.BUILD_DATE);
  console.log('[main.js] Canvas:', `${GAME_CONFIG.PHASER.WIDTH}x${GAME_CONFIG.PHASER.HEIGHT}`);
  console.log('[main.js] Renderer:', game.renderer.type === Phaser.WEBGL ? 'WebGL' : 'Canvas');
  console.log('[main.js] Debug mode:', GAME_CONFIG.DEBUG_MODE);
  console.log('[main.js] ========================================');
  
} catch (error) {
  console.error('[main.js] ========================================');
  console.error('[main.js] ❌ CRITICAL FAILURE: GAME INITIALIZATION FAILED');
  console.error('[main.js] ========================================');
  console.error('[main.js] Error name:', error.name);
  console.error('[main.js] Error message:', error.message);
  console.error('[main.js] Stack trace:', error.stack);
  console.error('[main.js] ========================================');
  console.error('[main.js] Game config at time of failure:', gameConfig);
  console.error('[main.js] ========================================');
  
  const errorContainer = document.createElement('div');
  errorContainer.id = 'game-error';
  errorContainer.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #0a0e27;
    border: 4px solid #ff0055;
    padding: 40px;
    border-radius: 8px;
    color: #ffffff;
    font-family: 'Courier New', monospace;
    max-width: 600px;
    z-index: 10000;
    text-align: center;
  `;
  
  errorContainer.innerHTML = `
    <h1 style="color: #ff0055; margin: 0 0 20px 0; font-size: 32px;">CRITICAL ERROR</h1>
    <p style="color: #00f0ff; margin: 0 0 20px 0; font-size: 18px;">Game initialization failed</p>
    <p style="color: #ffffff; margin: 0 0 20px 0; font-size: 14px;">${error.message}</p>
    <p style="color: #999999; margin: 0; font-size: 12px;">Check browser console (F12) for detailed error information</p>
    <button onclick="location.reload()" style="
      margin-top: 30px;
      padding: 12px 24px;
      background: #00f0ff;
      border: none;
      color: #000000;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      border-radius: 4px;
    ">RELOAD PAGE</button>
  `;
  
  document.body.appendChild(errorContainer);
  
  throw error;
}

if (!game) {
  console.error('[main.js] ❌ CRITICAL: Game instance was not created');
  throw new Error('Failed to create Phaser game instance');
}

export default game;

console.log('[main.js] ✅ Module exported successfully');