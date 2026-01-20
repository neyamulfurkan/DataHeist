/**
 * MapGenerator.js
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
 * ✓ Console logs use [MapGenerator] prefix
 * ✓ File length is within ±20% of estimate
 * 
 * Purpose: Procedural generation of node-based network maps with seeded determinism
 * Dependencies: config.js, MathUtils.js, iceDefinitions.js, eventDefinitions.js
 * Used by: MapScene.js, SaveSystem.js
 */

import { GAME_CONFIG } from '../config.js';
import { seededRandom, shuffle, pickRandom, clamp } from '../utils/MathUtils.js';
import { ICE_LIBRARY, ICE_BY_TIER, BOSSES, ELITE_ICE } from '../data/iceDefinitions.js';
import { EVENT_LIBRARY, EVENTS_BY_TIER, getRandomEvent } from '../data/eventDefinitions.js';

console.log('[MapGenerator] Loading map generation system...');

export class MapGenerator {
  constructor() {
    this.rng = null;
    this.nodeCounter = 0;
    
    if (GAME_CONFIG.DEBUG_MODE) {
      console.log('[MapGenerator] Constructor initialized');
    }
  }

  generateMap(actNumber, seed = Date.now()) {
    console.log('[MapGenerator] generateMap: Starting generation for act', actNumber, 'with seed', seed);
    
    if (typeof actNumber !== 'number' || actNumber < 1 || actNumber > 3) {
      console.error('[MapGenerator] generateMap: Invalid actNumber, must be 1-3, got', actNumber);
      actNumber = 1;
    }
    
    if (typeof seed !== 'number' && typeof seed !== 'string') {
      console.error('[MapGenerator] generateMap: Invalid seed type, got', typeof seed);
      seed = Date.now();
    }
    
    const numericSeed = typeof seed === 'string' ? this.hashString(seed) : seed;
    this.rng = seededRandom(numericSeed);
    this.nodeCounter = 0;
    
    console.log('[MapGenerator] generateMap: Using numeric seed', numericSeed);
    
    const rowPattern = [1, 3, 4, 4, 3, 1];
    const totalRows = rowPattern.length;
    
    console.log('[MapGenerator] generateMap: Creating node grid with pattern', rowPattern);
    const grid = this.createNodeGrid(totalRows, rowPattern);
    
    if (!grid || grid.length === 0) {
      console.error('[MapGenerator] generateMap: Failed to create node grid');
      throw new Error('Node grid creation failed');
    }
    
    console.log('[MapGenerator] generateMap: Assigning node types for act', actNumber);
    this.assignNodeTypes(grid, actNumber);
    
    console.log('[MapGenerator] generateMap: Connecting nodes');
    this.connectNodes(grid);
    
    console.log('[MapGenerator] generateMap: Validating connections');
    const isValid = this.validateConnections(grid);
    
    if (!isValid) {
      console.error('[MapGenerator] generateMap: Connection validation failed, regenerating connections');
      this.connectNodes(grid);
      
      if (!this.validateConnections(grid)) {
        console.error('[MapGenerator] generateMap: CRITICAL - Second validation failed');
        throw new Error('Map generation failed validation twice');
      }
    }
    
    const mapWidth = GAME_CONFIG.PHASER.WIDTH;
    const mapHeight = GAME_CONFIG.PHASER.HEIGHT;
    
    console.log('[MapGenerator] generateMap: Calculating node positions for canvas', mapWidth, 'x', mapHeight);
    this.calculateNodePositions(grid, mapWidth, mapHeight);
    
    console.log('[MapGenerator] generateMap: Assigning node-specific data');
    const flatNodes = grid.flat().filter(node => node !== null);
    
    flatNodes.forEach(node => {
      this.assignNodeData(node, actNumber);
    });
    
    const startNode = grid[0][0];
    startNode.available = true;
    startNode.visited = false;
    startNode.cleared = false;
    
    const map = {
      seed: numericSeed,
      actNumber: actNumber,
      nodes: flatNodes,
      currentNodeId: startNode.id,
      grid: grid,
      totalNodes: flatNodes.length
    };
    
    console.log('[MapGenerator] generateMap: ✅ Map generation complete', {
      totalNodes: map.totalNodes,
      actNumber: map.actNumber,
      seed: map.seed,
      startNodeId: map.currentNodeId
    });
    
    return map;
  }

  createNodeGrid(rows, nodesPerRow) {
    console.log('[MapGenerator] createNodeGrid: Creating grid with', rows, 'rows, pattern', nodesPerRow);
    
    if (!Array.isArray(nodesPerRow)) {
      console.error('[MapGenerator] createNodeGrid: nodesPerRow must be array, got', typeof nodesPerRow);
      return [];
    }
    
    if (nodesPerRow.length !== rows) {
      console.error('[MapGenerator] createNodeGrid: Mismatch - rows:', rows, 'pattern length:', nodesPerRow.length);
      return [];
    }
    
    const grid = [];
    
    for (let row = 0; row < rows; row++) {
      const nodesInThisRow = nodesPerRow[row];
      
      if (typeof nodesInThisRow !== 'number' || nodesInThisRow < 1) {
        console.error('[MapGenerator] createNodeGrid: Invalid node count at row', row, 'got', nodesInThisRow);
        continue;
      }
      
      const rowArray = [];
      
      for (let index = 0; index < nodesInThisRow; index++) {
        const nodeId = `node_${String(this.nodeCounter).padStart(3, '0')}`;
        this.nodeCounter++;
        
        const node = {
          id: nodeId,
          type: null,
          row: row,
          index: index,
          x: 0,
          y: 0,
          connections: [],
          visited: false,
          cleared: false,
          available: false,
          data: {}
        };
        
        rowArray.push(node);
      }
      
      grid.push(rowArray);
      
      if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
        console.log('[MapGenerator] createNodeGrid: Created row', row, 'with', nodesInThisRow, 'nodes');
      }
    }
    
    console.log('[MapGenerator] createNodeGrid: Grid created with', grid.length, 'rows, total nodes:', this.nodeCounter);
    
    return grid;
  }

  assignNodeTypes(grid, actNumber) {
    console.log('[MapGenerator] assignNodeTypes: Assigning types for act', actNumber);
    
    if (!Array.isArray(grid) || grid.length === 0) {
      console.error('[MapGenerator] assignNodeTypes: Invalid grid');
      return;
    }
    
    grid[0][0].type = 'combat';
    console.log('[MapGenerator] assignNodeTypes: Start node set to combat');
    
    const lastRowIndex = grid.length - 1;
    if (grid[lastRowIndex] && grid[lastRowIndex].length > 0) {
      grid[lastRowIndex][0].type = 'boss';
      console.log('[MapGenerator] assignNodeTypes: Boss node set at row', lastRowIndex);
    } else {
      console.error('[MapGenerator] assignNodeTypes: No nodes in last row for boss');
    }
    
    const middleNodes = [];
    for (let row = 1; row < grid.length - 1; row++) {
      if (!grid[row]) continue;
      
      for (let index = 0; index < grid[row].length; index++) {
        middleNodes.push(grid[row][index]);
      }
    }
    
    console.log('[MapGenerator] assignNodeTypes: Middle nodes to assign:', middleNodes.length);
    
    const typeDistribution = {
      combat: GAME_CONFIG.MAP.COMBAT_NODE_RATIO,
      elite: GAME_CONFIG.MAP.ELITE_NODE_RATIO,
      event: GAME_CONFIG.MAP.EVENT_NODE_RATIO,
      upgrade: GAME_CONFIG.MAP.UPGRADE_NODE_RATIO,
      reward: GAME_CONFIG.MAP.REWARD_NODE_RATIO
    };
    
    const typeCounts = {
      combat: Math.floor(middleNodes.length * typeDistribution.combat),
      elite: Math.floor(middleNodes.length * typeDistribution.elite),
      event: Math.floor(middleNodes.length * typeDistribution.event),
      upgrade: Math.floor(middleNodes.length * typeDistribution.upgrade),
      reward: Math.floor(middleNodes.length * typeDistribution.reward)
    };
    
    const totalAssigned = Object.values(typeCounts).reduce((sum, count) => sum + count, 0);
    const remainder = middleNodes.length - totalAssigned;
    
    if (remainder > 0) {
      console.log('[MapGenerator] assignNodeTypes: Distributing', remainder, 'remainder nodes as combat');
      typeCounts.combat += remainder;
    }
    
    console.log('[MapGenerator] assignNodeTypes: Type distribution', typeCounts);
    
    const typePool = [];
    for (const [type, count] of Object.entries(typeCounts)) {
      for (let i = 0; i < count; i++) {
        typePool.push(type);
      }
    }
    
    const shuffledTypes = [];
    while (typePool.length > 0) {
      const randomIndex = Math.floor(this.rng() * typePool.length);
      shuffledTypes.push(typePool.splice(randomIndex, 1)[0]);
    }
    
    console.log('[MapGenerator] assignNodeTypes: Shuffled type pool length', shuffledTypes.length);
    
    for (let i = 0; i < middleNodes.length && i < shuffledTypes.length; i++) {
      const node = middleNodes[i];
      const proposedType = shuffledTypes[i];
      
      if (proposedType === 'elite') {
        if (node.row < 3) {
          console.log('[MapGenerator] assignNodeTypes: Elite in early row', node.row, 'converting to combat');
          node.type = 'combat';
          continue;
        }
        
        const adjacentElite = this.hasAdjacentElite(node, grid);
        if (adjacentElite) {
          console.log('[MapGenerator] assignNodeTypes: Adjacent elite detected, converting to combat');
          node.type = 'combat';
          continue;
        }
      }
      
      node.type = proposedType;
    }
    
    const finalCounts = { combat: 0, elite: 0, event: 0, upgrade: 0, reward: 0, boss: 0 };
    grid.flat().filter(n => n !== null).forEach(node => {
      if (node.type && finalCounts.hasOwnProperty(node.type)) {
        finalCounts[node.type]++;
      }
    });
    
    console.log('[MapGenerator] assignNodeTypes: ✅ Final type distribution', finalCounts);
  }

  hasAdjacentElite(node, grid) {
    if (!node || !grid || !grid[node.row]) {
      return false;
    }
    
    const row = grid[node.row];
    
    for (let i = 0; i < row.length; i++) {
      if (i === node.index) continue;
      
      if (row[i] && row[i].type === 'elite') {
        return true;
      }
    }
    
    return false;
  }

    connectNodes(grid) {
    console.log('[MapGenerator] connectNodes: Creating connections between rows');
    
    if (!Array.isArray(grid) || grid.length < 2) {
      console.error('[MapGenerator] connectNodes: Invalid grid, need at least 2 rows');
      return;
    }
    
    let totalConnections = 0;
    
    for (let row = 0; row < grid.length - 1; row++) {
      const currentRow = grid[row];
      const nextRow = grid[row + 1];
      
      if (!currentRow || !nextRow || currentRow.length === 0 || nextRow.length === 0) {
        console.error('[MapGenerator] connectNodes: Invalid row data at row', row);
        continue;
      }
      
      const nextRowConnectionCounts = new Array(nextRow.length).fill(0);
      
      for (let i = 0; i < currentRow.length; i++) {
        const currentNode = currentRow[i];
        if (!currentNode) continue;
        
        // CRITICAL FIX: Smart connection logic based on proximity
        // Connect to 1-2 nearest nodes in next row to minimize line crossing
        const connectionCount = Math.floor(this.rng() * 2) + 1;
        
        // CRITICAL FIX: Calculate proximity-based targets
        const targetsWithDistance = nextRow.map((targetNode, index) => {
          if (!targetNode) return null;
          
          // Estimate distance based on index difference (will be refined after positioning)
          const indexDistance = Math.abs(i - index);
          return { node: targetNode, index: index, distance: indexDistance };
        }).filter(t => t !== null);
        
        // Sort by proximity (closest first)
        targetsWithDistance.sort((a, b) => a.distance - b.distance);
        
        // Select closest 2-3 targets with slight randomness
        const candidateCount = Math.min(3, targetsWithDistance.length);
        const candidates = targetsWithDistance.slice(0, candidateCount);
        
        // Shuffle candidates and pick connectionCount
        const shuffledCandidates = [];
        while (candidates.length > 0) {
          const randomIndex = Math.floor(this.rng() * candidates.length);
          shuffledCandidates.push(candidates.splice(randomIndex, 1)[0]);
        }
        
        const actualConnectionCount = Math.min(connectionCount, shuffledCandidates.length);
        
        for (let k = 0; k < actualConnectionCount; k++) {
          const target = shuffledCandidates[k];
          
          if (!currentNode.connections.includes(target.node.id)) {
            currentNode.connections.push(target.node.id);
            nextRowConnectionCounts[target.index]++;
            totalConnections++;
          }
        }
      }
      
      // Ensure every node in next row has at least one incoming connection
      for (let j = 0; j < nextRow.length; j++) {
        if (nextRowConnectionCounts[j] === 0) {
          console.warn('[MapGenerator] connectNodes: Node', nextRow[j].id, 'has no incoming connections, fixing');
          
          // CRITICAL FIX: Connect to nearest node in previous row
          let nearestNodeIndex = 0;
          let minDistance = Math.abs(0 - j);
          
          for (let i = 0; i < currentRow.length; i++) {
            const distance = Math.abs(i - j);
            if (distance < minDistance) {
              minDistance = distance;
              nearestNodeIndex = i;
            }
          }
          
          const sourceNode = currentRow[nearestNodeIndex];
          
          if (sourceNode && !sourceNode.connections.includes(nextRow[j].id)) {
            sourceNode.connections.push(nextRow[j].id);
            totalConnections++;
            console.log('[MapGenerator] connectNodes: Added connection from', sourceNode.id, 'to', nextRow[j].id);
          }
        }
      }
      
      if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
        console.log('[MapGenerator] connectNodes: Row', row, 'connected to row', row + 1);
      }
    }
    
    console.log('[MapGenerator] connectNodes: ✅ Created', totalConnections, 'total connections');
  }

  validateConnections(grid) {
    console.log('[MapGenerator] validateConnections: Validating all nodes are reachable');
    
    if (!Array.isArray(grid) || grid.length === 0 || !grid[0] || grid[0].length === 0) {
      console.error('[MapGenerator] validateConnections: Invalid grid structure');
      return false;
    }
    
    const allNodes = grid.flat().filter(node => node !== null);
    const nodeMap = {};
    allNodes.forEach(node => {
      nodeMap[node.id] = node;
    });
    
    const startNode = grid[0][0];
    if (!startNode) {
      console.error('[MapGenerator] validateConnections: No start node found');
      return false;
    }
    
    const visited = new Set();
    const queue = [startNode.id];
    visited.add(startNode.id);
    
    while (queue.length > 0) {
      const currentId = queue.shift();
      const currentNode = nodeMap[currentId];
      
      if (!currentNode) {
        console.error('[MapGenerator] validateConnections: Node not found in map', currentId);
        continue;
      }
      
      if (!Array.isArray(currentNode.connections)) {
        console.error('[MapGenerator] validateConnections: Invalid connections for node', currentId);
        continue;
      }
      
      for (const connectedId of currentNode.connections) {
        if (!visited.has(connectedId)) {
          visited.add(connectedId);
          queue.push(connectedId);
        }
      }
    }
    
    const reachableCount = visited.size;
    const totalCount = allNodes.length;
    
    console.log('[MapGenerator] validateConnections: Reachable nodes:', reachableCount, '/', totalCount);
    
    if (reachableCount < totalCount) {
      console.error('[MapGenerator] validateConnections: ❌ Some nodes are unreachable');
      
      const unreachableNodes = allNodes.filter(node => !visited.has(node.id));
      console.error('[MapGenerator] validateConnections: Unreachable nodes:', unreachableNodes.map(n => n.id));
      
      return false;
    }
    
    console.log('[MapGenerator] validateConnections: ✅ All nodes are reachable');
    return true;
  }

  calculateNodePositions(grid, mapWidth, mapHeight) {
    console.log('[MapGenerator] calculateNodePositions: Calculating positions for', mapWidth, 'x', mapHeight);
    
    if (!Array.isArray(grid) || grid.length === 0) {
      console.error('[MapGenerator] calculateNodePositions: Invalid grid');
      return;
    }
    
    const horizontalSpacing = GAME_CONFIG.MAP.NODE_HORIZONTAL_SPACING;
    const verticalSpacing = GAME_CONFIG.MAP.NODE_VERTICAL_SPACING;
    const randomOffset = GAME_CONFIG.MAP.NODE_RANDOM_OFFSET;
    
    const padding = 100;
    const usableWidth = mapWidth - (padding * 2);
    const usableHeight = mapHeight - (padding * 2);
    
    const rowCount = grid.length;
    const verticalStep = rowCount > 1 ? usableHeight / (rowCount - 1) : 0;
    
    // CRITICAL FIX: Find maximum nodes in any row to establish column grid
    const maxNodesInRow = Math.max(...grid.map(row => row ? row.length : 0));
    const columnWidth = usableWidth / maxNodesInRow;
    
    console.log('[MapGenerator] calculateNodePositions: Grid structure', {
      maxColumns: maxNodesInRow,
      columnWidth: columnWidth,
      verticalStep: verticalStep
    });
    
    for (let row = 0; row < grid.length; row++) {
      const nodes = grid[row];
      
      if (!nodes || nodes.length === 0) {
        console.warn('[MapGenerator] calculateNodePositions: Empty row at index', row);
        continue;
      }
      
      const nodeCount = nodes.length;
      const baseY = padding + (row * verticalStep);
      
      // CRITICAL FIX: Distribute nodes evenly across available columns
      // This creates a flow-based layout where nodes align vertically
      const columnIndices = this.distributeNodesAcrossColumns(nodeCount, maxNodesInRow);
      
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (!node) continue;
        
        // CRITICAL FIX: Position based on column index, not linear spacing
        const columnIndex = columnIndices[i];
        const baseX = padding + ((columnIndex + 0.5) * columnWidth);
        
        // Apply subtle random offset for organic feel (±30px max)
        const offsetX = (this.rng() - 0.5) * randomOffset * 2;
        const offsetY = (this.rng() - 0.5) * randomOffset * 2;
        
        node.x = Math.round(baseX + offsetX);
        node.y = Math.round(baseY + offsetY);
        
        if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
          console.log('[MapGenerator] calculateNodePositions: Node', node.id, 'positioned at', node.x, node.y, 'column', columnIndex);
        }
      }
    }
    
    console.log('[MapGenerator] calculateNodePositions: ✅ All node positions calculated');
  }

  distributeNodesAcrossColumns(nodeCount, maxColumns) {
    console.log('[MapGenerator] distributeNodesAcrossColumns:', { nodeCount, maxColumns });
    
    // Distribute nodes evenly across grid columns
    // Creates visual alignment and minimal line crossing
    
    if (nodeCount === 1) {
      // Single node: center position
      const centerColumn = (maxColumns - 1) / 2;
      console.log('[MapGenerator] Single node at column:', centerColumn);
      return [centerColumn];
    }
    
    if (nodeCount === maxColumns) {
      // Full row: one node per column
      const columns = Array.from({ length: nodeCount }, (_, i) => i);
      console.log('[MapGenerator] Full row columns:', columns);
      return columns;
    }
    
    // Partial row: spread evenly across available columns
    // Use actual column indices (0, 1, 2, 3) not fractional positions
    const columnIndices = [];
    
    if (nodeCount === 2) {
      // Special case: 2 nodes in maxColumns
      // Place at 1/3 and 2/3 positions
      const leftCol = Math.floor(maxColumns / 3);
      const rightCol = Math.floor((maxColumns * 2) / 3);
      columnIndices.push(leftCol, rightCol);
    } else {
      // General case: distribute across span
      const span = maxColumns - 1;
      const step = span / (nodeCount - 1);
      
      for (let i = 0; i < nodeCount; i++) {
        const columnIndex = Math.round(i * step);
        columnIndices.push(columnIndex);
      }
    }
    
    console.log('[MapGenerator] Distributed columns:', columnIndices);
    return columnIndices;
  }

  assignNodeData(node, actNumber) {
    if (!node || !node.type) {
      console.error('[MapGenerator] assignNodeData: Invalid node');
      return;
    }
    
    // CRITICAL FIX: Store node row for progressive difficulty scaling
    node.data.nodeRow = node.row;
    node.data.totalRows = 6; // Total rows in act
    
    switch (node.type) {
      case 'combat':
        const enemyPool = this.getEnemyPoolForNode('normal', actNumber);
        if (!enemyPool || enemyPool.length === 0) {
          console.error('[MapGenerator] assignNodeData: No enemies available for combat node', node.id);
          node.data.enemyId = 'ice_guardian';
        } else {
          // CRITICAL FIX: Assign single enemy ID, not pool
          const randomIndex = Math.floor(this.rng() * enemyPool.length);
          node.data.enemyId = enemyPool[randomIndex];
        }
        // CRITICAL: Mark as regular combat for scaling
        node.data.isElite = false;
        break;
        
      case 'elite':
        const elitePool = this.getEnemyPoolForNode('elite', actNumber);
        if (!elitePool || elitePool.length === 0) {
          console.error('[MapGenerator] assignNodeData: No elite enemies available for node', node.id);
          node.data.enemyId = 'ice_adaptive';
        } else {
          // CRITICAL FIX: Assign single enemy ID, not pool
          const randomIndex = Math.floor(this.rng() * elitePool.length);
          node.data.enemyId = elitePool[randomIndex];
        }
        // CRITICAL FIX: Mark elite nodes for extra scaling
        node.data.isElite = true;
        break;
        
      case 'boss':
        const bossId = this.getBossForAct(actNumber);
        if (!bossId) {
          console.error('[MapGenerator] assignNodeData: No boss found for act', actNumber);
          node.data.bossId = 'ice_firewall_boss';
        } else {
          node.data.bossId = bossId;
        }
        break;
        
      case 'event':
        const eventId = this.getEventForNode(actNumber);
        if (!eventId) {
          console.error('[MapGenerator] assignNodeData: No event found for act', actNumber);
          node.data.eventId = 'event_database';
        } else {
          node.data.eventId = eventId;
        }
        break;
        
      case 'upgrade':
        node.data.upgradeType = 'card';
        break;
        
      case 'reward':
        node.data.rewardType = 'card';
        break;
        
      default:
        console.warn('[MapGenerator] assignNodeData: Unknown node type', node.type);
    }
    
    if (GAME_CONFIG.DEBUG_MODE && GAME_CONFIG.LOG_VERBOSE) {
      console.log('[MapGenerator] assignNodeData: Assigned data to', node.id, node.type, node.data);
    }
  }

  getEnemyPoolForNode(nodeType, actNumber) {
    const validAct = clamp(actNumber, 1, 3);
    
    console.log('[MapGenerator] getEnemyPoolForNode: Selecting enemy pool', {
      nodeType,
      actNumber: validAct
    });
    
    // ELITE NODES: Use dedicated elite enemy pool
    if (nodeType === 'elite') {
      const tierKey = `tier${validAct}`;
      const elitePool = ELITE_ICE[tierKey] || [];
      
      if (elitePool.length === 0) {
        console.error('[MapGenerator] getEnemyPoolForNode: No elite enemies for', tierKey);
        return ['ice_guardian'];
      }
      
      console.log('[MapGenerator] getEnemyPoolForNode: Elite pool for act', validAct, ':', elitePool);
      return elitePool;
    }
    
    // REGULAR COMBAT NODES: Use tier-appropriate enemies
    const tierKey = `tier${validAct}`;
    const tierEnemies = ICE_BY_TIER[tierKey] || [];
    
    if (tierEnemies.length === 0) {
      console.error('[MapGenerator] getEnemyPoolForNode: No enemies for tier', tierKey);
      return ['ice_guardian'];
    }
    
    // Return enemy IDs only
    const enemyIds = tierEnemies.map(ice => ice.id);
    
    console.log('[MapGenerator] getEnemyPoolForNode: Combat pool for act', validAct, ':', enemyIds);
    return enemyIds;
  }

  getBossForAct(actNumber) {
    const validAct = clamp(actNumber, 1, 3);
    
    if (!BOSSES || BOSSES.length === 0) {
      console.error('[MapGenerator] getBossForAct: No bosses defined');
      return 'ice_firewall_boss';
    }
    
    const bossIndex = validAct - 1;
    const boss = BOSSES[bossIndex];
    
    if (!boss) {
      console.error('[MapGenerator] getBossForAct: No boss at index', bossIndex);
      return BOSSES[0].id;
    }
    
    return boss.id;
  }

  getEventForNode(actNumber) {
    const validAct = clamp(actNumber, 1, 3);
    
    const event = getRandomEvent(validAct);
    
    if (!event) {
      console.error('[MapGenerator] getEventForNode: No event found for act', validAct);
      return 'event_database';
    }
    
    return event.id;
  }

  hashString(str) {
    let hash = 0;
    if (!str || str.length === 0) return hash;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash);
  }
}

const mapGenerator = new MapGenerator();

export function generateMap(actNumber, seed) {
  console.log('[MapGenerator] generateMap: Standalone function called with act', actNumber, 'seed', seed);
  
  try {
    return mapGenerator.generateMap(actNumber, seed);
  } catch (error) {
    console.error('[MapGenerator] generateMap: CRITICAL ERROR during generation', error);
    console.error('[MapGenerator] generateMap: Error stack:', error.stack);
    throw error;
  }
}

console.log('[MapGenerator] ✅ Module loaded successfully');
console.log('[MapGenerator] Singleton instance ready, export functions available');

export default mapGenerator;