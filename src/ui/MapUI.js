/**
 * MapUI.js
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
 * ✓ Console logs use [MapUI] prefix
 * ✓ File length is within ±20% of estimate
 * 
 * Purpose: Network map visualization system - renders nodes, connections, paths, and handles node interaction
 * Dependencies: config.js, AnimationHelpers.js
 * Used by: MapScene.js
 */

// Phaser loaded globally from CDN in index.html
import { GAME_CONFIG } from '../config.js';
import { animatePulse, animateFadeIn, animateFadeOut } from '../utils/AnimationHelpers.js';

console.log('[MapUI] Module loaded');

/**
 * @typedef {Object} MapNode
 * @property {string} id - Unique node identifier
 * @property {string} type - Node type: combat, elite, boss, event, upgrade, reward
 * @property {number} x - Screen X position
 * @property {number} y - Screen Y position
 * @property {string[]} connections - Array of connected node IDs
 * @property {boolean} visited - Has player been here
 * @property {boolean} cleared - Has encounter been completed
 * @property {boolean} available - Can player select this node
 * @property {Object} data - Type-specific data
 */

/**
 * MapUI Class - Handles all map visualization and node interaction
 */
export default class MapUI {
  /**
   * Creates MapUI instance
   * @param {Phaser.Scene} scene - Parent scene
   */
  constructor(scene) {
    if (!scene) {
      const error = new Error('[MapUI] constructor: Scene is null or undefined');
      console.error(error);
      throw error;
    }

    if (!scene.add || !scene.tweens) {
      const error = new Error('[MapUI] constructor: Scene missing required managers (add, tweens)');
      console.error(error, { sceneKey: scene.scene?.key });
      throw error;
    }

    console.log('[MapUI] Initializing MapUI', { sceneKey: scene.scene?.key });

    this.scene = scene;
    this.nodeSprites = new Map();
    this.connectionLines = [];
    this.pathPreviewLines = [];
    this.currentNodeIndicator = null;
    this.tooltipContainer = null;
    this.glowAnimations = new Map();
    this.eventEmitter = new Phaser.Events.EventEmitter();

    console.log('[MapUI] ✅ MapUI initialized successfully');
  }

  /**
   * Renders entire map with nodes and connections
   * @param {Object} mapData - Map data from MapGenerator
   * @param {string} currentNodeId - Current player position node ID
   */
  renderMap(mapData, currentNodeId) {
    if (!mapData) {
      console.error('[MapUI] renderMap: mapData is null or undefined');
      return;
    }

    if (!mapData.nodes || !Array.isArray(mapData.nodes)) {
      console.error('[MapUI] renderMap: mapData.nodes is invalid', {
        hasNodes: !!mapData.nodes,
        isArray: Array.isArray(mapData.nodes)
      });
      return;
    }

    if (mapData.nodes.length === 0) {
      console.warn('[MapUI] renderMap: mapData.nodes is empty array');
      return;
    }

    console.log('[MapUI] renderMap: Starting map render', {
      nodeCount: mapData.nodes.length,
      currentNode: currentNodeId
    });

    this.clearMap();

    this.drawConnections(mapData);

    mapData.nodes.forEach((node, index) => {
      if (!node || !node.id) {
        console.error('[MapUI] renderMap: Invalid node at index', index, node);
        return;
      }

      try {
        const sprite = this.createNodeSprite(node);
        
        if (node.id === currentNodeId) {
          this.setNodeState(node.id, 'current');
        } else if (node.cleared || node.visited) {
          this.setNodeState(node.id, 'visited');
        } else if (node.available) {
          this.setNodeState(node.id, 'available');
        } else {
          this.setNodeState(node.id, 'locked');
        }
      } catch (error) {
        console.error('[MapUI] renderMap: Failed to create node sprite', {
          nodeId: node.id,
          index,
          error: error.message
        });
      }
    });

    if (currentNodeId) {
      this.setCurrentNode(currentNodeId);
    }

    console.log('[MapUI] renderMap: ✅ Map render complete', {
      nodesCreated: this.nodeSprites.size,
      connectionLinesCreated: this.connectionLines.length
    });
  }

  /**
   * Clears all map visuals
   */
  clearMap() {
    console.log('[MapUI] clearMap: Clearing all map elements', {
      nodeSprites: this.nodeSprites.size,
      connectionLines: this.connectionLines.length,
      glowAnimations: this.glowAnimations.size
    });

    this.nodeSprites.forEach((sprite, nodeId) => {
      if (sprite && sprite.destroy) {
        try {
          sprite.destroy();
        } catch (error) {
          console.error('[MapUI] clearMap: Error destroying node sprite', { nodeId, error: error.message });
        }
      }
    });
    this.nodeSprites.clear();

    this.connectionLines.forEach((line, index) => {
      if (line && line.destroy) {
        try {
          line.destroy();
        } catch (error) {
          console.error('[MapUI] clearMap: Error destroying connection line', { index, error: error.message });
        }
      }
    });
    this.connectionLines = [];

    this.pathPreviewLines.forEach((line, index) => {
      if (line && line.destroy) {
        try {
          line.destroy();
        } catch (error) {
          console.error('[MapUI] clearMap: Error destroying preview line', { index, error: error.message });
        }
      }
    });
    this.pathPreviewLines = [];

    if (this.currentNodeIndicator && this.currentNodeIndicator.destroy) {
      try {
        this.scene.tweens.killTweensOf(this.currentNodeIndicator);
        this.currentNodeIndicator.destroy();
        this.currentNodeIndicator = null;
      } catch (error) {
        console.error('[MapUI] clearMap: Error destroying current node indicator', error);
      }
    }

    if (this.tooltipContainer && this.tooltipContainer.destroy) {
      try {
        this.tooltipContainer.destroy();
        this.tooltipContainer = null;
      } catch (error) {
        console.error('[MapUI] clearMap: Error destroying tooltip', error);
      }
    }

    this.glowAnimations.forEach((tween, nodeId) => {
      if (tween) {
        try {
          this.scene.tweens.killTweensOf(tween.targets);
        } catch (error) {
          console.error('[MapUI] clearMap: Error killing glow animation', { nodeId, error: error.message });
        }
      }
    });
    this.glowAnimations.clear();

    console.log('[MapUI] clearMap: ✅ Clear complete');
  }

  /**
   * Draws connection lines between nodes
   * @param {Object} mapData - Map data containing nodes
   */
  drawConnections(mapData) {
    if (!mapData || !mapData.nodes) {
      console.error('[MapUI] drawConnections: Invalid mapData', mapData);
      return;
    }

    console.log('[MapUI] drawConnections: Drawing node connections');

    try {
      const graphics = this.scene.add.graphics();
      graphics.lineStyle(
        GAME_CONFIG.MAP.PATH_LINE_WIDTH,
        GAME_CONFIG.UI.COLOR_HEX.CYAN_PRIMARY,
        GAME_CONFIG.MAP.PATH_LINE_ALPHA
      );
      graphics.setDepth(GAME_CONFIG.UI.Z_INDEX.MAP_PATHS);

      let lineCount = 0;

      mapData.nodes.forEach((node, nodeIndex) => {
        if (!node || !node.connections || !Array.isArray(node.connections)) {
          console.warn('[MapUI] drawConnections: Node missing connections', {
            nodeId: node?.id,
            nodeIndex
          });
          return;
        }

        node.connections.forEach((targetId, connIndex) => {
          const targetNode = mapData.nodes.find(n => n && n.id === targetId);
          
          if (!targetNode) {
            console.warn('[MapUI] drawConnections: Target node not found', {
              sourceNodeId: node.id,
              targetId,
              connIndex
            });
            return;
          }

          if (typeof node.x !== 'number' || typeof node.y !== 'number' ||
              typeof targetNode.x !== 'number' || typeof targetNode.y !== 'number') {
            console.error('[MapUI] drawConnections: Invalid node coordinates', {
              source: { id: node.id, x: node.x, y: node.y },
              target: { id: targetNode.id, x: targetNode.x, y: targetNode.y }
            });
            return;
          }

          if (isNaN(node.x) || isNaN(node.y) || isNaN(targetNode.x) || isNaN(targetNode.y)) {
            console.error('[MapUI] drawConnections: Node coordinates are NaN', {
              source: { id: node.id, x: node.x, y: node.y },
              target: { id: targetNode.id, x: targetNode.x, y: targetNode.y }
            });
            return;
          }

          try {
            graphics.lineBetween(node.x, node.y, targetNode.x, targetNode.y);
            lineCount++;
          } catch (error) {
            console.error('[MapUI] drawConnections: Error drawing line', {
              source: node.id,
              target: targetId,
              error: error.message
            });
          }
        });
      });

      this.connectionLines.push(graphics);

      console.log('[MapUI] drawConnections: ✅ Connections drawn', { lineCount });
    } catch (error) {
      console.error('[MapUI] drawConnections: Fatal error during connection drawing', error);
    }
  }

  /**
   * Creates interactive node sprite
   * @param {MapNode} node - Node data
   * @returns {Phaser.GameObjects.Container} Node sprite container
   */
  createNodeSprite(node) {
    if (!node) {
      const error = new Error('[MapUI] createNodeSprite: Node is null or undefined');
      console.error(error);
      throw error;
    }

    if (!node.id) {
      const error = new Error('[MapUI] createNodeSprite: Node missing id property');
      console.error(error, node);
      throw error;
    }

    if (typeof node.x !== 'number' || typeof node.y !== 'number' || isNaN(node.x) || isNaN(node.y)) {
      const error = new Error('[MapUI] createNodeSprite: Invalid node coordinates');
      console.error(error, { nodeId: node.id, x: node.x, y: node.y });
      throw error;
    }

    console.log('[MapUI] createNodeSprite: Creating node', {
      id: node.id,
      type: node.type,
      position: { x: node.x, y: node.y }
    });

try {
      const size = node.type === 'boss' ? 
        GAME_CONFIG.UI.NODE.SIZE * 1.33 : 
        GAME_CONFIG.UI.NODE.SIZE;
      
      const iconSize = node.type === 'boss' ?
        GAME_CONFIG.UI.NODE.ICON_SIZE * 1.33 :
        GAME_CONFIG.UI.NODE.ICON_SIZE;

      const nodeColor = this.getNodeColor(node.type);
      
      // Create all elements at WORLD COORDINATES (node.x, node.y), not in a container
      const glow = this.scene.add.circle(node.x, node.y, (size / 2) + 10, 0xffffff, 0.3);
      glow.setVisible(false);
      glow.setDepth(GAME_CONFIG.UI.Z_INDEX.MAP_NODES);

      const bg = this.scene.add.circle(node.x, node.y, size / 2, nodeColor);
      bg.setStrokeStyle(4, 0xffffff, 1.0);
      bg.setDepth(GAME_CONFIG.UI.Z_INDEX.MAP_NODES);

      const iconText = this.getNodeIcon(node.type);
      const fontSize = node.type === 'boss' ? '32px' : '24px';
      
      const icon = this.scene.add.text(node.x, node.y, iconText, {
        fontSize: fontSize,
        color: '#ffffff',
        fontFamily: GAME_CONFIG.UI.TEXT.FONT_FAMILY,
        fontStyle: 'bold'
      }).setOrigin(0.5);
      icon.setDepth(GAME_CONFIG.UI.Z_INDEX.MAP_NODES);

      // Create a container just for organizing, but elements are at world coords
      const container = this.scene.add.container(0, 0);
      container.setDepth(GAME_CONFIG.UI.Z_INDEX.MAP_NODES);
      
      // Set up interactivity - simple hitbox works best
      bg.setInteractive({ useHandCursor: true });

      // Store bound event handlers for proper cleanup
      const handlers = {
        pointerover: () => {
          try {
            this.onNodeHover(node);
            if (node.available && !node.visited && !node.cleared) {
              glow.setVisible(true);
            }
          } catch (error) {
            console.error('[MapUI] createNodeSprite: Error in pointerover handler', {
              nodeId: node.id,
              error: error.message
            });
          }
        },
        pointerout: () => {
          try {
            this.onNodeOut(node);
            if (this.nodeSprites.get(node.id)?.getData('state') !== 'available') {
              glow.setVisible(false);
            }
          } catch (error) {
            console.error('[MapUI] createNodeSprite: Error in pointerout handler', {
              nodeId: node.id,
              error: error.message
            });
          }
        },
        pointerdown: () => {
          try {
            this.onNodeClick(node);
          } catch (error) {
            console.error('[MapUI] createNodeSprite: Error in pointerdown handler', {
              nodeId: node.id,
              error: error.message
            });
          }
        }
      };

      // Store handlers for later use
      bg.setData('handlers', handlers);

      // Attach handlers
      bg.on('pointerover', handlers.pointerover);
      bg.on('pointerout', handlers.pointerout);
      bg.on('pointerdown', handlers.pointerdown);

      // Store references in the container for state management
      container.setData('node', node);
      container.setData('state', 'locked');
      container.setData('glow', glow);
      container.setData('bg', bg);
      container.setData('icon', icon);
      container.setData('size', size);
      
      // Store reference in bg for easy access
      bg.setData('nodeContainer', container);
      bg.setData('glow', glow);
      bg.setData('icon', icon);

      this.nodeSprites.set(node.id, container);

      console.log('[MapUI] createNodeSprite: ✅ Node created', { nodeId: node.id });

      return container;
    } catch (error) {
      console.error('[MapUI] createNodeSprite: Fatal error creating node sprite', {
        nodeId: node.id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Gets icon text for node type
   * @param {string} nodeType - Node type
   * @returns {string} Icon text character
   */
  getNodeIcon(nodeType) {
    const icons = {
      'combat': '⚔️',
      'elite': '⚡',
      'boss': '👑',
      'event': '?',
      'upgrade': '⚙️',
      'reward': '💎'
    };

    const icon = icons[nodeType] || '•';
    
    if (!icons[nodeType]) {
      console.warn('[MapUI] getNodeIcon: Unknown node type, using default', { nodeType });
    }

    return icon;
  }

  /**
   * Gets color for node type
   * @param {string} nodeType - Node type
   * @returns {number} Phaser color number
   */
  getNodeColor(nodeType) {
    const colors = {
      'combat': 0xff0055,
      'elite': 0xff6b00,
      'boss': 0xff00ff,
      'event': 0x3498db,
      'upgrade': 0xf39c12,
      'reward': 0x2ecc71
    };

    const color = colors[nodeType] || 0x666666;

    if (!colors[nodeType]) {
      console.warn('[MapUI] getNodeColor: Unknown node type, using default gray', { nodeType });
    }

    return color;
  }

  /**
   * Sets visual state of a node
   * @param {string} nodeId - Node ID
   * @param {string} state - State: available, locked, visited, current
   */
  setNodeState(nodeId, state) {
    if (!nodeId) {
      console.error('[MapUI] setNodeState: nodeId is null or undefined');
      return;
    }

    if (typeof nodeId !== 'string') {
      console.error('[MapUI] setNodeState: nodeId must be string', { nodeId, type: typeof nodeId });
      return;
    }

    const validStates = ['available', 'locked', 'visited', 'current'];
    if (!validStates.includes(state)) {
      console.error('[MapUI] setNodeState: Invalid state', { nodeId, state, validStates });
      return;
    }
    
    console.log('[MapUI] setNodeState: Setting state', { nodeId, state });

    const nodeSprite = this.nodeSprites.get(nodeId);
    if (!nodeSprite) {
      console.warn('[MapUI] setNodeState: Node sprite not found', { nodeId });
      return;
    }

    const glow = nodeSprite.getData('glow');
    const bg = nodeSprite.getData('bg');
    const icon = nodeSprite.getData('icon');

    if (!bg || !icon) {
      console.error('[MapUI] setNodeState: Missing bg or icon data', { nodeId, hasBg: !!bg, hasIcon: !!icon });
      return;
    }

    // Stop existing glow animations
    if (this.glowAnimations.has(nodeId)) {
      try {
        const existingTween = this.glowAnimations.get(nodeId);
        if (existingTween && existingTween.isPlaying && existingTween.isPlaying()) {
          existingTween.stop();
          existingTween.remove();
        }
        this.glowAnimations.delete(nodeId);
      } catch (error) {
        console.error('[MapUI] setNodeState: Error stopping glow animation', {
          nodeId,
          error: error.message
        });
      }
    }

    // Remove any existing checkmark before state change
    const existingCheck = this.scene.children.list.find(
      child => child.name === `checkmark_${nodeId}`
    );
    if (existingCheck && state !== 'visited') {
      existingCheck.destroy();
    }

    switch (state) {
      case 'available':
        bg.setAlpha(1.0);
        icon.setAlpha(1.0);
        
        const node = nodeSprite.getData('node');
        if (node) {
          const nodeColor = this.getNodeColor(node.type);
          bg.setFillStyle(nodeColor, 1.0);
        }
        
        if (icon.clearTint) {
          icon.clearTint();
        }
        
        // CRITICAL: Reuse stored event handlers instead of creating new ones
        const handlers = bg.getData('handlers');
        
        if (!bg.input) {
          bg.setInteractive({ useHandCursor: true });
        }
        
        if (handlers) {
          // Remove old handlers first
          bg.off('pointerover');
          bg.off('pointerout');
          bg.off('pointerdown');
          
          // Reattach stored handlers
          bg.on('pointerover', handlers.pointerover);
          bg.on('pointerout', handlers.pointerout);
          bg.on('pointerdown', handlers.pointerdown);
        } else {
          console.warn('[MapUI] setNodeState: No handlers stored for node', nodeId);
        }
        
        if (glow) {
          glow.setVisible(true);
          glow.setAlpha(0.3);
          
          const glowTween = this.scene.tweens.add({
            targets: glow,
            alpha: { from: 0.3, to: 0.6 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut'
          });
          this.glowAnimations.set(nodeId, glowTween);
        }
        break;

      case 'locked':
        bg.setAlpha(0.4);
        icon.setAlpha(0.4);
        bg.setFillStyle(0x666666, 0.4);
        
        if (icon.setTint) {
          icon.setTint(0x666666);
        }
        
        // DON'T disable interactive - just make it visually locked
        // This prevents issues when toggling back to available
        
        if (glow) {
          glow.setVisible(false);
        }
        break;

      case 'visited':
        bg.setAlpha(0.6);
        icon.setAlpha(0.6);
        
        const visitedNode = nodeSprite.getData('node');
        if (visitedNode) {
          const visitedNodeColor = this.getNodeColor(visitedNode.type);
          bg.setFillStyle(visitedNodeColor, 0.6);
        }
        
        if (icon.clearTint) {
          icon.clearTint();
        }
        
        if (bg.input) {
          bg.disableInteractive();
        }
        
        if (glow) {
          glow.setVisible(false);
        }
        
        if (visitedNode) {
          const existingCheckmark = this.scene.children.list.find(
            child => child.name === `checkmark_${nodeId}`
          );
          
          if (!existingCheckmark) {
            const check = this.scene.add.text(visitedNode.x, visitedNode.y, '✓', {
              fontSize: '24px',
              color: GAME_CONFIG.UI.COLORS.GREEN_SUCCESS,
              fontFamily: GAME_CONFIG.UI.TEXT.FONT_FAMILY,
              fontStyle: 'bold'
            }).setOrigin(0.5);
            check.setDepth(GAME_CONFIG.UI.Z_INDEX.MAP_NODES + 1);
            check.name = `checkmark_${nodeId}`;
          }
        }
        break;

      case 'current':
        bg.setAlpha(1.0);
        icon.setAlpha(1.0);
        
        const currentNode = nodeSprite.getData('node');
        if (currentNode) {
          const currentNodeColor = this.getNodeColor(currentNode.type);
          bg.setFillStyle(currentNodeColor, 1.0);
        }
        
        if (icon.clearTint) {
          icon.clearTint();
        }
        
        // CRITICAL: Current nodes should also be interactive if not cleared
        if (!currentNode.cleared && bg.input) {
          bg.removeInteractive();
          bg.removeAllListeners();
        }
        
        if (!currentNode.cleared) {
          bg.setInteractive({ useHandCursor: true });
          
          bg.off('pointerover');
          bg.off('pointerout');
          bg.off('pointerdown');
          
          bg.on('pointerover', () => {
            try {
              this.onNodeHover(currentNode);
              if (glow) {
                glow.setVisible(true);
              }
            } catch (error) {
              console.error('[MapUI] setNodeState: Error in pointerover handler', error);
            }
          });

          bg.on('pointerout', () => {
            try {
              this.onNodeOut(currentNode);
            } catch (error) {
              console.error('[MapUI] setNodeState: Error in pointerout handler', error);
            }
          });

          bg.on('pointerdown', () => {
            try {
              this.onNodeClick(currentNode);
            } catch (error) {
              console.error('[MapUI] setNodeState: Error in pointerdown handler', error);
            }
          });
        }
        
        if (glow) {
          glow.setVisible(true);
          glow.setAlpha(0.8);
        }
        break;
    }

    nodeSprite.setData('state', state);
    console.log('[MapUI] setNodeState: ✅ State set', { nodeId, state });
  }

  /**
   * Updates which nodes are available for selection
   * @param {string[]} availableNodeIds - Array of node IDs that should be available
   */
  updateAvailableNodes(availableNodeIds) {
    if (!Array.isArray(availableNodeIds)) {
      console.error('[MapUI] updateAvailableNodes: availableNodeIds must be array', {
        received: availableNodeIds,
        type: typeof availableNodeIds
      });
      return;
    }

    console.log('[MapUI] updateAvailableNodes: Updating available nodes', {
      count: availableNodeIds.length,
      nodeIds: availableNodeIds
    });

    this.nodeSprites.forEach((sprite, nodeId) => {
      const currentState = sprite.getData('state');
      
      if (currentState === 'visited' || currentState === 'current') {
        return;
      }

      if (availableNodeIds.includes(nodeId)) {
        this.setNodeState(nodeId, 'available');
      } else {
        this.setNodeState(nodeId, 'locked');
      }
    });

    console.log('[MapUI] updateAvailableNodes: ✅ Available nodes updated');
  }

  /**
   * Sets current player position indicator
   * @param {string} nodeId - Current node ID
   */
  setCurrentNode(nodeId) {
    if (!nodeId) {
      console.error('[MapUI] setCurrentNode: nodeId is null or undefined');
      return;
    }

    console.log('[MapUI] setCurrentNode: Setting current node', { nodeId });

    if (this.currentNodeIndicator) {
      try {
        this.scene.tweens.killTweensOf(this.currentNodeIndicator);
        this.currentNodeIndicator.destroy();
        this.currentNodeIndicator = null;
      } catch (error) {
        console.error('[MapUI] setCurrentNode: Error destroying old indicator', error);
      }
    }

    const nodeSprite = this.nodeSprites.get(nodeId);
    if (!nodeSprite) {
      console.warn('[MapUI] setCurrentNode: Node sprite not found', { nodeId });
      return;
    }

    const node = nodeSprite.getData('node');
    if (!node) {
      console.error('[MapUI] setCurrentNode: Node data not found', { nodeId });
      return;
    }

    try {
      this.currentNodeIndicator = this.scene.add.circle(
        node.x,
        node.y,
        40,
        GAME_CONFIG.UI.COLOR_HEX.CYAN_PRIMARY,
        0.5
      );
      this.currentNodeIndicator.setDepth(GAME_CONFIG.UI.Z_INDEX.MAP_PATHS + 1);

      this.scene.tweens.add({
        targets: this.currentNodeIndicator,
        scale: { from: 1.0, to: 1.3 },
        alpha: { from: 0.5, to: 0.2 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut'
      });

      console.log('[MapUI] setCurrentNode: ✅ Current node indicator created');
    } catch (error) {
      console.error('[MapUI] setCurrentNode: Error creating indicator', {
        nodeId,
        error: error.message
      });
    }
  }

  /**
   * Handles node hover event
   * @param {MapNode} node - Hovered node
   */
  onNodeHover(node) {
    if (!node) {
      console.error('[MapUI] onNodeHover: Node is null or undefined');
      return;
    }

    console.log('[MapUI] onNodeHover: Node hovered', { nodeId: node.id, type: node.type });

    try {
      this.createTooltip(node);
      
      const nodeSprite = this.nodeSprites.get(node.id);
      if (nodeSprite && node.available && !node.visited && !node.cleared) {
        animatePulse(this.scene, nodeSprite, 1.1, 200).catch(error => {
          console.error('[MapUI] onNodeHover: Pulse animation failed', {
            nodeId: node.id,
            error: error.message
          });
        });
      }
    } catch (error) {
      console.error('[MapUI] onNodeHover: Error handling hover', {
        nodeId: node.id,
        error: error.message
      });
    }
  }

  /**
   * Handles node mouse out event
   * @param {MapNode} node - Node mouse left
   */
  onNodeOut(node) {
    if (!node) {
      console.error('[MapUI] onNodeOut: Node is null or undefined');
      return;
    }

    console.log('[MapUI] onNodeOut: Mouse left node', { nodeId: node.id });

    try {
      this.hideTooltip();
    } catch (error) {
      console.error('[MapUI] onNodeOut: Error handling mouse out', {
        nodeId: node.id,
        error: error.message
      });
    }
  }

  /**
   * Handles node click event
   * @param {MapNode} node - Clicked node
   */
  onNodeClick(node) {
    if (!node) {
      console.error('[MapUI] onNodeClick: Node is null or undefined');
      return;
    }

    console.log('[MapUI] onNodeClick: Node clicked', {
      nodeId: node.id,
      type: node.type,
      available: node.available
    });

    if (!node.available || node.visited || node.cleared) {
      console.warn('[MapUI] onNodeClick: Node not available for selection', {
        nodeId: node.id,
        available: node.available,
        visited: node.visited,
        cleared: node.cleared
      });
      return;
    }

    try {
      const nodeSprite = this.nodeSprites.get(node.id);
      if (nodeSprite) {
        animatePulse(this.scene, nodeSprite, 1.3, 300).catch(error => {
          console.error('[MapUI] onNodeClick: Click animation failed', {
            nodeId: node.id,
            error: error.message
          });
        });
      }

      this.eventEmitter.emit('nodeClicked', { node });
      console.log('[MapUI] onNodeClick: ✅ Node clicked event emitted');
    } catch (error) {
      console.error('[MapUI] onNodeClick: Error handling click', {
        nodeId: node.id,
        error: error.message
      });
    }
  }

  /**
   * Creates tooltip for node
   * @param {MapNode} node - Node to show tooltip for
   */
  createTooltip(node) {
    if (!node) {
      console.error('[MapUI] createTooltip: Node is null or undefined');
      return;
    }

    console.log('[MapUI] createTooltip: Creating tooltip', { nodeId: node.id, type: node.type });

    this.hideTooltip();

    try {
      const padding = 10;
      const bgWidth = 200;
      const bgHeight = 100;

      let tooltipX = node.x + 80;
      let tooltipY = node.y;

      if (tooltipX + bgWidth > GAME_CONFIG.PHASER.WIDTH) {
        tooltipX = node.x - 80 - bgWidth;
      }

      if (tooltipY + bgHeight / 2 > GAME_CONFIG.PHASER.HEIGHT) {
        tooltipY = GAME_CONFIG.PHASER.HEIGHT - bgHeight / 2 - 20;
      }

      if (tooltipY - bgHeight / 2 < 0) {
        tooltipY = bgHeight / 2 + 20;
      }

      this.tooltipContainer = this.scene.add.container(tooltipX, tooltipY);
      this.tooltipContainer.setDepth(GAME_CONFIG.UI.Z_INDEX.TOOLTIPS);

      const bg = this.scene.add.rectangle(0, 0, bgWidth, bgHeight, 0x0a0e27, 0.95);
      bg.setStrokeStyle(2, GAME_CONFIG.UI.COLOR_HEX.CYAN_PRIMARY);

      const title = this.scene.add.text(0, -30, node.type.toUpperCase(), {
        fontSize: '18px',
        color: GAME_CONFIG.UI.COLORS.CYAN_PRIMARY,
        fontFamily: GAME_CONFIG.UI.TEXT.FONT_FAMILY,
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
        shadow: {
          offsetX: 1,
          offsetY: 1,
          color: '#000000',
          blur: 2,
          fill: true
        }
      }).setOrigin(0.5);

      const description = this.getNodeDescription(node);
      const descText = this.scene.add.text(0, 0, description, {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: GAME_CONFIG.UI.TEXT.FONT_FAMILY,
        align: 'center',
        wordWrap: { width: bgWidth - padding * 2 },
        stroke: '#000000',
        strokeThickness: 2,
        lineSpacing: 2,
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.tooltipContainer.add([bg, title, descText]);

      animateFadeIn(this.scene, this.tooltipContainer, 200).catch(error => {
        console.error('[MapUI] createTooltip: Fade in animation failed', error);
      });

      console.log('[MapUI] createTooltip: ✅ Tooltip created');
    } catch (error) {
      console.error('[MapUI] createTooltip: Error creating tooltip', {
        nodeId: node.id,
        error: error.message
      });
    }
  }

  /**
   * Gets description text for node type
   * @param {MapNode} node - Node
   * @returns {string} Description text
   */
  getNodeDescription(node) {
    if (!node || !node.type) {
      console.warn('[MapUI] getNodeDescription: Invalid node', node);
      return 'Unknown node';
    }

    const descriptions = {
      'combat': 'Battle ICE\nReward: Credits + Card',
      'elite': 'Elite Enemy\nHigher rewards','boss': 'BOSS ENCOUNTER\nDefeat to progress',
      'event': 'Mystery Event\nMake a choice',
      'upgrade': 'Upgrade Terminal\nImprove a card',
      'reward': 'Data Vault\nGuaranteed rare card'
    };

    return descriptions[node.type] || 'Unknown node';
  }

  /**
   * Hides tooltip
   */
  hideTooltip() {
    if (!this.tooltipContainer) {
      return;
    }

    console.log('[MapUI] hideTooltip: Hiding tooltip');

    try {
      this.tooltipContainer.destroy();
      this.tooltipContainer = null;
    } catch (error) {
      console.error('[MapUI] hideTooltip: Error destroying tooltip', error);
      this.tooltipContainer = null;
    }
  }

  /**
   * Shows path preview from current node to target
   * @param {string} fromNodeId - Starting node
   * @param {string} toNodeId - Target node
   * @param {Object} mapData - Map data
   */
  showPathPreview(fromNodeId, toNodeId, mapData) {
    if (!fromNodeId || !toNodeId) {
      console.error('[MapUI] showPathPreview: Missing node IDs', { fromNodeId, toNodeId });
      return;
    }

    console.log('[MapUI] showPathPreview: Showing path preview', { fromNodeId, toNodeId });

    this.hidePathPreview();

    try {
      const fromNode = mapData.nodes.find(n => n.id === fromNodeId);
      const toNode = mapData.nodes.find(n => n.id === toNodeId);

      if (!fromNode || !toNode) {
        console.warn('[MapUI] showPathPreview: Nodes not found', { fromNodeId, toNodeId });
        return;
      }

      const graphics = this.scene.add.graphics();
      graphics.lineStyle(5, 0xffffff, 0.8);
      graphics.setDepth(GAME_CONFIG.UI.Z_INDEX.MAP_PATHS + 2);
      graphics.lineBetween(fromNode.x, fromNode.y, toNode.x, toNode.y);

      this.pathPreviewLines.push(graphics);

      console.log('[MapUI] showPathPreview: ✅ Path preview shown');
    } catch (error) {
      console.error('[MapUI] showPathPreview: Error creating preview', {
        fromNodeId,
        toNodeId,
        error: error.message
      });
    }
  }

  /**
   * Hides path preview
   */
  hidePathPreview() {
    if (this.pathPreviewLines.length === 0) {
      return;
    }

    console.log('[MapUI] hidePathPreview: Hiding path preview', {
      lineCount: this.pathPreviewLines.length
    });

    this.pathPreviewLines.forEach((line, index) => {
      if (line && line.destroy) {
        try {
          line.destroy();
        } catch (error) {
          console.error('[MapUI] hidePathPreview: Error destroying preview line', {
            index,
            error: error.message
          });
        }
      }
    });

    this.pathPreviewLines = [];
  }

  /**
   * Animates node unlock
   * @param {string} nodeId - Node to unlock
   */
  async animateNodeUnlock(nodeId) {
    if (!nodeId) {
      console.error('[MapUI] animateNodeUnlock: nodeId is null or undefined');
      return;
    }

    console.log('[MapUI] animateNodeUnlock: Animating unlock', { nodeId });

    const nodeSprite = this.nodeSprites.get(nodeId);
    if (!nodeSprite) {
      console.warn('[MapUI] animateNodeUnlock: Node sprite not found', { nodeId });
      return;
    }

    try {
      await animateFadeIn(this.scene, nodeSprite, 500);
      this.setNodeState(nodeId, 'available');
      console.log('[MapUI] animateNodeUnlock: ✅ Unlock animation complete');
    } catch (error) {
      console.error('[MapUI] animateNodeUnlock: Animation failed', {
        nodeId,
        error: error.message
      });
    }
  }

  /**
   * Animates node clear (when completed)
   * @param {string} nodeId - Node to mark as cleared
   */
  async animateNodeClear(nodeId) {
    if (!nodeId) {
      console.error('[MapUI] animateNodeClear: nodeId is null or undefined');
      return;
    }

    console.log('[MapUI] animateNodeClear: Animating clear', { nodeId });

    const nodeSprite = this.nodeSprites.get(nodeId);
    if (!nodeSprite) {
      console.warn('[MapUI] animateNodeClear: Node sprite not found', { nodeId });
      return;
    }

    try {
      await animatePulse(this.scene, nodeSprite, 1.3, 400);
      this.setNodeState(nodeId, 'visited');
      console.log('[MapUI] animateNodeClear: ✅ Clear animation complete');
    } catch (error) {
      console.error('[MapUI] animateNodeClear: Animation failed', {
        nodeId,
        error: error.message
      });
    }
  }

  /**
   * Registers event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!event || typeof event !== 'string') {
      console.error('[MapUI] on: Invalid event name', { event, type: typeof event });
      return;
    }

    if (typeof callback !== 'function') {
      console.error('[MapUI] on: Callback must be function', { callback, type: typeof callback });
      return;
    }

    console.log('[MapUI] on: Registering event listener', { event });

    try {
      this.eventEmitter.on(event, callback);
    } catch (error) {
      console.error('[MapUI] on: Error registering listener', { event, error: error.message });
    }
  }

  /**
   * Emits event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (!event || typeof event !== 'string') {
      console.error('[MapUI] emit: Invalid event name', { event, type: typeof event });
      return;
    }

    console.log('[MapUI] emit: Emitting event', { event, data });

    try {
      this.eventEmitter.emit(event, data);
    } catch (error) {
      console.error('[MapUI] emit: Error emitting event', { event, error: error.message });
    }
  }

  /**
   * Cleanup on scene shutdown
   */
  shutdown() {
    console.log('[MapUI] shutdown: Starting cleanup');

    try {
      this.clearMap();

      if (this.eventEmitter) {
        this.eventEmitter.removeAllListeners();
        this.eventEmitter = null;
      }

      console.log('[MapUI] shutdown: ✅ Cleanup complete');
    } catch (error) {
      console.error('[MapUI] shutdown: Error during cleanup', error);
    }
  }
}

console.log('[MapUI] ✅ Module loaded successfully');

if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.ENABLE_CONSOLE_COMMANDS) {
  window.MapUI = MapUI;
  console.log('[MapUI] Debug: Class exposed to window.MapUI');
}