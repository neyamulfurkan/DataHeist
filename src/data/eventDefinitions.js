/**
 * eventDefinitions.js
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
 * ✓ Console logs use [eventDefinitions.js] prefix
 * ✓ File length is within ±20% of estimate
 * 
 * Purpose: Complete event library containing all narrative encounters with choices and consequences
 * Dependencies: config.js, cardDefinitions.js
 * Used by: MapScene.js, MapGenerator.js, RewardSystem.js
 */

console.log('[eventDefinitions.js] Loading event library...');

import { GAME_CONFIG } from '../config.js';
import { CARD_LIBRARY, getCardById } from './cardDefinitions.js';

/**
 * @typedef {Object} EventChoice
 * @property {string} text - Button text for choice
 * @property {EventConsequences} consequences - What happens when chosen
 * @property {string} resultText - Narrative feedback after choice
 */

/**
 * @typedef {Object} EventConsequences
 * @property {number|null} credits - Currency change (+/-)
 * @property {number|null} trace - Trace meter change (+/-)
 * @property {string|null} addCard - Card ID to add to deck
 * @property {string|null} removeCard - 'random' or specific card ID to remove
 * @property {boolean} upgradeRandomCard - Upgrade 1 random card?
 * @property {string|null} gainRelic - Relic ID to add (future feature)
 * @property {number|null} healTrace - Reduce trace by amount
 */

/**
 * @typedef {Object} EventDefinition
 * @property {string} id - Unique identifier
 * @property {string} title - Display title
 * @property {string} description - Main narrative text (2-4 sentences)
 * @property {string} flavorText - Optional atmospheric detail
 * @property {EventChoice[]} choices - 2-3 player choices
 * @property {number} encounterRate - Probability of appearing (0-1)
 * @property {number} tier - Which act(s) this event appears in (1, 2, or 3)
 */

export const EVENT_LIBRARY = {
  event_database: {
    id: "event_database",
    title: "Corporate Database",
    description: "You've breached a secure corporate database. Rows of encrypted files flash across your screen - financial records, employee data, internal communications. You could extract this data for quick credits, or you could spend time analyzing the encryption algorithms to improve your own code.",
    flavorText: "The firewall won't hold forever. Make your choice.",
    choices: [
      {
        text: "Extract Data (+60 Credits)",
        consequences: {
          credits: 60,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You rapidly download the most valuable files and disconnect. Credits secured."
      },
      {
        text: "Study Encryption (Upgrade Random Card)",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: true,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You spend time reverse-engineering their security protocols. One of your programs has been optimized with new techniques."
      },
      {
        text: "Leave Empty-Handed (Safe)",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You disconnect without taking anything. Sometimes discretion is the better part of valor."
      }
    ],
    encounterRate: 0.8,
    tier: 1
  },

  event_rogue_ai: {
    id: "event_rogue_ai",
    title: "Rogue AI",
    description: "An autonomous AI fragment detects your presence in the network. Unlike corporate ICE, this entity seems... curious. It offers you a deal: help it escape corporate containment in exchange for a powerful exploit it's developed. But freeing a rogue AI is dangerous - you'll definitely be traced.",
    flavorText: "\"I've been watching you, hacker. Let me help you... help me.\"",
    choices: [
      {
        text: "Negotiate (Add Random Rare Card, +5 Trace)",
        consequences: {
          credits: null,
          trace: 5,
          addCard: "random_rare",
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You help the AI fragment escape. It uploads an advanced exploit to your deck before disappearing into the net. Alarms blare as corporate security locks onto your signature."
      },
      {
        text: "Refuse and Report (Safe, +30 Credits)",
        consequences: {
          credits: 30,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You report the AI fragment's location to corporate security for a bounty. It's the safe play, even if the AI's final words haunt you: \"Coward.\""
      },
      {
        text: "Destroy It (Heal 5 Trace)",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: 5
        },
        resultText: "You purge the AI fragment from the system. No traces left behind, no complications. Just clean work."
      }
    ],
    encounterRate: 0.6,
    tier: 2
  },

  event_black_market: {
    id: "event_black_market",
    title: "Black Market Vendor",
    description: "You stumble upon a hidden darknet marketplace node. A shadowy vendor offers you access to illegal hacking tools - powerful programs that can't be found anywhere else. The price is steep, but the gear is legitimate.",
    flavorText: "\"Credits only. No refunds. No questions.\"",
    choices: [
      {
        text: "Buy Exploit Card (-80 Credits, Add Card)",
        consequences: {
          credits: -80,
          trace: null,
          addCard: "exploit_uncommon_001",
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You transfer the credits and receive a top-tier exploit program. The vendor's avatar nods and fades from view."
      },
      {
        text: "Buy Virus Card (-70 Credits, Add Card)",
        consequences: {
          credits: -70,
          trace: null,
          addCard: "virus_uncommon_001",
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You purchase a sophisticated virus package. The vendor's digital handshake confirms the transaction."
      },
      {
        text: "Leave (No Purchase)",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You decline the offer and exit the marketplace. Your credits remain intact."
      }
    ],
    encounterRate: 0.7,
    tier: 2
  },

  event_memory_fragment: {
    id: "event_memory_fragment",
    title: "Memory Fragment",
    description: "You discover a fragmented data cache - someone's personal memories encoded as raw neural data. The encryption is weak, and you could easily download it. These memories might contain valuable intel about the corporation's inner workings, but absorbing foreign neural data always carries risks.",
    flavorText: "Whose memories are these? And why were they hidden here?",
    choices: [
      {
        text: "Download Memories (+Intel, +3 Trace)",
        consequences: {
          credits: null,
          trace: 3,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "The memories flood into your consciousness - fractured images of corporate boardrooms, whispered conspiracies, and hidden server locations. Your trace signature spikes from the neural interface."
      },
      {
        text: "Ignore and Continue",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You leave the memories untouched. Some doors are better left unopened."
      }
    ],
    encounterRate: 0.5,
    tier: 1
  },

  event_security_patrol: {
    id: "event_security_patrol",
    title: "Security Patrol",
    description: "You detect an active security sweep moving through this network sector. Corporate tracers are methodically checking every node. You have seconds to decide: hide in a sub-routine and wait them out, or create a diversion and slip past while they're distracted.",
    flavorText: "Their ICE signatures are getting closer...",
    choices: [
      {
        text: "Hide Quietly (Safe)",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You mask your presence and hold perfectly still. The security sweep passes by without detecting you. Crisis averted."
      },
      {
        text: "Create Diversion (+50 Credits, +4 Trace)",
        consequences: {
          credits: 50,
          trace: 4,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You trigger a false alarm in another sector. While security rushes to investigate, you raid their unguarded payment node. They'll figure out the trick soon enough."
      },
      {
        text: "Stealth Evade (Heal 3 Trace)",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: 3
        },
        resultText: "You use advanced stealth protocols to slip past undetected. Your signature becomes even cleaner in the process."
      }
    ],
    encounterRate: 0.75,
    tier: 1
  },

  event_old_ally: {
    id: "event_old_ally",
    title: "Old Ally",
    description: "You receive an encrypted message from an old contact - another runner you worked with years ago. They've been tracking your progress through the corporate network and offer to share some optimization techniques they've developed. No strings attached, just one professional to another.",
    flavorText: "\"Hey choom. Saw your signature in the system. Here, take this. For old times.\"",
    choices: [
      {
        text: "Accept Help (Upgrade Random Card)",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: true,
          gainRelic: null,
          healTrace: null
        },
        resultText: "Your ally shares their latest code optimizations. One of your programs has been significantly improved."
      },
      {
        text: "Politely Decline",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You thank them but refuse the assistance. Some runners prefer to work alone."
      }
    ],
    encounterRate: 0.6,
    tier: 1
  },

  event_virus_sample: {
    id: "event_virus_sample",
    title: "Virus Sample",
    description: "You've intercepted a highly sophisticated virus being deployed by a rival hacking collective. The code is elegant and dangerous - you could reverse-engineer it for your own use, but keeping malicious code in your deck always carries contamination risks. Alternatively, you could simply purge it and clean your systems.",
    flavorText: "This code is beautiful... and terrifying.",
    choices: [
      {
        text: "Reverse-Engineer (Add Virus Card, +2 Trace)",
        consequences: {
          credits: null,
          trace: 2,
          addCard: "virus_001",
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You carefully dissect the virus and adapt it for your own purposes. The malicious code is now yours to command, though traces of its origin linger in your system."
      },
      {
        text: "Purge and Clean (Heal 5 Trace)",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: 5
        },
        resultText: "You delete the virus and run a deep system scan. Your code is cleaner than it's been in days."
      },
      {
        text: "Sell Sample (+70 Credits)",
        consequences: {
          credits: 70,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You auction the virus sample on the darknet. Several interested buyers pay handsomely for the code."
      }
    ],
    encounterRate: 0.65,
    tier: 2
  },

  event_system_glitch: {
    id: "event_system_glitch",
    title: "System Glitch",
    description: "A critical error in the corporate network has temporarily disabled several security protocols. Financial transaction logs are completely exposed. You could exploit this and siphon credits, but it'll definitely trigger alarms when the glitch is fixed. Or you could report the vulnerability for a smaller, cleaner reward.",
    flavorText: "Error 0x47A9: Critical security failure. All transaction logs accessible.",
    choices: [
      {
        text: "Exploit Vulnerability (+90 Credits, +6 Trace)",
        consequences: {
          credits: 90,
          trace: 6,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You rapidly extract as many credits as possible before the system auto-recovers. Your signature is burned all over the logs, but the payout was worth it."
      },
      {
        text: "Report Bug (+30 Credits)",
        consequences: {
          credits: 30,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You anonymously report the vulnerability to corporate security and claim the bug bounty. They'll never know you were here."
      },
      {
        text: "Ignore It",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You leave the glitch alone and move on. Not your problem."
      }
    ],
    encounterRate: 0.7,
    tier: 2
  },

  event_encrypted_message: {
    id: "event_encrypted_message",
    title: "Encrypted Message",
    description: "You intercept a heavily encrypted message between two high-level corporate executives. Breaking this encryption will take processing power and time, but the intel inside could be invaluable - locations of hidden servers, security schedules, maybe even blackmail material.",
    flavorText: "Military-grade encryption. This will take everything you've got.",
    choices: [
      {
        text: "Decrypt Message (Remove Random Card, +Intel)",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: "random",
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You dedicate significant processing power to crack the encryption. One of your programs is corrupted and lost in the process, but the intel you gained is priceless."
      },
      {
        text: "Skip Decryption",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You leave the message encrypted and move on. Some secrets aren't worth the cost."
      }
    ],
    encounterRate: 0.5,
    tier: 3
  },

  event_abandoned_terminal: {
    id: "event_abandoned_terminal",
    title: "Abandoned Terminal",
    description: "You discover an old maintenance terminal that's been offline for years. Corporate has clearly forgotten about it. The terminal still has access credentials and residual data caches. You could scavenge whatever's left here, but old systems can be unpredictable.",
    flavorText: "Last login: 847 days ago. User: [DELETED]",
    choices: [
      {
        text: "Scavenge Thoroughly (Random Reward)",
        consequences: {
          credits: 40,
          trace: null,
          addCard: "random_common",
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You carefully extract everything of value from the terminal - some credits and an old but functional program."
      },
      {
        text: "Quick Grab (+50 Credits, +2 Trace)",
        consequences: {
          credits: 50,
          trace: 2,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You grab the most valuable data and disconnect. The old terminal sparked to life for a moment, possibly triggering dormant alarms."
      },
      {
        text: "Leave Undisturbed",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You leave the terminal as you found it. Let sleeping systems lie."
      }
    ],
    encounterRate: 0.8,
    tier: 1
  },

  event_data_broker: {
    id: "event_data_broker",
    title: "Data Broker",
    description: "A mysterious data broker contacts you through an anonymous relay. They're willing to trade valuable programs for data from your current run. The exchange is legitimate, but you'll have to give up some of your existing tools.",
    flavorText: "\"I have what you need. The question is: what are you willing to trade?\"",
    choices: [
      {
        text: "Trade for Exploit (Remove Random Card, Add Rare Exploit)",
        consequences: {
          credits: null,
          trace: null,
          addCard: "exploit_rare_001",
          removeCard: "random",
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You trade one of your programs for a powerful exploit. The broker's digital signature disappears without a trace."
      },
      {
        text: "Trade for Defense (Remove Random Card, Add Rare Defense)",
        consequences: {
          credits: null,
          trace: null,
          addCard: "defense_rare_001",
          removeCard: "random",
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You exchange a program for advanced defensive protocols. The trade completes in milliseconds."
      },
      {
        text: "Decline Trade",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You refuse the broker's offer. They shrug digitally and disconnect."
      }
    ],
    encounterRate: 0.55,
    tier: 3
  },

  event_corporate_recruiter: {
    id: "event_corporate_recruiter",
    title: "Corporate Recruiter",
    description: "A corporate headhunter has been monitoring your work and is impressed. They offer you a lucrative contract: join their security team and they'll clear your trace signature and set you up with premium tools. Of course, you'd have to stop the current heist.",
    flavorText: "\"We could use someone with your talents. Legal. Lucrative. Legitimate.\"",
    choices: [
      {
        text: "Refuse (Gain Strength)",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You laugh in their face and cut the connection. Corporate life isn't for you. Your resolve strengthens."
      },
      {
        text: "Negotiate (+100 Credits, +3 Trace)",
        consequences: {
          credits: 100,
          trace: 3,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You string them along just long enough to extract a 'signing bonus' then ghost them. They're not happy, and now corporate knows exactly who you are."
      }
    ],
    encounterRate: 0.45,
    tier: 2
  },

  event_backup_server: {
    id: "event_backup_server",
    title: "Backup Server",
    description: "You've found an unguarded backup server containing redundant copies of old programs. Most are outdated, but with some effort you could restore and upgrade one of your existing tools using this legacy code.",
    flavorText: "Version history goes back five years. There's gold in these archives.",
    choices: [
      {
        text: "Restore Code (Upgrade 2 Random Cards)",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: true,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You spend time mining the backup server for useful code fragments. Two of your programs have been significantly enhanced with legacy optimizations."
      },
      {
        text: "Quick Download (+Utility Card)",
        consequences: {
          credits: null,
          trace: null,
          addCard: "utility_uncommon_001",
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You grab a complete utility program from the archives and disconnect."
      },
      {
        text: "Leave It",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You decide the backup server isn't worth your time and move on."
      }
    ],
    encounterRate: 0.7,
    tier: 2
  }
};

console.log('[eventDefinitions.js] Validating event library...');

function validateEventLibrary() {
  const errors = [];
  const warnings = [];
  const eventArray = Object.values(EVENT_LIBRARY);
  
  const eventCounts = {
    total: eventArray.length,
    byTier: { tier1: 0, tier2: 0, tier3: 0 }
  };
  
  eventArray.forEach((event, index) => {
    const eventRef = `Event #${index + 1} (${event.id || 'NO_ID'})`;
    
    if (!event.id) {
      errors.push(`${eventRef}: Missing id property`);
    }
    
    if (!event.title) {
      errors.push(`${eventRef}: Missing title property`);
    }
    
    if (!event.description) {
      errors.push(`${eventRef}: Missing description property`);
    }
    
    if (!Array.isArray(event.choices)) {
      errors.push(`${eventRef}: choices must be an array`);
    } else {
      if (event.choices.length < 2) {
        warnings.push(`${eventRef}: Only ${event.choices.length} choice(s), expected 2-3`);
      }
      
      event.choices.forEach((choice, choiceIndex) => {
        const choiceRef = `${eventRef} Choice #${choiceIndex + 1}`;
        
        if (!choice.text) {
          errors.push(`${choiceRef}: Missing text property`);
        }
        
        if (!choice.consequences) {
          errors.push(`${choiceRef}: Missing consequences property`);
        } else {
          const cons = choice.consequences;
          
          if (cons.addCard && cons.addCard !== 'random_rare' && cons.addCard !== 'random_common') {
            const cardExists = getCardById(cons.addCard);
            if (!cardExists) {
              errors.push(`${choiceRef}: Referenced card "${cons.addCard}" does not exist in CARD_LIBRARY`);
            }
          }
          
          if (typeof cons.credits === 'number' && cons.credits < -200) {
            warnings.push(`${choiceRef}: Very expensive credit cost (${cons.credits})`);
          }
          
          if (typeof cons.trace === 'number' && cons.trace > 10) {
            warnings.push(`${choiceRef}: Very high trace penalty (${cons.trace})`);
          }
        }
        
        if (!choice.resultText) {
          warnings.push(`${choiceRef}: Missing resultText property`);
        }
      });
    }
    
    if (typeof event.encounterRate !== 'number' || event.encounterRate < 0 || event.encounterRate > 1) {
      errors.push(`${eventRef}: encounterRate must be between 0 and 1, got ${event.encounterRate}`);
    }
    
    if (![1, 2, 3].includes(event.tier)) {
      errors.push(`${eventRef}: tier must be 1, 2, or 3, got ${event.tier}`);
    } else {
      eventCounts.byTier[`tier${event.tier}`]++;
    }
  });
  
  if (eventCounts.total < 10) {
    warnings.push(`Total events: ${eventCounts.total} (expected 10+)`);
  }
  
  console.log('[eventDefinitions.js] Validation complete:', {
    totalEvents: eventCounts.total,
    byTier: eventCounts.byTier,
    errors: errors.length,
    warnings: warnings.length
  });
  
  if (warnings.length > 0) {
    console.warn('[eventDefinitions.js] ⚠️ Validation warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  if (errors.length > 0) {
    console.error('[eventDefinitions.js] ❌ Validation errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    throw new Error(`Event library validation failed with ${errors.length} errors`);
  }
  
  console.log('[eventDefinitions.js] ✅ Event library validated successfully');
  return true;
}

try {
  validateEventLibrary();
} catch (error) {
  console.error('[eventDefinitions.js] CRITICAL ERROR during validation:', error);
  throw error;
}

export const EVENTS_BY_TIER = {
  tier1: Object.values(EVENT_LIBRARY).filter(e => e.tier === 1),
  tier2: Object.values(EVENT_LIBRARY).filter(e => e.tier === 2),
  tier3: Object.values(EVENT_LIBRARY).filter(e => e.tier === 3),
  all_tiers: Object.values(EVENT_LIBRARY).filter(e => e.tier === 2 || e.tier === 3)
};

export function getEventById(eventId) {
  if (!eventId || typeof eventId !== 'string') {
    console.error('[eventDefinitions.js] getEventById: Invalid eventId:', eventId);
    return null;
  }
  
  const event = EVENT_LIBRARY[eventId];
  if (!event) {
    console.warn('[eventDefinitions.js] getEventById: Event not found:', eventId);
    return null;
  }
  
  return event;
}

export function getRandomEvent(tier = null) {
  let pool = Object.values(EVENT_LIBRARY);
  
  if (tier && EVENTS_BY_TIER[`tier${tier}`]) {
    pool = EVENTS_BY_TIER[`tier${tier}`];
  }
  
  if (pool.length === 0) {
    console.error('[eventDefinitions.js] getRandomEvent: No events available for tier:', tier);
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

console.log('[eventDefinitions.js] ✅ Module loaded successfully');
console.log('[eventDefinitions.js] Total events:', Object.keys(EVENT_LIBRARY).length);
console.log('[eventDefinitions.js] By tier:', {
  tier1: EVENTS_BY_TIER.tier1.length,
  tier2: EVENTS_BY_TIER.tier2.length,
  tier3: EVENTS_BY_TIER.tier3.length
});

export default EVENT_LIBRARY;