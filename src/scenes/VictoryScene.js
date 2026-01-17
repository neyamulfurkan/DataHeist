/**
 * VictoryScene.js
 * 
 * Purpose: Victory screen after completing an act or full run
 * Shows rewards, updates progression, checks achievements
 */

console.log('[VictoryScene] Loading VictoryScene module...');

import { GAME_CONFIG } from '../config.js';
import progressionSystem from '../systems/ProgressionSystem.js';
import saveSystem from '../systems/SaveSystem.js';
import audioManager from '../utils/AudioManager.js';

export default class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VictoryScene' });
    console.log('[VictoryScene] Constructor initialized');
  }

  init(data) {
    console.log('[VictoryScene] init: Scene initialized with data:', data);
    
    this.runData = data.runData || {};
    this.actNumber = data.actNumber || 1;
    this.isFullRunComplete = data.isFullRunComplete || false;
    this.creditsEarned = data.creditsEarned || 0;
    this.bossDefeated = data.bossDefeated || null;
  }

  async create() {
    console.log('[VictoryScene] create: Building victory screen...');
    
    try {
      audioManager.init(this);
      audioManager.stopMusic(true);
      audioManager.playSound('sfx_victory', 0.8);
      
      this.createBackground();
      this.createVictoryMessage();
      await this.processVictory();
      this.createContinueButton();
      
      console.log('[VictoryScene] create: ✅ Victory screen created');
      
    } catch (error) {
      console.error('[VictoryScene] create: ❌ Error:', error);
    }
  }

  createBackground() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const bg = this.add.rectangle(0, 0, width, height, 0x0a0e27);
    bg.setOrigin(0);
    
    // Victory particles
    if (!this.textures.exists('particle')) {
      const graphics = this.make.graphics({ x: 0, y: 0, add: false });
      graphics.fillStyle(0x00ff88, 1);
      graphics.fillCircle(4, 4, 4);
      graphics.generateTexture('particle', 8, 8);
      graphics.destroy();
    }
    
    this.add.particles(0, 0, 'particle', {
      x: { min: 0, max: width },
      y: { min: -50, max: 0 },
      speedY: { min: 50, max: 150 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 3000,
      frequency: 50,
      quantity: 2,
      tint: 0x00ff88
    });
  }

  createVictoryMessage() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    
    const title = this.isFullRunComplete ? 'RUN COMPLETE!' : `ACT ${this.actNumber} COMPLETE!`;
    
    const victoryText = this.add.text(centerX, centerY - 100, title, {
      fontSize: '64px',
      color: '#00ff88',
      fontFamily: GAME_CONFIG.UI.TEXT.FONT_FAMILY,
      fontStyle: 'bold'
    });
    victoryText.setOrigin(0.5);
    
    this.tweens.add({
      targets: victoryText,
      scale: { from: 0, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 800,
      ease: 'Back.easeOut'
    });
    
    if (this.bossDefeated) {
      const bossText = this.add.text(centerX, centerY, `Defeated: ${this.bossDefeated}`, {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: GAME_CONFIG.UI.TEXT.FONT_FAMILY
      });
      bossText.setOrigin(0.5);
      bossText.setAlpha(0);
      
      this.tweens.add({
        targets: bossText,
        alpha: 1,
        duration: 600,
        delay: 400
      });
    }
  }

async processVictory() {
    console.log('[VictoryScene] processVictory: Processing victory and achievements...');
    
    try {
      // Prepare complete run data for progression system
      const completeRunData = {
        ...this.runData,
        victory: true,
        actNumber: this.actNumber,
        bossDefeated: this.bossDefeated,
        defeatedBosses: this.bossDefeated ? [this.bossDefeated] : [],
        credits: this.creditsEarned
      };
      
      console.log('[VictoryScene] processVictory: Complete run data:', completeRunData);
      
      // CRITICAL FIX: Check if we should advance acts or complete run
      if (this.isFullRunComplete) {
        console.log('[VictoryScene] processVictory: 🎉 FULL RUN COMPLETE - Processing victory');
        
        // Process run completion (updates stats, converts credits)
        progressionSystem.onRunComplete(completeRunData, true);
        
        // CRITICAL: Check achievements with full run data
        progressionSystem.checkAchievements(completeRunData);
        
        // Delete current run save (fresh start on next run)
        await saveSystem.deleteCurrentRun();
        console.log('[VictoryScene] processVictory: ✅ Current run deleted');
        
        // Force save progression
        await progressionSystem.save();
        console.log('[VictoryScene] processVictory: ✅ Progression saved');
        
        // Show achievement notifications
        this.showAchievementNotifications();
        
      } else {
        console.log('[VictoryScene] processVictory: 📈 ACT COMPLETE - Preparing to advance to Act', this.actNumber + 1);
        
        // DON'T process run completion yet (run isn't over)
        // DON'T delete save
        // DON'T check achievements (wait until full run complete)
        
        // Just check for act-specific achievements
        progressionSystem.checkAchievements(completeRunData);
        await progressionSystem.save();
        
        console.log('[VictoryScene] processVictory: ✅ Act progression saved');
      }
      
    } catch (error) {
      console.error('[VictoryScene] processVictory: ❌ Error processing victory:', error);
    }
  }

  showAchievementNotifications() {
    const centerX = this.cameras.main.width / 2;
    
    // Get recently earned achievements (compare current to what we had before)
    const currentAchievements = progressionSystem.metaData.achievements;
    
    if (currentAchievements && currentAchievements.length > 0) {
      const lastAchievement = currentAchievements[currentAchievements.length - 1];
      
      const achievementText = this.add.text(centerX, 150, `🏆 Achievement Unlocked: ${lastAchievement}`, {
        fontSize: '20px',
        color: '#ffcc00',
        fontFamily: GAME_CONFIG.UI.TEXT.FONT_FAMILY,
        fontStyle: 'bold'
      });
      achievementText.setOrigin(0.5);
      achievementText.setAlpha(0);
      
      this.tweens.add({
        targets: achievementText,
        alpha: 1,
        y: achievementText.y + 20,
        duration: 800,
        delay: 1000,
        ease: 'Back.easeOut'
      });
    }
  }

  createContinueButton() {
    const centerX = this.cameras.main.width / 2;
    const buttonY = this.cameras.main.height - 100;
    
    const button = this.add.container(centerX, buttonY);
    
    const bg = this.add.rectangle(0, 0, 300, 60, 0x00ff88);
    bg.setStrokeStyle(3, 0xffffff);
    
    // CRITICAL FIX: Button text depends on whether run is complete
    const buttonText = this.isFullRunComplete ? 'RETURN TO MENU' : `CONTINUE TO ACT ${this.actNumber + 1}`;
    
    const label = this.add.text(0, 0, buttonText, {
      fontSize: '20px',
      color: '#000000',
      fontFamily: GAME_CONFIG.UI.TEXT.FONT_FAMILY,
      fontStyle: 'bold'
    });
    label.setOrigin(0.5);
    
    button.add([bg, label]);
    button.setSize(300, 60);
    button.setInteractive({ useHandCursor: true });
    
    button.on('pointerover', () => {
      audioManager.playSound('sfx_ui_hover', 0.3);
      bg.setFillStyle(0x00ffaa);
    });
    
    button.on('pointerout', () => {
      bg.setFillStyle(0x00ff88);
    });
    
    button.on('pointerdown', () => {
      audioManager.playSound('sfx_ui_click', 0.5);
      
      if (this.isFullRunComplete) {
        console.log('[VictoryScene] Full run complete, returning to menu...');
        this.scene.start('MenuScene');
      } else {
        console.log('[VictoryScene] Advancing to Act', this.actNumber + 1);
        
        // CRITICAL FIX: Advance to next act in MapScene
        const updatedRunState = {
          ...this.runData,
          actNumber: this.actNumber + 1, // INCREMENT ACT
          bossesDefeated: (this.runData.bossesDefeated || 0) + 1,
          credits: this.runData.credits + this.creditsEarned,
          // RESET for new act
          currentNodeId: null,
          clearedNodes: [],
          visitedNodes: []
        };
        
        console.log('[VictoryScene] Transitioning to MapScene with updated runState:', updatedRunState);
        
        this.scene.start('MapScene', {
          runner: this.runData.runner || this.scene.get('MapScene').runner,
          runState: updatedRunState,
          newAct: true // Flag to generate new map
        });
      }
    });
  }
}

console.log('[VictoryScene] ✅ Module loaded successfully');