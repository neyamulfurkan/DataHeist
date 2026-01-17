/**
 * DefeatScene.js
 * 
 * Purpose: Defeat screen when trace reaches 100 or player dies
 * Shows run statistics, updates progression, returns to menu
 */

console.log('[DefeatScene] Loading DefeatScene module...');

import { GAME_CONFIG } from '../config.js';
import progressionSystem from '../systems/ProgressionSystem.js';
import saveSystem from '../systems/SaveSystem.js';
import audioManager from '../utils/AudioManager.js';

export default class DefeatScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DefeatScene' });
    console.log('[DefeatScene] Constructor initialized');
  }

  init(data) {
    console.log('[DefeatScene] init: Scene initialized with data:', data);
    
    this.runData = data.runData || {};
    this.actNumber = data.actNumber || 1;
    this.finalTrace = data.finalTrace || 100;
    this.turnsSurvived = data.turnsSurvived || 0;
  }

  async create() {
    console.log('[DefeatScene] create: Building defeat screen...');
    
    try {
      audioManager.init(this);
      audioManager.stopMusic(true);
      audioManager.playSound('sfx_defeat', 0.6);
      
      this.createBackground();
      this.createDefeatMessage();
      await this.processDefeat();
      this.createContinueButton();
      
      console.log('[DefeatScene] create: ✅ Defeat screen created');
      
    } catch (error) {
      console.error('[DefeatScene] create: ❌ Error:', error);
    }
  }

  createBackground() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const bg = this.add.rectangle(0, 0, width, height, 0x1a0a0a);
    bg.setOrigin(0);
    
    // Glitch effect
    const overlay = this.add.rectangle(0, 0, width, height, 0xff0055, 0.1);
    overlay.setOrigin(0);
    
    this.tweens.add({
      targets: overlay,
      alpha: { from: 0.1, to: 0.3 },
      duration: 500,
      yoyo: true,
      repeat: -1
    });
  }

  createDefeatMessage() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    
    const defeatText = this.add.text(centerX, centerY - 100, 'TRACED & EJECTED', {
      fontSize: '64px',
      color: '#ff0055',
      fontFamily: GAME_CONFIG.UI.TEXT.FONT_FAMILY,
      fontStyle: 'bold'
    });
    defeatText.setOrigin(0.5);
    
    this.tweens.add({
      targets: defeatText,
      scale: { from: 1.2, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 800,
      ease: 'Power2'
    });
    
    const statsText = this.add.text(centerX, centerY, 
      `Act ${this.actNumber} • ${this.turnsSurvived} turns survived`, {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: GAME_CONFIG.UI.TEXT.FONT_FAMILY
    });
    statsText.setOrigin(0.5);
    statsText.setAlpha(0);
    
    this.tweens.add({
      targets: statsText,
      alpha: 1,
      duration: 600,
      delay: 400
    });
  }

  async processDefeat() {
    console.log('[DefeatScene] processDefeat: Processing defeat and updating stats...');
    
    try {
      // Prepare run data
      const completeRunData = {
        ...this.runData,
        victory: false,
        actNumber: this.actNumber,
        finalTrace: this.finalTrace,
        totalTurns: this.turnsSurvived
      };
      
      // Process run completion (updates stats, small credit reward)
      progressionSystem.onRunComplete(completeRunData, false);
      
      // Delete current run save
      await saveSystem.deleteCurrentRun();
      console.log('[DefeatScene] processDefeat: ✅ Current run deleted');
      
      // Force save progression
      await progressionSystem.save();
      console.log('[DefeatScene] processDefeat: ✅ Progression saved');
      
    } catch (error) {
      console.error('[DefeatScene] processDefeat: ❌ Error processing defeat:', error);
    }
  }

  createContinueButton() {
    const centerX = this.cameras.main.width / 2;
    const buttonY = this.cameras.main.height - 100;
    
    const button = this.add.container(centerX, buttonY);
    
    const bg = this.add.rectangle(0, 0, 300, 60, 0xff0055);
    bg.setStrokeStyle(3, 0xffffff);
    
    const label = this.add.text(0, 0, 'RETURN TO MENU', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: GAME_CONFIG.UI.TEXT.FONT_FAMILY,
      fontStyle: 'bold'
    });
    label.setOrigin(0.5);
    
    button.add([bg, label]);
    button.setSize(300, 60);
    button.setInteractive({ useHandCursor: true });
    
    button.on('pointerover', () => {
      audioManager.playSound('sfx_ui_hover', 0.3);
      bg.setFillStyle(0xff1166);
    });
    
    button.on('pointerout', () => {
      bg.setFillStyle(0xff0055);
    });
    
    button.on('pointerdown', () => {
      audioManager.playSound('sfx_ui_click', 0.5);
      console.log('[DefeatScene] Returning to menu...');
      this.scene.start('MenuScene');
    });
  }
}

console.log('[DefeatScene] ✅ Module loaded successfully');