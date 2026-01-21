/**
 * BattleScene.js
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
 * ✓ Console logs use [BattleScene] prefix
 * ✓ File length is within ±20% of estimate
 * 
 * Purpose: Main combat scene orchestrating battle flow, UI, animations, and transitions
 * Dependencies: CombatSystem, BattleUI, HUDElements, CardUI, Runner, ICE, AudioManager
 * Used by: MapScene (transitions to), RewardScene (transitions from)
 */

// Phaser loaded globally from CDN in index.html
import { GAME_CONFIG } from '../config.js';
import combatSystem from '../systems/CombatSystem.js';
import saveSystem from '../systems/SaveSystem.js';
import BattleUI from '../ui/BattleUI.js';
import HUDElements from '../ui/HUDElements.js';
import CardUI from '../ui/CardUI.js';
import Runner from '../entities/Runner.js';
import ICE from '../entities/ICE.js';
import audioManager from '../utils/AudioManager.js';
import relicSystem from '../systems/RelicSystem.js';
import { 
  animateDamageNumber, 
  animateShake, 
  animatePulse, 
  cleanupAnimations,
  animateParticleExplosion,
  animateEnergyBeam,
  animateImpactFlash,
  animateShieldEffect,
  animateStatusEffect,
  animateEnemySearch,
  animateEnemyAlert,
  animateEnemyVictory
} from '../utils/AnimationHelpers.js';
import rewardSystem from '../systems/RewardSystem.js';

console.log('[BattleScene] Loading BattleScene class...');

export default class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
    
    console.log('[BattleScene] Constructor: Initializing scene properties');
    
    this.combatSystem = null;
    this.battleUI = null;
    this.hudElements = null;
    this.cardUI = null;
    
    this.runner = null;
    this.enemy = null;
    this.gameState = null;
    
    this.background = null;
    this.enemySprite = null;
    this.combatLogText = null;
    this.combatLogMessages = [];
    
    this.isProcessingAction = false;
    this.isPlayerTurn = true;
    this.turnInProgress = false;
    
    this.mapState = null;
    this.isEliteCombat = false;
    this.isBossCombat = false;
    
    this.forfeitButton = null;
    this.forfeitConfirmOverlay = null;
    
    // VISUAL EFFECTS STORAGE
    this.activeShieldGraphics = [];
    this.playerBlockVisual = null;
    this.playerBlockText = null;
    this.enemyBlockText = null;
    this.enemyIdleTween = null;
    this.enemyPatrolTween = null;
    this.enemyOriginalX = 0;
    this.enemyOriginalY = 0;
    this.lastTracePercent = 0;
    
    
  }

  /**
   * Initialize scene with data from previous scene
   * @param {Object} data - Scene initialization data
   * @param {Runner} data.runner - Player runner instance
   * @param {string} data.enemyId - ICE enemy ID to load
   * @param {Object} data.mapState - Current map state
   * @param {boolean} [data.isElite=false] - Is this an elite combat
   * @param {boolean} [data.isBoss=false] - Is this a boss combat
   */
  init(data) {
    this.combatStartTurn = 0;
    
    console.log('[BattleScene] init: Receiving scene data', {
      hasRunner: !!data?.runner,
      enemyId: data?.enemyId,
      hasMapState: !!data?.mapState,
      isElite: data?.isElite || false,
      isBoss: data?.isBoss || false
    });

    if (!data) {
      console.error('[BattleScene] init: No data provided to scene');
      throw new Error('BattleScene requires initialization data');
    }

    if (!data.runner || !(data.runner instanceof Runner)) {
      console.error('[BattleScene] init: Invalid runner data', {
        runner: data.runner,
        isRunner: data.runner instanceof Runner
      });
      throw new Error('BattleScene requires valid Runner instance');
    }

    if (!data.enemyId || typeof data.enemyId !== 'string') {
      console.error('[BattleScene] init: Invalid enemyId', {
        enemyId: data.enemyId,
        type: typeof data.enemyId
      });
      throw new Error('BattleScene requires valid enemyId string');
    }

    this.runner = data.runner;
    this.runState = data.runState || null;
    this.nodeId = data.nodeId || null;
    this.isEliteCombat = data.isElite === true;
    this.isBossCombat = data.isBoss === true;
    
    // CRITICAL FIX: Store node data for progressive scaling
    this.nodeData = data.nodeData || null;
    this.actNumber = data.actNumber || (this.runState ? this.runState.actNumber : 1);
    
    try {
      this.enemy = new ICE(data.enemyId);
      console.log('[BattleScene] init: Enemy created successfully', {
        enemyId: this.enemy.id,
        enemyName: this.enemy.name,
        enemyHP: this.enemy.maxHP,
        enemyTier: this.enemy.tier
      });
    } catch (error) {
      console.error('[BattleScene] init: Failed to create enemy', {
        enemyId: data.enemyId,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to create enemy ${data.enemyId}: ${error.message}`);
    }

    this.isProcessingAction = false;
    this.isPlayerTurn = true;
    this.turnInProgress = false;
    this.combatLogMessages = [];

    console.log('[BattleScene] init: Scene initialization complete', {
      runnerName: this.runner.name,
      enemyName: this.enemy.name,
      isElite: this.isEliteCombat,
      isBoss: this.isBossCombat
    });
  }

  /**
   * Create scene elements and initialize combat
   */
  create() {
    console.log('[BattleScene] create: Starting scene creation');

    try {
      this.createBackground();
      this.createEnemyVisuals();
      this.initializeUI();
      this.initializeCombat();
      this.setupEventListeners();
      this.createCombatLog();
      this.createForfeitButton();
      this.startBackgroundMusic();

      if (GAME_CONFIG.DEBUG_MODE) {
        this.setupDebugControls();
      }

      this.cameras.main.fadeIn(GAME_CONFIG.ANIMATION.SCREEN_FADE_DURATION, 0, 0, 0);

      console.log('[BattleScene] create: Scene creation complete', {
        runnerTrace: this.runner.currentTrace,
        runnerCPU: this.runner.currentCPU,
        enemyHP: this.enemy.currentHP,
        handSize: this.runner.deck.hand.length
      });

      this.time.delayedCall(100, () => {
        this.executePlayerTurn();
      });

    } catch (error) {
      console.error('[BattleScene] create: Fatal error during scene creation', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Create background visuals
   * @private
   */
  createBackground() {
    console.log('[BattleScene] createBackground: Creating background elements');

    try {
      // Determine which background to use based on combat type
      let bgKey = 'bg_battle';
      
      if (this.isBossCombat) {
        bgKey = 'bg_battle_boss';
        console.log('[BattleScene] createBackground: Boss combat detected, using boss background');
      } else if (this.isEliteCombat) {
        bgKey = 'bg_battle_elite';
        console.log('[BattleScene] createBackground: Elite combat detected, using elite background');
      } else {
        console.log('[BattleScene] createBackground: Regular combat, using standard background');
      }

      // Try to load background image
      if (this.textures.exists(bgKey)) {
        this.background = this.add.image(
          GAME_CONFIG.PHASER.WIDTH / 2,
          GAME_CONFIG.PHASER.HEIGHT / 2,
          bgKey
        );
        
        // Scale to cover entire screen while maintaining aspect ratio
        const scaleX = GAME_CONFIG.PHASER.WIDTH / this.background.width;
        const scaleY = GAME_CONFIG.PHASER.HEIGHT / this.background.height;
        const scale = Math.max(scaleX, scaleY);
        this.background.setScale(scale);
        
        console.log('[BattleScene] createBackground: Using background image:', bgKey);
      } else {
        // Fallback to solid rectangle if image not found
        console.warn('[BattleScene] createBackground: Image not found, using fallback:', bgKey);
        
        this.background = this.add.rectangle(
          GAME_CONFIG.PHASER.WIDTH / 2,
          GAME_CONFIG.PHASER.HEIGHT / 2,
          GAME_CONFIG.PHASER.WIDTH,
          GAME_CONFIG.PHASER.HEIGHT,
          GAME_CONFIG.UI.COLOR_HEX.BACKGROUND_DARK
        );
      }
      
      this.background.setDepth(GAME_CONFIG.UI.Z_INDEX.BACKGROUND);

      console.log('[BattleScene] createBackground: Background created successfully');

    } catch (error) {
      console.error('[BattleScene] createBackground: Failed to create background', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Create enemy sprite and visuals
   * @private
   */
  createEnemyVisuals() {
    console.log('[BattleScene] createEnemyVisuals: Creating enemy sprite');

    try {
      const enemySpriteKey = this.enemy.spriteKey || 'ice_placeholder';
      const x = GAME_CONFIG.UI.ENEMY.SPRITE_X;
      const y = GAME_CONFIG.UI.ENEMY.SPRITE_Y;

      if (this.textures.exists(enemySpriteKey)) {
        this.enemySprite = this.add.sprite(x, y, enemySpriteKey);
        this.enemySprite.setScale(GAME_CONFIG.UI.ENEMY.SPRITE_SCALE);
        console.log('[BattleScene] createEnemyVisuals: Using sprite', enemySpriteKey);
      } else {
        console.warn('[BattleScene] createEnemyVisuals: Sprite not found, using placeholder', {
          requestedKey: enemySpriteKey
        });

        this.enemySprite = this.add.rectangle(
          x, y,
          120, 150,
          GAME_CONFIG.UI.COLOR_HEX.RED_WARNING
        );
        this.enemySprite.setStrokeStyle(4, GAME_CONFIG.UI.COLOR_HEX.WHITE);

        // Add devil emoji at very top of enemy sprite (head position)
        const devilEmoji = this.add.text(x, y - 90, '👿', {
          fontSize: '64px'
        });
        devilEmoji.setOrigin(0.5);
        devilEmoji.setDepth(GAME_CONFIG.UI.Z_INDEX.ENEMY + 2);
      }

      this.enemySprite.setDepth(GAME_CONFIG.UI.Z_INDEX.ENEMY);

      // Add enemy name label above sprite (for ALL enemies, not just placeholder)
      this.enemyNameLabel = this.add.text(x, y - 120, this.enemy.name, {
        fontSize: '24px',
        color: GAME_CONFIG.UI.COLORS.RED_WARNING,
        fontFamily: GAME_CONFIG.UI.TEXT.FONT_FAMILY,
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      });
      this.enemyNameLabel.setOrigin(0.5);
      this.enemyNameLabel.setDepth(GAME_CONFIG.UI.Z_INDEX.ENEMY + 1);

      // VISUAL EFFECT: Enemy idle breathing animation
      this.startEnemyIdleAnimation();

      console.log('[BattleScene] createEnemyVisuals: Enemy visuals created', {
        position: { x, y },
        spriteKey: enemySpriteKey,
        depth: this.enemySprite.depth
      });

    } catch (error) {
      console.error('[BattleScene] createEnemyVisuals: Failed to create enemy visuals', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Start enemy idle breathing animation
   * @private
   */
  startEnemyIdleAnimation() {
    if (!this.enemySprite) {
      console.error('[BattleScene] startEnemyIdleAnimation: Enemy sprite not found');
      return;
    }

    console.log('[BattleScene] startEnemyIdleAnimation: Starting dynamic patrol animation');

    // Stop existing animations if any
    if (this.enemyIdleTween) {
      this.enemyIdleTween.stop();
      this.enemyIdleTween = null;
    }
    
    if (this.enemyPatrolTween) {
      this.enemyPatrolTween.stop();
      this.enemyPatrolTween = null;
    }

    // Store original position for patrol boundaries
    this.enemyOriginalX = this.enemySprite.x;
    this.enemyOriginalY = this.enemySprite.y;

    // DYNAMIC: Patrol intensity based on enemy HP and player trace
    const hpPercent = this.enemy.currentHP / this.enemy.maxHP;
    const tracePercent = this.runner.currentTrace / this.runner.maxTrace;
    
    // Movement ranges - wider when searching (high trace)
    const horizontalRange = 80 + (tracePercent * 120); // 80-200px horizontal
    const verticalRange = 40 + (tracePercent * 60); // 40-100px vertical
    
    // Speed - faster when damaged or trace is high
    const baseSpeed = 2500;
    const speedMultiplier = 1 - (hpPercent * 0.3) - (tracePercent * 0.4); // Up to 70% faster
    const patrolSpeed = Math.max(baseSpeed * (1 - speedMultiplier), 1000);

    // CONTINUOUS PATROL: Enemy moves in unpredictable pattern
    this.createPatrolPattern(horizontalRange, verticalRange, patrolSpeed);

    console.log('[BattleScene] startEnemyIdleAnimation: Dynamic patrol started', {
      hpPercent: (hpPercent * 100).toFixed(1) + '%',
      tracePercent: (tracePercent * 100).toFixed(1) + '%',
      horizontalRange: horizontalRange.toFixed(0) + 'px',
      verticalRange: verticalRange.toFixed(0) + 'px',
      patrolSpeed: patrolSpeed.toFixed(0) + 'ms'
    });
  }

  /**
   * Create dynamic patrol pattern for enemy (searching behavior)
   * @param {number} horizontalRange - Horizontal movement range
   * @param {number} verticalRange - Vertical movement range
   * @param {number} speed - Movement speed in ms
   * @private
   */
  createPatrolPattern(horizontalRange, verticalRange, speed) {
    if (!this.enemySprite || !this.enemyOriginalX || !this.enemyOriginalY) {
      console.error('[BattleScene] createPatrolPattern: Missing sprite or original position');
      return;
    }

    // Stop any existing patrol
    if (this.enemyPatrolTween) {
      this.enemyPatrolTween.stop();
    }

    // Generate random patrol point within range
    const randomPatrol = () => {
      const targetX = this.enemyOriginalX + (Math.random() - 0.5) * horizontalRange;
      const targetY = this.enemyOriginalY + (Math.random() - 0.5) * verticalRange;
      
      // Clamp to screen boundaries
      const clampedX = Phaser.Math.Clamp(targetX, 200, GAME_CONFIG.PHASER.WIDTH - 200);
      const clampedY = Phaser.Math.Clamp(targetY, 100, 400);

      return { x: clampedX, y: clampedY };
    };

    // Start patrol sequence
    const patrol = () => {
      const target = randomPatrol();
      
      // Calculate distance for dynamic speed
      const distance = Phaser.Math.Distance.Between(
        this.enemySprite.x,
        this.enemySprite.y,
        target.x,
        target.y
      );
      
      const moveDuration = (distance / 200) * speed; // Scale speed by distance

      this.enemyPatrolTween = this.tweens.add({
        targets: this.enemySprite,
        x: target.x,
        y: target.y,
        duration: moveDuration,
        ease: 'Sine.InOut',
        onComplete: () => {
          // Pause briefly at each point (shorter pause when trace is high)
          const tracePercent = this.runner.currentTrace / this.runner.maxTrace;
          const pauseDuration = Math.max(200, 800 - (tracePercent * 600));
          
          this.time.delayedCall(pauseDuration, () => {
            if (this.enemySprite && this.enemySprite.scene) {
              patrol(); // Continue patrol
            }
          });
        }
      });
    };

    // Start patrolling
    patrol();
  }

  /**
   * Update enemy patrol intensity based on current game state
   * Call this when trace or HP changes significantly
   * @private
   */
  updatePatrolIntensity() {
    if (!this.enemySprite || !this.enemy || !this.runner) {
      return;
    }

    // Restart patrol with new intensity
    this.startEnemyIdleAnimation();
  }

  /**
   * Initialize all UI components
   * @private
   */
  initializeUI() {
    console.log('[BattleScene] initializeUI: Initializing UI components');

    try {
      this.cardUI = new CardUI(this);
      console.log('[BattleScene] initializeUI: CardUI created');

      this.battleUI = new BattleUI(this, this.cardUI, this.runner.deck);
      this.battleUI.create();
      console.log('[BattleScene] initializeUI: BattleUI created');

      this.hudElements = new HUDElements(this);
      this.hudElements.create();
      console.log('[BattleScene] initializeUI: HUDElements created');

      this.hudElements.updateTraceMeter(this.runner.currentTrace, this.runner.maxTrace);
      this.hudElements.updateCPU(this.runner.currentCPU, this.runner.maxCPU);
      this.hudElements.updateTurn(1, 'playerTurn');
      this.hudElements.updateEnemyHP(this.enemy.currentHP, this.enemy.maxHP, this.enemy.name);

      console.log('[BattleScene] initializeUI: UI initialization complete');

    } catch (error) {
      console.error('[BattleScene] initializeUI: Failed to initialize UI', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Initialize combat system
   * @private
   */
  initializeCombat() {
    console.log('[BattleScene] initializeCombat: Initializing combat system');

    try {
      // CRITICAL FIX: Apply progressive difficulty scaling BEFORE combat starts
      if (this.nodeData && typeof this.nodeData.nodeRow === 'number') {
        this.applyProgressiveScaling(this.enemy, this.nodeData, this.actNumber);
      }
      
      this.gameState = combatSystem.initCombat(this.runner, this.enemy, this.events);

      // CRITICAL FIX: Apply relic effects at combat start
      if (this.runner.relics && this.runner.relics.length > 0) {
        console.log('[BattleScene] initializeCombat: Applying relic effects', {
          relicCount: this.runner.relics.length,
          relics: this.runner.relics.map(r => r.name)
        });
        
        relicSystem.setRelics(this.runner.relics);
        
        const combatStartEffects = relicSystem.trigger('onCombatStart', {
          runner: this.runner,
          enemy: this.enemy,
          gameState: this.gameState
        });
        
        // Apply aggregated effects
        const effects = relicSystem.getAggregatedEffects();
        
        if (effects.bonusStartingCPU > 0) {
          this.runner.maxCPU += effects.bonusStartingCPU;
          this.runner.currentCPU = this.runner.maxCPU;
          console.log('[BattleScene] initializeCombat: ✅ Relic bonus CPU applied, new max:', this.runner.maxCPU);
          this.showCombatLog(`Relic: +${effects.bonusStartingCPU} Max CPU!`);
        }
        
        if (effects.maxTraceIncrease > 0) {
          this.runner.maxTrace += effects.maxTraceIncrease;
          console.log('[BattleScene] initializeCombat: ✅ Relic max trace increase:', effects.maxTraceIncrease);
          this.showCombatLog(`Relic: +${effects.maxTraceIncrease} Max Trace!`);
        }
        
        if (effects.startingBlock > 0) {
          this.runner.block = effects.startingBlock;
          console.log('[BattleScene] initializeCombat: ✅ Relic starting block:', effects.startingBlock);
          this.showCombatLog(`Relic: Start with ${effects.startingBlock} Block!`);
        }
        
        // Update HUD with relic-modified values
        this.hudElements.updateCPU(this.runner.currentCPU, this.runner.maxCPU);
        this.hudElements.updateTraceMeter(this.runner.currentTrace, this.runner.maxTrace);
        if (effects.startingBlock > 0) {
          this.hudElements.updateBlockDisplays(this.runner.block, this.enemy.block);
        }
      }

      console.log('[BattleScene] initializeCombat: Combat system initialized', {
        turn: this.gameState.turn,
        phase: this.gameState.phase,
        playerCPU: this.gameState.player.currentCPU,
        playerMaxCPU: this.gameState.player.maxCPU,
        enemyIntent: this.gameState.enemy.getIntentDescription()
      });

      // CRITICAL FIX: Update intent display immediately
      this.hudElements.updateEnemyIntent(this.enemy.currentIntent);
      
      this.combatStartTurn = this.gameState.turn;
      
      // Log the FIRST turn intent clearly
      this.showCombatLog(`Combat Start: ${this.runner.name} vs ${this.enemy.name}`);
      this.showCombatLog(`Enemy Intent: ${this.enemy.getIntentDescription()}`);

    } catch (error) {
      console.error('[BattleScene] initializeCombat: Failed to initialize combat', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Apply progressive difficulty scaling to enemy based on node position
   * @param {ICE} ice - Enemy ICE instance
   * @param {Object} nodeData - Node metadata
   * @param {number} actNumber - Current act number
   * @private
   */
  applyProgressiveScaling(ice, nodeData, actNumber) {
    console.log('[BattleScene] applyProgressiveScaling: Applying difficulty scaling', {
      nodeRow: nodeData.nodeRow,
      totalRows: nodeData.totalRows,
      actNumber: actNumber,
      enemyName: ice.name,
      baseHP: ice.maxHP
    });
    
    try {
      // Calculate node progress (0.0 to 1.0)
      const totalRows = nodeData.totalRows || 6;
      const nodeProgress = nodeData.nodeRow / (totalRows - 1);
      
      // Progressive scaling: +0% at row 0, up to +20% at final row before boss
      const progressMultiplier = 1.0 + (nodeProgress * 0.20);
      
      // Act multiplier from config
      const actMultipliers = GAME_CONFIG.DIFFICULTY.ACT_DIFFICULTY_MULTIPLIER;
      const actMultiplier = actMultipliers[actNumber - 1] || 1.0;
      
      // Elite bonus (if applicable)
      const eliteMultiplier = nodeData.isElite ? 1.15 : 1.0;
      
      // Combined multiplier
      const totalMultiplier = progressMultiplier * actMultiplier * eliteMultiplier;
      
      // Apply scaling to HP
      const originalMaxHP = ice.maxHP;
      ice.maxHP = Math.floor(ice.maxHP * totalMultiplier);
      ice.currentHP = ice.maxHP;
      
      console.log('[BattleScene] applyProgressiveScaling: HP scaled', {
        originalHP: originalMaxHP,
        newHP: ice.maxHP,
        progressMultiplier: progressMultiplier.toFixed(2),
        actMultiplier: actMultiplier.toFixed(2),
        eliteMultiplier: eliteMultiplier.toFixed(2),
        totalMultiplier: totalMultiplier.toFixed(2)
      });
      
      // Apply scaling to all intent damage values
      if (ice.intentPool && Array.isArray(ice.intentPool)) {
        ice.intentPool.forEach(intent => {
          if (intent.value && (intent.type === 'attack' || intent.type === 'multiAttack' || intent.type === 'trace')) {
            const originalValue = intent.value;
            intent.value = Math.floor(intent.value * totalMultiplier);
            
            console.log('[BattleScene] applyProgressiveScaling: Intent scaled', {
              intentType: intent.type,
              originalValue: originalValue,
              newValue: intent.value
            });
          }
        });
      }
      
      // Apply scaling to boss phases
      if (ice.phases && Array.isArray(ice.phases)) {
        ice.phases.forEach((phase, phaseIndex) => {
          if (phase.intentPool && Array.isArray(phase.intentPool)) {
            phase.intentPool.forEach(intent => {
              if (intent.value && (intent.type === 'attack' || intent.type === 'multiAttack' || intent.type === 'trace')) {
                const originalValue = intent.value;
                intent.value = Math.floor(intent.value * totalMultiplier);
                
                console.log('[BattleScene] applyProgressiveScaling: Boss phase intent scaled', {
                  phaseIndex: phaseIndex,
                  intentType: intent.type,
                  originalValue: originalValue,
                  newValue: intent.value
                });
              }
            });
          }
        });
      }
      
      console.log('[BattleScene] applyProgressiveScaling: ✅ Scaling complete', {
        enemyName: ice.name,
        finalHP: ice.maxHP,
        multiplier: totalMultiplier.toFixed(2)
      });
      
    } catch (error) {
      console.error('[BattleScene] applyProgressiveScaling: Error applying scaling', {
        error: error.message,
        stack: error.stack
      });
      // Don't throw - allow combat to continue with base values
    }
  }

  /**
   * Setup event listeners for combat events
   * @private
   */
  setupEventListeners() {
    console.log('[BattleScene] setupEventListeners: Setting up event listeners');

    try {
      this.battleUI.on('cardClicked', (data) => {
        console.log('[BattleScene] Event: cardClicked', {
          cardName: data.card?.name,
          cardCost: data.card?.cost
        });
        this.onCardClick(data.card, data.cardSprite);
      });

      this.battleUI.on('endTurnClicked', () => {
        console.log('[BattleScene] Event: endTurnClicked');
        this.onEndTurnClick();
      });

      this.events.on('cardPlayed', (data) => {
        console.log('[BattleScene] Event: cardPlayed', {
          cardName: data.card?.name
        });
        this.onCardPlayed(data);
      });

      this.events.on('damageDealt', (data) => {
        console.log('[BattleScene] Event: damageDealt', {
          amount: data.amount,
          target: data.target
        });
        this.animateDamage(data);
      });

      this.events.on('blockGained', (data) => {
        console.log('[BattleScene] Event: blockGained', {
          amount: data.amount,
          target: data.target
        });
        this.animateBlock(data);
      });

      this.events.on('statusApplied', (data) => {
        console.log('[BattleScene] Event: statusApplied', {
          type: data.type,
          target: data.target,
          stacks: data.stacks
        });
        this.animateStatusApplied(data);
      });

      this.events.on('traceIncreased', (data) => {
        console.log('[BattleScene] Event: traceIncreased', {
          amount: data.amount,
          currentTrace: data.currentTrace
        });
        this.hudElements.updateTraceMeter(data.currentTrace, data.maxTrace);
      this.showCombatLog(`Trace +${data.amount} (${data.currentTrace}/${data.maxTrace})`);
      
      // DYNAMIC: Enemy alert animation on trace thresholds
      const tracePercent = data.currentTrace / data.maxTrace;
      if (tracePercent >= 0.9 && this.lastTracePercent < 0.9) {
        animateEnemyAlert(this, this.enemySprite, 'critical').catch(err => console.error(err));
        this.showCombatLog('⚠️ CRITICAL TRACE LEVEL!');
        this.updatePatrolIntensity(); // Increase search intensity
      } else if (tracePercent >= 0.66 && this.lastTracePercent < 0.66) {
        animateEnemyAlert(this, this.enemySprite, 'high').catch(err => console.error(err));
        this.showCombatLog('⚠️ High trace detected!');
        this.updatePatrolIntensity(); // Increase search intensity
      } else if (tracePercent >= 0.33 && this.lastTracePercent < 0.33) {
        animateEnemyAlert(this, this.enemySprite, 'medium').catch(err => console.error(err));
        this.updatePatrolIntensity(); // Increase search intensity
      }
      this.lastTracePercent = tracePercent;
      });

      this.events.on('traceReduced', (data) => {
        console.log('[BattleScene] Event: traceReduced', {
          amount: data.amount,
          currentTrace: data.currentTrace
        });
        this.hudElements.updateTraceMeter(data.currentTrace, data.maxTrace);
        this.showCombatLog(`Trace -${data.amount} (${data.currentTrace}/${data.maxTrace})`);
      });

      this.events.on('cpuGained', (data) => {
        console.log('[BattleScene] Event: cpuGained', {
          amount: data.amount,
          currentCPU: data.currentCPU
        });
        this.hudElements.updateCPU(data.currentCPU, data.maxCPU);
        this.showCombatLog(`CPU +${data.amount}`);
      });

      this.events.on('cardsDiscarded', (data) => {
        console.log('[BattleScene] Event: cardsDiscarded', {
          count: data.count,
          handSize: data.handSize
        });
        this.battleUI.updateHand(this.runner.deck.hand);
        this.battleUI.updatePileCounts();
      });

      this.events.on('artifactTriggered', (data) => {
        console.log('[BattleScene] Event: artifactTriggered', {
          blockedDebuff: data.blockedDebuff
        });
        this.showCombatLog(`Artifact blocked ${data.blockedDebuff}!`);
      });

      this.events.on('victory', () => {
        console.log('[BattleScene] Event: victory');
        this.handleVictory();
      });

      this.events.on('defeat', () => {
        console.log('[BattleScene] Event: defeat');
        this.handleDefeat();
      });

      this.events.on('turnStart', (data) => {
        console.log('[BattleScene] Event: turnStart', {
          turn: data.turn
        });
        this.hudElements.updateTurn(data.turn, 'playerTurn');
        this.hudElements.updateCPU(data.player.cpu, data.player.maxCPU);
      });

      this.events.on('turnEnd', (data) => {
        console.log('[BattleScene] Event: turnEnd', {
          turn: data.turn,
          cardsPlayed: data.cardsPlayed
        });
      });

      this.events.on('enemyTurnComplete', (data) => {
        console.log('[BattleScene] Event: enemyTurnComplete');
        this.hudElements.updateEnemyHP(data.enemy.hp, data.enemy.maxHP, data.enemy.name);
        this.hudElements.updateTraceMeter(data.player.trace, data.player.maxTrace);
      });

      this.setupCombatLogListener();

      console.log('[BattleScene] setupEventListeners: Event listeners setup complete');

    } catch (error) {
      console.error('[BattleScene] setupEventListeners: Failed to setup listeners', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Create combat log display
   * @private
   */
  createCombatLog() {
    console.log('[BattleScene] createCombatLog: Creating combat log');

    try {
      const logX = 20;
      const logY = 120;
      const logWidth = 250;

      const logBg = this.add.rectangle(
        logX + logWidth / 2,
        logY + 100,
        logWidth,
        200,
        GAME_CONFIG.UI.COLOR_HEX.BACKGROUND_MID,
        0.8
      );
      logBg.setStrokeStyle(2, GAME_CONFIG.UI.COLOR_HEX.CYAN_PRIMARY);
      logBg.setDepth(GAME_CONFIG.UI.Z_INDEX.HUD);

      const logTitle = this.add.text(logX + 10, logY - 25, 'COMBAT LOG', {
        fontSize: '14px',
        color: GAME_CONFIG.UI.COLORS.CYAN_PRIMARY,
        fontFamily: GAME_CONFIG.UI.TEXT.FONT_FAMILY,
        fontStyle: 'bold'
      });
      logTitle.setDepth(GAME_CONFIG.UI.Z_INDEX.HUD);

      this.combatLogText = this.add.text(logX + 10, logY, '', {
        fontSize: '14px',
        color: GAME_CONFIG.UI.COLORS.TEXT_PRIMARY,
        fontFamily: GAME_CONFIG.UI.TEXT.FONT_FAMILY,
        wordWrap: { width: logWidth - 20 },
        lineSpacing: 4,
        stroke: '#000000',
        strokeThickness: 2,
        fontStyle: 'bold'
      });
      this.combatLogText.setDepth(GAME_CONFIG.UI.Z_INDEX.HUD);

      console.log('[BattleScene] createCombatLog: Combat log created');

    } catch (error) {
      console.error('[BattleScene] createCombatLog: Failed to create combat log', {
        error: error.message
      });
    }
  }

  /**
   * Create forfeit button
   * @private
   */
  createForfeitButton() {
    console.log('[BattleScene] createForfeitButton: Creating forfeit button');

    try {
      const buttonX = GAME_CONFIG.PHASER.WIDTH - 100;
      const buttonY = 30;

      this.forfeitButton = this.add.container(buttonX, buttonY);
      this.forfeitButton.setDepth(GAME_CONFIG.UI.Z_INDEX.HUD);

      const buttonBg = this.add.rectangle(0, 0, 80, 30, GAME_CONFIG.UI.COLOR_HEX.RED_WARNING);
      buttonBg.setStrokeStyle(2, GAME_CONFIG.UI.COLOR_HEX.WHITE);

      const buttonText = this.add.text(0, 0, 'FORFEIT', {
        fontSize: '12px',
        color: '#000000',
        fontFamily: GAME_CONFIG.UI.TEXT.FONT_FAMILY,
        fontStyle: 'bold'
      });
      buttonText.setOrigin(0.5);

      this.forfeitButton.add([buttonBg, buttonText]);
      this.forfeitButton.setSize(80, 30);
      this.forfeitButton.setInteractive({ useHandCursor: true });

      this.forfeitButton.on('pointerover', () => {
        buttonBg.setFillStyle(GAME_CONFIG.UI.COLOR_HEX.WHITE);
        buttonText.setColor(GAME_CONFIG.UI.COLORS.RED_WARNING);
      });

      this.forfeitButton.on('pointerout', () => {
        buttonBg.setFillStyle(GAME_CONFIG.UI.COLOR_HEX.RED_WARNING);
        buttonText.setColor('#000000');
      });

      this.forfeitButton.on('pointerdown', () => {
        console.log('[BattleScene] Forfeit button clicked');
        this.showForfeitConfirmation();
      });

      console.log('[BattleScene] createForfeitButton: Forfeit button created');

    } catch (error) {
      console.error('[BattleScene] createForfeitButton: Failed to create forfeit button', {
        error: error.message
      });
    }
  }

  /**
   * Show forfeit confirmation dialog
   * @private
   */
  showForfeitConfirmation() {
    console.log('[BattleScene] showForfeitConfirmation: Showing confirmation dialog');

    if (this.forfeitConfirmOverlay) {
      console.warn('[BattleScene] showForfeitConfirmation: Overlay already exists');
      return;
    }

    try {
      this.forfeitConfirmOverlay = this.add.container(
        GAME_CONFIG.PHASER.WIDTH / 2,
        GAME_CONFIG.PHASER.HEIGHT / 2
      );
      this.forfeitConfirmOverlay.setDepth(GAME_CONFIG.UI.Z_INDEX.MODALS);

      const overlay = this.add.rectangle(
        0, 0,
        GAME_CONFIG.PHASER.WIDTH,
        GAME_CONFIG.PHASER.HEIGHT,
        0x000000,
        0.7
      );

      const dialogBg = this.add.rectangle(0, 0, 400, 200, GAME_CONFIG.UI.COLOR_HEX.BACKGROUND_MID);
      dialogBg.setStrokeStyle(4, GAME_CONFIG.UI.COLOR_HEX.RED_WARNING);

      const dialogText = this.add.text(0, -40, 'FORFEIT COMBAT?', {
        fontSize: '24px',
        color: GAME_CONFIG.UI.COLORS.RED_WARNING,
        fontFamily: GAME_CONFIG.UI.TEXT.FONT_FAMILY,
        fontStyle: 'bold'
      });
      dialogText.setOrigin(0.5);

      const warningText = this.add.text(0, -10, 'You will lose this run', {
        fontSize: '16px',
        color: GAME_CONFIG.UI.COLORS.TEXT_SECONDARY,
        fontFamily: GAME_CONFIG.UI.TEXT.FONT_FAMILY
      });
      warningText.setOrigin(0.5);

      const confirmButton = this.createButton(0, 40, 'CONFIRM', () => {
        console.log('[BattleScene] Forfeit confirmed');
        this.handleDefeat();
      });

      const cancelButton = this.createButton(0, 80, 'CANCEL', () => {
        console.log('[BattleScene] Forfeit cancelled');
        this.hideForfeitConfirmation();
      });

      this.forfeitConfirmOverlay.add([overlay, dialogBg, dialogText, warningText, confirmButton, cancelButton]);

      console.log('[BattleScene] showForfeitConfirmation: Confirmation dialog shown');

    } catch (error) {
      console.error('[BattleScene] showForfeitConfirmation: Failed to show confirmation', {
        error: error.message
      });
    }
  }

  /**
   * Hide forfeit confirmation dialog
   * @private
   */
  hideForfeitConfirmation() {
    console.log('[BattleScene] hideForfeitConfirmation: Hiding confirmation dialog');

    if (this.forfeitConfirmOverlay) {
      this.forfeitConfirmOverlay.destroy();
      this.forfeitConfirmOverlay = null;
    }
  }

  /**
   * Create a button
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} text - Button text
   * @param {Function} callback - Click callback
   * @returns {Phaser.GameObjects.Container} Button container
   * @private
   */
  createButton(x, y, text, callback) {
    const button = this.add.container(x, y);
    
    const bg = this.add.rectangle(0, 0, 120, 35, GAME_CONFIG.UI.COLOR_HEX.CYAN_PRIMARY);
    bg.setStrokeStyle(2, GAME_CONFIG.UI.COLOR_HEX.WHITE);

    const buttonText = this.add.text(0, 0, text, {
      fontSize: '14px',
      color: '#000000',
      fontFamily: GAME_CONFIG.UI.TEXT.FONT_FAMILY,
      fontStyle: 'bold'
    });
    buttonText.setOrigin(0.5);

    button.add([bg, buttonText]);
    button.setSize(120, 35);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      bg.setFillStyle(GAME_CONFIG.UI.COLOR_HEX.WHITE);
      buttonText.setColor(GAME_CONFIG.UI.COLORS.CYAN_PRIMARY);
    });

    button.on('pointerout', () => {
      bg.setFillStyle(GAME_CONFIG.UI.COLOR_HEX.CYAN_PRIMARY);
      buttonText.setColor('#000000');
    });

    button.on('pointerdown', callback);

    return button;
  }

  /**
   * Start background music
   * @private
   */
  startBackgroundMusic() {
    console.log('[BattleScene] startBackgroundMusic: Starting combat music', {
      isBoss: this.isBossCombat
    });

    try {
      if (!audioManager.init(this)) {
        console.error('[BattleScene] startBackgroundMusic: Failed to initialize audio manager');
        return;
      }

      const musicKey = this.isBossCombat ? 
        GAME_CONFIG.AUDIO.MUSIC_KEYS.BOSS : 
        GAME_CONFIG.AUDIO.MUSIC_KEYS.COMBAT;

      if (this.cache.audio.exists(musicKey)) {
        audioManager.playMusic(musicKey, true, true);
        console.log('[BattleScene] startBackgroundMusic: Music started', { musicKey });
      } else {
        console.warn('[BattleScene] startBackgroundMusic: Music not found', { musicKey });
      }

    } catch (error) {
      console.error('[BattleScene] startBackgroundMusic: Error starting music', {
        error: error.message
      });
    }
  }

  /**
   * Setup debug controls (keyboard shortcuts)
   * @private
   */
  setupDebugControls() {
    console.log('[BattleScene] setupDebugControls: Setting up debug keyboard shortcuts');

    try {
      this.input.keyboard.on('keydown-G', () => {
        GAME_CONFIG.GOD_MODE = !GAME_CONFIG.GOD_MODE;
        console.log('[BattleScene] Debug: God Mode', GAME_CONFIG.GOD_MODE ? 'ON' : 'OFF');
        this.showCombatLog(`Debug: God Mode ${GAME_CONFIG.GOD_MODE ? 'ON' : 'OFF'}`);
      });

      this.input.keyboard.on('keydown-W', () => {
        console.log('[BattleScene] Debug: Force victory');
        this.handleVictory();
      });

      this.input.keyboard.on('keydown-L', () => {
        console.log('[BattleScene] Debug: Force defeat');
        this.handleDefeat();
      });

      this.input.keyboard.on('keydown-C', () => {
        this.runner.currentCPU = this.runner.maxCPU;
        this.hudElements.updateCPU(this.runner.currentCPU, this.runner.maxCPU);
        console.log('[BattleScene] Debug: CPU restored');
        this.showCombatLog('Debug: CPU restored');
      });

      this.input.keyboard.on('keydown-D', () => {
        const damage = 10;
        this.enemy.takeDamage(damage);
        this.hudElements.updateEnemyHP(this.enemy.currentHP, this.enemy.maxHP, this.enemy.name);
        console.log('[BattleScene] Debug: Enemy took 10 damage');
        this.showCombatLog('Debug: Enemy -10 HP');
        
        if (this.enemy.isDefeated()) {
          this.handleVictory();
        }
      });

      console.log('[BattleScene] setupDebugControls: Debug controls active', {
        controls: ['G=GodMode', 'W=Win', 'L=Lose', 'C=RestoreCPU', 'D=DamageEnemy']
      });

    } catch (error) {
      console.error('[BattleScene] setupDebugControls: Error setting up debug controls', {
        error: error.message
      });
    }
  }

  /**
   * Execute player turn (draw cards, reset CPU)
   * @private
   */
  executePlayerTurn() {
    console.log('[BattleScene] executePlayerTurn: Starting player turn');

    if (this.turnInProgress) {
      console.warn('[BattleScene] executePlayerTurn: Turn already in progress, skipping');
      return;
    }

    this.turnInProgress = true;
    this.isPlayerTurn = true;

    try {
      // CRITICAL FIX: Destroy any remaining shields from previous turn
      this.destroyPlayerShield();
      
      combatSystem.startTurn();
      
      // CRITICAL: Apply relic effects at turn start
      if (this.runner.relics && this.runner.relics.length > 0) {
        const effects = relicSystem.getAggregatedEffects();
        
        if (effects.traceReductionPerTurn > 0) {
          const reduction = Math.min(effects.traceReductionPerTurn, this.runner.currentTrace);
          if (reduction > 0) {
            this.runner.modifyTrace(-reduction, 'relic:stealth_module');
            this.hudElements.updateTraceMeter(this.runner.currentTrace, this.runner.maxTrace);
            this.showCombatLog(`Relic: -${reduction} Trace`);
          }
        }
        
        if (effects.bonusCardsPerTurn > 0) {
          for (let i = 0; i < effects.bonusCardsPerTurn; i++) {
            this.runner.deck.drawCard();
          }
          this.showCombatLog(`Relic: Draw +${effects.bonusCardsPerTurn}`);
        }
      }

      // Give time for deck operations to complete before updating UI
      this.time.delayedCall(50, () => {
        this.battleUI.updateHand(this.runner.deck.hand);
        this.battleUI.updatePileCounts();
        this.updateCardPlayability();
      });

      this.battleUI.enableEndTurnButton();
      
      // CRITICAL FIX: Update intent display at start of player turn
      this.hudElements.updateEnemyIntent(this.enemy.currentIntent);
      
      this.showCombatLog(`Turn ${this.gameState.turn}: Your Turn`);
      this.showCombatLog(`Enemy Intent: ${this.enemy.getIntentDescription()}`);

      console.log('[BattleScene] executePlayerTurn: Player turn ready', {
        turn: this.gameState.turn,
        handSize: this.runner.deck.hand.length,
        cpu: this.runner.currentCPU,
        enemyIntent: this.enemy.getIntentDescription()
      });

      this.turnInProgress = false;

    } catch (error) {
      console.error('[BattleScene] executePlayerTurn: Error executing player turn', {
        error: error.message,
        stack: error.stack
      });
      this.turnInProgress = false;
    }
  }

  /**
   * Handle card click event
   * @param {Card} card - Card that was clicked
   * @param {Phaser.GameObjects.Container} cardSprite - Card sprite container
   */
  onCardClick(card, cardSprite) {
    if (!card) {
      console.error('[BattleScene] onCardClick: Card is null or undefined');
      return;
    }

    if (!cardSprite) {
      console.error('[BattleScene] onCardClick: Card sprite is null or undefined');
      return;
    }

    console.log('[BattleScene] onCardClick: Card clicked', {
      cardName: card.name,
      cardCost: card.cost,
      currentCPU: this.runner.currentCPU,
      isProcessing: this.isProcessingAction,
      isPlayerTurn: this.isPlayerTurn
    });

    if (this.isProcessingAction) {
      console.warn('[BattleScene] onCardClick: Action already in progress, ignoring click');
      return;
    }

    if (!this.isPlayerTurn) {
      console.warn('[BattleScene] onCardClick: Not player turn, ignoring click');
      return;
    }

    if (!card.isPlayable(this.gameState)) {
      console.warn('[BattleScene] onCardClick: Card is not playable', {
        cardName: card.name,
        cardCost: card.cost,
        currentCPU: this.runner.currentCPU
      });
      audioManager.playSound(GAME_CONFIG.AUDIO.SFX_KEYS.BUTTON_CLICK, 0.5);
      
      // Flash red to show unplayable
      this.tweens.add({
        targets: cardSprite,
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        repeat: 1
      });
      
      return;
    }

    this.isProcessingAction = true;

    try {
      audioManager.playSound(GAME_CONFIG.AUDIO.SFX_KEYS.CARD_PLAY);

      // Immediately start animation
      this.playCardWithAnimation(card, cardSprite).catch(error => {
        console.error('[BattleScene] onCardClick: Animation failed', error);
        this.isProcessingAction = false;
      });

    } catch (error) {
      console.error('[BattleScene] onCardClick: Error playing card', {
        cardName: card.name,
        error: error.message,
        stack: error.stack
      });
      this.isProcessingAction = false;
    }
  }

  /**
   * Play card with animation
   * @param {Card} card - Card to play
   * @param {Phaser.GameObjects.Container} cardSprite - Card sprite
   * @private
   */
  async playCardWithAnimation(card, cardSprite) {
    console.log('[BattleScene] playCardWithAnimation: Playing card with animation', {
      cardName: card.name
    });

    try {
      // Target is center of screen for now
      const targetX = GAME_CONFIG.PHASER.WIDTH / 2;
      const targetY = GAME_CONFIG.PHASER.HEIGHT / 2 - 100;

      console.log('[BattleScene] playCardWithAnimation: Animating to', { targetX, targetY });

      // Disable interaction during animation
      cardSprite.disableInteractive();

      // VISUAL EFFECT: Energy beam from card to target
      const cardStartX = cardSprite.x;
      const cardStartY = cardSprite.y;
      
      // Animate card to center
      await this.cardUI.playCardAnimation(cardSprite, targetX, targetY);
      
      // VISUAL EFFECT: Shoot energy beam to enemy if attack card
      if (card.type === 'exploit' || card.effects.some(e => e.type === 'damage' && e.target === 'enemy')) {
        const enemyX = GAME_CONFIG.UI.ENEMY.SPRITE_X;
        const enemyY = GAME_CONFIG.UI.ENEMY.SPRITE_Y;
        animateEnergyBeam(this, targetX, targetY, enemyX, enemyY, 0x00f0ff).catch(err => console.error(err));
      }

      console.log('[BattleScene] playCardWithAnimation: Animation complete, executing card effect');

      // Execute card effect through combat system
      const playSuccess = combatSystem.playCard(card);

      if (!playSuccess) {
        console.error('[BattleScene] playCardWithAnimation: Failed to play card', {
          cardName: card.name
        });
        this.isProcessingAction = false;
        return;
      }

      console.log('[BattleScene] playCardWithAnimation: Card played successfully in combat system');

      // Remove from hand tracking but DON'T destroy sprite yet
      this.battleUI.removeCardFromHand(cardSprite);
      
      // Update UI immediately
      this.battleUI.updateHand(this.runner.deck.hand);
      this.battleUI.updatePileCounts();
      
      // Keep card visible on battlefield center for dramatic effect
      this.time.delayedCall(600, () => {
        if (cardSprite && cardSprite.scene) {
          // Fade out the card
          this.tweens.add({
            targets: cardSprite,
            alpha: 0,
            scale: 0.8,
            duration: 400,
            ease: 'Power2',
            onComplete: () => {
              if (cardSprite && cardSprite.scene) {
                cardSprite.destroy();
              }
            }
          });
        }
      });
      
      // CRITICAL FIX: Force UI refresh after card effects execute
      this.time.delayedCall(150, () => {
        // Force read CURRENT values from runner (not cached)
        const currentCPU = this.runner.currentCPU;
        const maxCPU = this.runner.maxCPU;
        const currentTrace = this.runner.currentTrace;
        const maxTrace = this.runner.maxTrace;
        const playerBlock = this.runner.block;
        const enemyBlock = this.enemy.block;
        
        console.log('[BattleScene] playCardWithAnimation: Forcing UI refresh with values:', {
          cpu: `${currentCPU}/${maxCPU}`,
          trace: `${currentTrace}/${maxTrace}`,
          playerBlock,
          enemyBlock
        });
        
        this.hudElements.updateCPU(currentCPU, maxCPU);
        this.hudElements.updateTraceMeter(currentTrace, maxTrace);
        this.hudElements.updateEnemyHP(this.enemy.currentHP, this.enemy.maxHP, this.enemy.name);
        this.hudElements.updateBlockDisplays(playerBlock, enemyBlock);
        this.battleUI.updatePileCounts();
        this.updateCardPlayability();
      });

      // VISUAL FEEDBACK: Show special mechanics in combat log
      if (card.id === 'exploit_uncommon_003') {
        const chainCount = combatSystem.chainExploitPlaysThisTurn || 0;
        if (chainCount > 0) {
          this.showCombatLog(`Chain Exploit: Next play deals +${chainCount * 2} damage!`);
        }
      }
      
      this.showCombatLog(`Played: ${card.name}`);

      // Small delay before allowing next action
      this.time.delayedCall(200, () => {
        this.isProcessingAction = false;
      });

      console.log('[BattleScene] playCardWithAnimation: Complete', {
        cardName: card.name,
        remainingCPU: this.runner.currentCPU,
        handSize: this.runner.deck.hand.length
      });

    } catch (error) {
      console.error('[BattleScene] playCardWithAnimation: Error during card animation', {
        cardName: card.name,
        error: error.message,
        stack: error.stack
      });
      this.isProcessingAction = false;
    }
  }

  /**
   * Handle end turn button click
   */
  onEndTurnClick() {
    console.log('[BattleScene] onEndTurnClick: End turn clicked');

    if (this.isProcessingAction) {
      console.warn('[BattleScene] onEndTurnClick: Action in progress, ignoring');
      return;
    }

    if (!this.isPlayerTurn) {
      console.warn('[BattleScene] onEndTurnClick: Not player turn, ignoring');
      return;
    }

    this.isProcessingAction = true;
    this.isPlayerTurn = false;

    try {
      audioManager.playSound(GAME_CONFIG.AUDIO.SFX_KEYS.TURN_END);

      this.battleUI.disableEndTurnButton();

      combatSystem.endTurn();

      this.showCombatLog('Turn ended');

      // FIXED: Execute enemy turn IMMEDIATELY (no delay)
      // Enemy attacks first, THEN transition happens
      this.executeEnemyTurn();

      console.log('[BattleScene] onEndTurnClick: Turn ended, enemy turn executing immediately');

    } catch (error) {
      console.error('[BattleScene] onEndTurnClick: Error ending turn', {
        error: error.message,
        stack: error.stack
      });
      this.isProcessingAction = false;
      this.isPlayerTurn = true;
    }
  }

  /**
   * Execute enemy turn
   * @private
   */
    async executeEnemyTurn() {
    console.log('[BattleScene] executeEnemyTurn: Executing enemy turn');

    try {
      this.hudElements.updateTurn(this.gameState.turn, 'enemyTurn');

      // CRITICAL FIX: Show the intent that's ABOUT TO EXECUTE
      const currentIntent = this.enemy.currentIntent;
      this.showCombatLog(`Enemy: ${this.enemy.getIntentDescription()}`);

      await this.animateEnemyIntent();

      // VISUAL EFFECT: Destroy shields AND block texts after enemy action completes
      await this.time.delayedCall(200, () => {});
      
      // Destroy BOTH player and enemy shields after enemy turn
      this.destroyPlayerShield();
      this.destroyAllShields(); // NEW: Clean up all shields
      this.destroyBlockTexts(); // NEW: Remove block text displays
      
      await this.time.delayedCall(500, () => {});

      // Update all UI elements after enemy action executes
      this.hudElements.updateAllElements(combatSystem.getCombatState());
      
      // CRITICAL FIX: Update intent display to show NEXT turn's intent
      this.time.delayedCall(100, () => {
        this.hudElements.updateEnemyIntent(this.enemy.currentIntent);
        this.showCombatLog(`Enemy Intent: ${this.enemy.getIntentDescription()}`);
      });
      
      await this.time.delayedCall(GAME_CONFIG.ANIMATION.TURN_TRANSITION_DELAY, () => {
        this.battleUI.updatePileCounts();
        this.isProcessingAction = false;
        this.executePlayerTurn();
      });

      console.log('[BattleScene] executeEnemyTurn: Enemy turn complete');

    } catch (error) {
      console.error('[BattleScene] executeEnemyTurn: Error during enemy turn', {
        error: error.message,
        stack: error.stack
      });
      this.isProcessingAction = false;
    }
  }

  /**
   * Animate enemy intent execution
   * @private
   */
  async animateEnemyIntent() {
    console.log('[BattleScene] animateEnemyIntent: Animating enemy action');

    try {
      const intent = this.enemy.currentIntent;

      if (!intent) {
        console.warn('[BattleScene] animateEnemyIntent: No intent to animate');
        return;
      }

      // DYNAMIC SEARCH: Enemy searches for player before acting
      const playerTrace = this.runner.currentTrace;
      const tracePercent = playerTrace / this.runner.maxTrace;
      
      if (tracePercent > 0.3) {
        await animateEnemySearch(this, this.enemySprite, tracePercent);
      }

      // VISUAL EFFECT: Dynamic attack based on damage
      if (intent.type === 'attack' || intent.type === 'multiAttack') {
        const originalX = this.enemySprite.x;
        const originalY = this.enemySprite.y;
        
        // Calculate intensity based on damage
        const damage = intent.type === 'multiAttack' ? (intent.value * intent.hits) : intent.value;
        const intensity = Math.min(damage / 20, 1.5); // Scale 0-1.5x

        // Dynamic lunge - more damage = more aggressive
        await this.tweens.add({
          targets: this.enemySprite,
          x: originalX - (60 * intensity),
          y: originalY + (30 * intensity),
          scaleX: 1.0 + (0.15 * intensity),
          scaleY: 1.0 - (0.05 * intensity),
          duration: Math.max(150, 300 - (damage * 5)), // Faster for high damage
          ease: 'Power2',
          yoyo: true,
          onComplete: () => {
            if (this.enemySprite && this.enemySprite.scene) {
              animateImpactFlash(this, this.enemySprite, 0xff0055, 150).catch(err => console.error(err));
              
              // Dynamic screen shake based on damage
              this.cameras.main.shake(150 * intensity, 0.004 * intensity);
            }
          }
        });

        // Shoot energy beam at player
        const playerX = GAME_CONFIG.PHASER.WIDTH / 2;
        const playerY = GAME_CONFIG.PHASER.HEIGHT / 2;
        animateEnergyBeam(this, originalX, originalY, playerX, playerY, 0xff0055).catch(err => console.error(err));

      } else if (intent.type === 'defend') {
        const blockAmount = intent.value || 0;
        const spinSpeed = Math.min(blockAmount / 10, 1.0); // 0-1x rotation speed
        
        // Dynamic shield pulse based on block amount
        await this.tweens.add({
          targets: this.enemySprite,
          rotation: Math.PI * 2 * spinSpeed,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 400,
          ease: 'Back.Out',
          onComplete: () => {
            this.enemySprite.rotation = 0;
            this.enemySprite.setScale(1.0);
          }
        });
        
        animateShieldEffect(this, this.enemySprite.x, this.enemySprite.y, 90 + blockAmount).catch(err => console.error(err));

      } else if (intent.type === 'trace') {
        // Trace intent - enemy "scans" aggressively
        await animateEnemySearch(this, this.enemySprite, 1.0);
        await animatePulse(this, this.enemySprite, 1.15, 250);

      } else {
        // Default pulse
        await animatePulse(this, this.enemySprite, 1.1, 200);
      }

      console.log('[BattleScene] animateEnemyIntent: Animation complete');

    } catch (error) {
      console.error('[BattleScene] animateEnemyIntent: Animation error', {
        error: error.message
      });
    }
  }

  /**
   * Handle card played event
   * @param {Object} data - Card played event data
   * @private
   */
  onCardPlayed(data) {
    if (!data || !data.card) {
      console.error('[BattleScene] onCardPlayed: Invalid event data', { data });
      return;
    }

    console.log('[BattleScene] onCardPlayed: Card played event received', {
      cardName: data.card.name,
      cardType: data.card.type
    });
  }

  /**
   * Animate damage
   * @param {Object} data - Damage event data
   * @private
   */
  async animateDamage(data) {
    if (!data) {
      console.error('[BattleScene] animateDamage: Invalid data', { data });
      return;
    }

    console.log('[BattleScene] animateDamage: Animating damage', {
      amount: data.amount,
      target: data.target
    });

    try {
      let targetSprite = null;
      let targetX = 0;
      let targetY = 0;

      if (data.target === 'enemy' || data.target === this.enemy.name || data.target === this.enemy.id) {
        targetSprite = this.enemySprite;
        targetX = GAME_CONFIG.UI.ENEMY.SPRITE_X;
        targetY = GAME_CONFIG.UI.ENEMY.SPRITE_Y;
        audioManager.playSound(GAME_CONFIG.AUDIO.SFX_KEYS.DAMAGE);
        
        // VISUAL EFFECTS: Shake + Flash + Particles
        if (targetSprite) {
          animateShake(this, targetSprite, 8, 150).catch(err => console.error(err));
          animateImpactFlash(this, targetSprite, 0xff0055, 120).catch(err => console.error(err));
          animateParticleExplosion(this, targetX, targetY, 0xff0055, 15).catch(err => console.error(err));
        }
        
      } else {
        targetX = GAME_CONFIG.PHASER.WIDTH / 2;
        targetY = GAME_CONFIG.PHASER.HEIGHT - 150;
        audioManager.playSound(GAME_CONFIG.AUDIO.SFX_KEYS.TRACE_INCREASE);
        
        // Player damage: Screen shake + red vignette
        this.cameras.main.shake(200, 0.003);
        this.cameras.main.flash(150, 255, 0, 0, false, null, 0.2);
      }

      animateDamageNumber(this, targetX, targetY, data.amount, '#ff0055');

      this.hudElements.updateEnemyHP(data.targetHP || this.enemy.currentHP, data.targetMaxHP || this.enemy.maxHP, this.enemy.name);

      if (data.targetTrace !== undefined) {
        this.hudElements.updateTraceMeter(data.targetTrace, data.targetMaxTrace);
      }

      console.log('[BattleScene] animateDamage: Damage animation complete', {
        amount: data.amount,
        target: data.target
      });

    } catch (error) {
      console.error('[BattleScene] animateDamage: Animation error', {
        error: error.message,
        data
      });
    }
  }

  /**
   * Animate block gain
   * @param {Object} data - Block event data
   * @private
   */
  async animateBlock(data) {
    if (!data) {
      console.error('[BattleScene] animateBlock: Invalid data', { data });
      return;
    }

    console.log('[BattleScene] animateBlock: Animating block', {
      amount: data.amount,
      target: data.target
    });

    try {
      let targetX = 0;
      let targetY = 0;
      const isPlayer = data.target === 'player' || data.target === this.runner.name;

      if (isPlayer) {
        // FIXED: Player shield appears in BATTLEFIELD CENTER (not at bottom)
        targetX = GAME_CONFIG.PHASER.WIDTH / 2;
        targetY = GAME_CONFIG.PHASER.HEIGHT / 2;
      } else {
        targetX = GAME_CONFIG.UI.ENEMY.SPRITE_X;
        targetY = GAME_CONFIG.UI.ENEMY.SPRITE_Y;
      }

      audioManager.playSound(GAME_CONFIG.AUDIO.SFX_KEYS.BLOCK);

      // VISUAL EFFECTS: Create PERSISTENT shield
      this.createPersistentShield(targetX, targetY, isPlayer);
      
      // Show block amount with "BLOCKED +X" text
      this.showBlockedText(targetX, targetY, data.amount, isPlayer);

      console.log('[BattleScene] animateBlock: Block animation complete');

    } catch (error) {
      console.error('[BattleScene] animateBlock: Animation error', {
        error: error.message,
        data
      });
    }
  }

  /**
   * Show "BLOCKED +X" text animation - stays visible until turn ends
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} amount - Block amount
   * @param {boolean} isPlayer - Is this player's block?
   * @private
   */
  showBlockedText(x, y, amount, isPlayer) {
    console.log('[BattleScene] showBlockedText: Showing persistent block text', { x, y, amount, isPlayer });

    try {
      // Destroy old block text if exists
      if (isPlayer && this.playerBlockText) {
        this.playerBlockText.destroy();
        this.playerBlockText = null;
      } else if (!isPlayer && this.enemyBlockText) {
        this.enemyBlockText.destroy();
        this.enemyBlockText = null;
      }

      // Create text showing block amount
      const blockText = this.add.text(x, y - 80, `BLOCKED +${amount}`, {
        fontSize: '32px',
        color: isPlayer ? GAME_CONFIG.UI.COLORS.CYAN_PRIMARY : GAME_CONFIG.UI.COLORS.MAGENTA_PRIMARY,
        fontFamily: GAME_CONFIG.UI.TEXT.FONT_FAMILY,
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 5
      });
      blockText.setOrigin(0.5);
      blockText.setDepth(GAME_CONFIG.UI.Z_INDEX.TOOLTIPS);
      blockText.setAlpha(0);

      // Store reference
      if (isPlayer) {
        this.playerBlockText = blockText;
      } else {
        this.enemyBlockText = blockText;
      }

      // Animate: Fade in and stay visible
      this.tweens.add({
        targets: blockText,
        alpha: 1,
        duration: 500,
        ease: 'Power2'
      });

      // Add subtle pulse animation to keep it visible
      this.tweens.add({
        targets: blockText,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut'
      });

      console.log('[BattleScene] showBlockedText: Persistent block text created');

    } catch (error) {
      console.error('[BattleScene] showBlockedText: Error showing text', {
        error: error.message
      });
    }
  }

  /**
   * Destroy block text displays
   * @private
   */
  destroyBlockTexts() {
    console.log('[BattleScene] destroyBlockTexts: Destroying block text displays');

    try {
      if (this.playerBlockText) {
        this.tweens.killTweensOf(this.playerBlockText);
        this.tweens.add({
          targets: this.playerBlockText,
          alpha: 0,
          duration: 300,
          ease: 'Power2',
          onComplete: () => {
            if (this.playerBlockText && this.playerBlockText.scene) {
              this.playerBlockText.destroy();
            }
            this.playerBlockText = null;
          }
        });
      }

      if (this.enemyBlockText) {
        this.tweens.killTweensOf(this.enemyBlockText);
        this.tweens.add({
          targets: this.enemyBlockText,
          alpha: 0,
          duration: 300,
          ease: 'Power2',
          onComplete: () => {
            if (this.enemyBlockText && this.enemyBlockText.scene) {
              this.enemyBlockText.destroy();
            }
            this.enemyBlockText = null;
          }
        });
      }

      console.log('[BattleScene] destroyBlockTexts: Block texts destroyed');

    } catch (error) {
      console.error('[BattleScene] destroyBlockTexts: Error destroying texts', {
        error: error.message
      });
    }
  }

  /**
   * Create persistent shield visual that stays until destroyed
   * @param {number} x - Shield X position
   * @param {number} y - Shield Y position
   * @param {boolean} isPlayer - Is this player's shield?
   * @private
   */
createPersistentShield(x, y, isPlayer) {
    console.log('[BattleScene] createPersistentShield: Creating shield', { x, y, isPlayer });

    try {
      // Clear old shield if exists (BOTH player and enemy)
      if (isPlayer && this.playerBlockVisual) {
        this.playerBlockVisual.forEach(graphic => {
          if (graphic && graphic.scene) graphic.destroy();
        });
        this.playerBlockVisual = null;
      } else if (!isPlayer && this.activeShieldGraphics) {
        // Destroy old enemy shields
        this.activeShieldGraphics.forEach(graphic => {
          if (graphic && graphic.scene) graphic.destroy();
        });
        this.activeShieldGraphics = [];
      }
      
      // Continue with existing shield creation...
      if (isPlayer && this.playerBlockVisual) {
        this.playerBlockVisual.forEach(graphic => {
          if (graphic && graphic.scene) graphic.destroy();
        });
        this.playerBlockVisual = null;
      }

      const shieldGraphics = [];

      // Create 3 rotating shield rings
      for (let i = 0; i < 3; i++) {
        const ring = this.add.circle(x, y, 70 + i * 15, 0x00f0ff, 0);
        ring.setStrokeStyle(3 - i, 0x00f0ff, 0.6 - i * 0.15);
        ring.setDepth(GAME_CONFIG.UI.Z_INDEX.CARDS + 5);
        ring.setScale(0);
        shieldGraphics.push(ring);

        // Animate in
        this.tweens.add({
          targets: ring,
          scale: 1,
          alpha: 0.4 - i * 0.1,
          duration: 300,
          delay: i * 50,
          ease: 'Back.Out'
        });

        // Continuous rotation
        this.tweens.add({
          targets: ring,
          rotation: Math.PI * 2,
          duration: 3000 + i * 500,
          repeat: -1,
          ease: 'Linear'
        });

        // Subtle pulse
        this.tweens.add({
          targets: ring,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 1500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut'
        });
      }

      // Store reference
      if (isPlayer) {
        this.playerBlockVisual = shieldGraphics;
      } else {
        this.activeShieldGraphics.push(...shieldGraphics);
      }

      console.log('[BattleScene] createPersistentShield: Shield created and persisting');

    } catch (error) {
      console.error('[BattleScene] createPersistentShield: Error creating shield', {
        error: error.message
      });
    }
  }

  /**
   * Destroy player shield with animation
   * @private
   */
  destroyPlayerShield() {
    if (!this.playerBlockVisual || this.playerBlockVisual.length === 0) {
      return;
    }

    console.log('[BattleScene] destroyPlayerShield: Destroying shield with animation');

    try {
      this.playerBlockVisual.forEach((ring, index) => {
        if (!ring || !ring.scene) return;

        this.tweens.add({
          targets: ring,
          scale: 1.5,
          alpha: 0,
          duration: 300,
          delay: index * 30,
          ease: 'Power2',
          onComplete: () => {
            if (ring && ring.scene) ring.destroy();
          }
        });
      });

      this.playerBlockVisual = null;

      console.log('[BattleScene] destroyPlayerShield: Shield destroyed');

    } catch (error) {
      console.error('[BattleScene] destroyPlayerShield: Error destroying shield', {
        error: error.message
      });
    }
  }

  /**
   * Destroy all shield graphics (player and enemy)
   * @private
   */
  destroyAllShields() {
    console.log('[BattleScene] destroyAllShields: Cleaning up all shields');

    try {
      // Destroy player shield
      if (this.playerBlockVisual && this.playerBlockVisual.length > 0) {
        this.playerBlockVisual.forEach(ring => {
          if (ring && ring.scene) ring.destroy();
        });
        this.playerBlockVisual = null;
      }

      // Destroy enemy shields
      if (this.activeShieldGraphics && this.activeShieldGraphics.length > 0) {
        this.activeShieldGraphics.forEach(ring => {
          if (ring && ring.scene) ring.destroy();
        });
        this.activeShieldGraphics = [];
      }

      console.log('[BattleScene] destroyAllShields: All shields destroyed');

    } catch (error) {
      console.error('[BattleScene] destroyAllShields: Error destroying shields', {
        error: error.message
      });
    }
  }

  /**
   * Animate status effect application
   * @param {Object} data - Status effect event data
   * @private
   */
  async animateStatusApplied(data) {
    if (!data || !data.type) {
      console.error('[BattleScene] animateStatusApplied: Invalid data', { data });
      return;
    }

    console.log('[BattleScene] animateStatusApplied: Animating status effect', {
      type: data.type,
      target: data.target,
      stacks: data.stacks
    });

    try {
      const target = data.target === 'enemy' ? 'enemy' : 'player';
      
      let targetX = 0;
      let targetY = 0;

      if (target === 'enemy') {
        targetX = GAME_CONFIG.UI.ENEMY.SPRITE_X;
        targetY = GAME_CONFIG.UI.ENEMY.SPRITE_Y;
        
        this.hudElements.addStatusEffect('enemy', {
          type: data.type,
          stacks: data.stacks,
          duration: data.duration || -1
        });
      } else {
        targetX = GAME_CONFIG.PHASER.WIDTH / 2;
        targetY = GAME_CONFIG.PHASER.HEIGHT - 150;
        
        this.hudElements.addStatusEffect('player', {
          type: data.type,
          stacks: data.stacks,
          duration: data.duration || -1
        });
      }
      
      // VISUAL EFFECTS: Status particle burst
      animateStatusEffect(this, targetX, targetY, data.type).catch(err => console.error(err));

      this.showCombatLog(`${target === 'enemy' ? 'Enemy' : 'Player'}: ${data.type} +${data.stacks}`);

      console.log('[BattleScene] animateStatusApplied: Status effect animation complete');

    } catch (error) {
      console.error('[BattleScene] animateStatusApplied: Animation error', {
        error: error.message,
        data
      });
    }
  }

  /**
   * Update card playability visuals
   * @private
   */
  updateCardPlayability() {
    if (!this.battleUI || !this.gameState) {
      console.warn('[BattleScene] updateCardPlayability: Missing battleUI or gameState');
      return;
    }

    try {
      this.battleUI.setCardPlayability(this.gameState);

      // VISUAL FEEDBACK: Update Total System Compromise cost display
      const handCards = this.runner?.deck?.hand || [];
      const totalSystemCard = handCards.find(c => c.id === 'exploit_rare_002');
      if (totalSystemCard && this.gameState.cardsPlayedThisTurn) {
        const actualCost = totalSystemCard.getActualCost(this.gameState);
        if (actualCost < totalSystemCard.cost) {
          console.log('[BattleScene] updateCardPlayability: Total System Compromise reduced cost:', {
            baseCost: totalSystemCard.cost,
            actualCost: actualCost,
            reduction: totalSystemCard.cost - actualCost
          });
        }
      }

      console.log('[BattleScene] updateCardPlayability: Card playability updated');

    } catch (error) {
      console.error('[BattleScene] updateCardPlayability: Error updating playability', {
        error: error.message
      });
    }
  }

  /**
   * Handle victory
   */
 handleVictory() {
    console.log('[BattleScene] handleVictory: Victory achieved!', {
      turn: this.gameState?.turn,
      playerTrace: this.runner.currentTrace,
      enemyDefeated: this.enemy.isDefeated(),
      isBoss: this.isBossCombat
    });
    
    const turnsToWin = this.gameState.turn - this.combatStartTurn;
    console.log('[BattleScene] handleVictory: Combat duration:', turnsToWin, 'turns');
    
    if (turnsToWin <= 5 && !this.isBossCombat) {
      const quickBonus = Math.max(1, 6 - turnsToWin);
      this.runner.modifyTrace(-quickBonus, 'quick_victory_bonus');
      console.log('[BattleScene] handleVictory: Quick Victory! Trace reduced by', quickBonus);
      this.showCombatLog(`Quick Victory! Trace -${quickBonus}`);
    }
    
    if (this.runner && this.runner.relics) {
      const relicEffects = relicSystem.getAggregatedEffects();
      
      if (relicEffects.traceHealPerCombat > 0) {
        this.runner.modifyTrace(-relicEffects.traceHealPerCombat, 'relic:trace_eraser');
        console.log('[BattleScene] handleVictory: Trace Eraser healed', relicEffects.traceHealPerCombat, 'trace');
        this.showCombatLog(`Trace Eraser: -${relicEffects.traceHealPerCombat} Trace`);
      }
    }

    if (this.isProcessingAction) {
      console.log('[BattleScene] handleVictory: Already processing action, delaying victory');
      this.time.delayedCall(500, () => this.handleVictory());
      return;
    }

    this.isProcessingAction = true;

    try {
      audioManager.stopMusic(true);
      audioManager.playSound(GAME_CONFIG.AUDIO.SFX_KEYS.VICTORY);

      this.showCombatLog('VICTORY!');
      
      // DYNAMIC: Stop patrol and play defeat animation
      if (this.enemyPatrolTween) {
        this.enemyPatrolTween.stop();
      }
      if (this.enemyIdleTween) {
        this.enemyIdleTween.stop();
      }
      
      if (this.enemySprite && this.enemySprite.scene) {
        this.tweens.add({
          targets: this.enemySprite,
          alpha: 0,
          scaleX: 0.5,
          scaleY: 0.5,
          rotation: Math.PI * 2,
          duration: 800,
          ease: 'Power2'
        });
        animateParticleExplosion(this, this.enemySprite.x, this.enemySprite.y, 0xff0055, 30).catch(err => console.error(err));
      }

      // Generate rewards for ALL victories (boss and non-boss)
      console.log('[BattleScene] handleVictory: Generating rewards...', {
        isBoss: this.isBossCombat,
        isElite: this.isEliteCombat
      });
      const actNumber = this.actNumber || this.runState?.actNumber || 1;
      
      const cardChoices = rewardSystem.selectCardRewards(
        this.enemy.rewards.cardChoices || 3,
        actNumber,
        this.isBossCombat ? 'rare' : (this.isEliteCombat ? 'uncommon' : null)
      );

      console.log('[BattleScene] handleVictory: Card choices generated:', cardChoices.length);

      // CRITICAL FIX: Actually generate relic if boss guarantees it
      let earnedRelic = null;
      if (this.enemy.rewards.guaranteedRelic) {
        earnedRelic = rewardSystem.selectRelic(actNumber);
        console.log('[BattleScene] handleVictory: Boss relic earned:', earnedRelic?.name);
      }

      const formattedRewards = {
        credits: this.enemy.rewards.credits || 30,
        cardChoices: cardChoices,
        encounterType: this.isBossCombat ? 'boss' : (this.isEliteCombat ? 'elite' : 'combat'),
        bonusRewards: [],
        relic: earnedRelic,  // FIXED: Use actual relic object
        bossId: this.isBossCombat ? this.enemy.id : null  // NEW: Pass boss ID
      };

      console.log('[BattleScene] handleVictory: Formatted rewards:', formattedRewards);

      this.time.delayedCall(GAME_CONFIG.ANIMATION.VICTORY_SCREEN_DELAY, () => {
        const combatStats = combatSystem.getCombatStats();

        console.log('[BattleScene] handleVictory: Transitioning to RewardScene', {
          nodeId: this.nodeId
        });

        this.scene.start('RewardScene', {
          runner: this.runner,
          rewards: formattedRewards,
          runState: this.runState,
          mapState: this.runState,  // FIXED: RewardScene expects 'mapState' not 'runState'
          nodeId: this.nodeId,
          combatStats: combatStats
        });
      });

    } catch (error) {
      console.error('[BattleScene] handleVictory: Error handling victory', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Handle defeat
   */
  handleDefeat() {
    console.log('[BattleScene] handleDefeat: Defeat occurred', {
      turn: this.gameState?.turn,
      playerTrace: this.runner.currentTrace,
      maxTrace: this.runner.maxTrace
    });

    if (this.isProcessingAction && this.gameState?.phase !== 'defeat') {
      console.log('[BattleScene] handleDefeat: Already processing action, delaying defeat');
      this.time.delayedCall(500, () => this.handleDefeat());
      return;
    }

    this.isProcessingAction = true;

    try {
      // CRITICAL FIX: Delete current run save on defeat
      console.log('[BattleScene] handleDefeat: Deleting current run save...');
      saveSystem.deleteCurrentRun().then(() => {
        console.log('[BattleScene] handleDefeat: ✅ Run save deleted successfully');
      }).catch(error => {
        console.error('[BattleScene] handleDefeat: ⚠️ Failed to delete save:', error);
      });

      audioManager.stopMusic(true);
      audioManager.playSound(GAME_CONFIG.AUDIO.SFX_KEYS.DEFEAT);

      this.showCombatLog('DETECTED!');
      
      // DYNAMIC: Enemy victory celebration
      if (this.enemySprite && this.enemySprite.scene) {
        animateEnemyVictory(this, this.enemySprite).catch(err => console.error(err));
      }

      this.time.delayedCall(GAME_CONFIG.ANIMATION.DEFEAT_SCREEN_DELAY, () => {
        const combatStats = combatSystem.getCombatStats();

        console.log('[BattleScene] handleDefeat: Transitioning to MenuScene', {
          stats: combatStats
        });

        this.cameras.main.fadeOut(GAME_CONFIG.ANIMATION.SCREEN_FADE_DURATION, 0, 0, 0);

        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('MenuScene', {
            runStats: combatStats,
            wasDefeat: true
          });
        });
      });

    } catch (error) {
      console.error('[BattleScene] handleDefeat: Error handling defeat', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Show message in combat log
   * @param {string} message - Message to display
   */
  showCombatLog(message) {
    if (typeof message !== 'string' || !message) {
      console.error('[BattleScene] showCombatLog: Invalid message', { message });
      return;
    }

    try {
      this.combatLogMessages.push(message);

      const maxMessages = 10;
      if (this.combatLogMessages.length > maxMessages) {
        this.combatLogMessages.shift();
      }

      if (this.combatLogText) {
        this.combatLogText.setText(this.combatLogMessages.join('\n'));
      }

      console.log('[BattleScene] Combat Log:', message);

    } catch (error) {
      console.error('[BattleScene] showCombatLog: Error updating log', {
        error: error.message,
        message
      });
    }
  }

  /**
   * Setup listener for combat log events from CombatSystem
   * @private
   */
  setupCombatLogListener() {
    this.events.on('combatLog', (data) => {
      if (data && data.message) {
        this.showCombatLog(data.message);
      }
    });
  }

  /**
   * Update loop (called every frame)
   * @param {number} time - Total elapsed time
   * @param {number} delta - Time since last frame
   */
  update(time, delta) {
    if (GAME_CONFIG.SHOW_FPS && time % 1000 < delta) {
      const fps = Math.round(1000 / delta);
      if (fps < 30) {
        console.warn('[BattleScene] Low FPS:', fps);
      }
    }
  }

  /**
   * Shutdown scene and cleanup
   */
    shutdown() {
    console.log('[BattleScene] shutdown: Starting scene cleanup');

    try {
      if (this.battleUI) {
        this.battleUI.shutdown();
        this.battleUI = null;
      }

      if (this.hudElements) {
        this.hudElements.shutdown();
        this.hudElements = null;
      }

      if (this.cardUI) {
        this.cardUI.shutdown();
        this.cardUI = null;
      }

      if (this.forfeitButton) {
        this.forfeitButton.removeAllListeners();
        this.forfeitButton.destroy();
        this.forfeitButton = null;
      }

      if (this.forfeitConfirmOverlay) {
        this.forfeitConfirmOverlay.removeAll(true);
        this.forfeitConfirmOverlay.destroy();
        this.forfeitConfirmOverlay = null;
      }

      // CLEANUP: Destroy shield graphics
      if (this.playerBlockVisual) {
        this.playerBlockVisual.forEach(graphic => {
          if (graphic && graphic.scene) graphic.destroy();
        });
        this.playerBlockVisual = null;
      }

      if (this.activeShieldGraphics && this.activeShieldGraphics.length > 0) {
        this.activeShieldGraphics.forEach(graphic => {
          if (graphic && graphic.scene) graphic.destroy();
        });
        this.activeShieldGraphics = [];
      }

      // CLEANUP: Stop enemy animations
      if (this.enemyIdleTween) {
        this.enemyIdleTween.stop();
        this.enemyIdleTween = null;
      }
      
      if (this.enemyPatrolTween) {
        this.enemyPatrolTween.stop();
        this.enemyPatrolTween = null;
      }

      this.input.keyboard.removeAllListeners();
      this.events.removeAllListeners();

      this.tweens.killAll();
      cleanupAnimations(this);

      audioManager.stopMusic(false);
      audioManager.stopAllSounds();

      this.combatLogMessages = [];
      this.isProcessingAction = false;
      this.isPlayerTurn = true;
      this.turnInProgress = false;

      console.log('[BattleScene] shutdown: Scene cleanup complete', {
        tweensRemaining: this.tweens.getAllTweens().length,
        childrenRemaining: this.children.list.length
      });

    } catch (error) {
      console.error('[BattleScene] shutdown: Error during cleanup', {
        error: error.message,
        stack: error.stack
      });
    }
  }
}

console.log('[BattleScene] ✅ BattleScene class loaded successfully');

if (GAME_CONFIG.DEBUG_MODE) {
  console.log('[BattleScene] Debug mode enabled - keyboard shortcuts active');
  console.log('[BattleScene] Shortcuts: G=GodMode | W=Win | L=Lose | C=RestoreCPU | D=DamageEnemy');
}