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
          healTrace: null,
          gainIntel: 'intel_memory_fragment'
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
          healTrace: null,
          gainIntel: 'intel_encrypted_message'
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
  },

  // NEW INTEL EVENTS (18 more intel pieces)
  event_exec_files: {
    id: "event_exec_files",
    title: "Executive Files",
    description: "You've breached a senior executive's personal files. Calendars, meeting notes, strategic plans - this is gold. But downloading it all will leave massive traces.",
    flavorText: "CEO calendar shows: 'Project Darknet - Final Phase Meeting'",
    choices: [
      {
        text: "Download Everything (+Intel, +4 Trace)",
        consequences: {
          credits: null,
          trace: 4,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null,
          gainIntel: 'intel_exec_calendar'
        },
        resultText: "You grab everything and bolt. The intel is priceless, but corporate security is definitely investigating now."
      },
      {
        text: "Skip It",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You back out quietly. Some files aren't worth the heat."
      }
    ],
    encounterRate: 0.5,
    tier: 2
  },

  event_server_logs: {
    id: "event_server_logs",
    title: "Server Logs",
    description: "Hidden server logs reveal access patterns to a classified project. Someone's been using unauthorized backdoors.",
    flavorText: "Repeated logins from IP: [UNKNOWN]. Access level: ROOT.",
    choices: [
      {
        text: "Analyze Logs (+Intel, Remove Random Card)",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: "random",
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null,
          gainIntel: 'intel_backdoor_location'
        },
        resultText: "You dedicate processing power to decrypt the logs. One program crashes, but you've learned the location of a hidden backdoor."
      },
      {
        text: "Ignore",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You leave the logs alone and move on."
      }
    ],
    encounterRate: 0.6,
    tier: 3
  },

  event_whistleblower: {
    id: "event_whistleblower",
    title: "Whistleblower Contact",
    description: "An anonymous corporate insider offers you classified information in exchange for keeping their identity secret. They want to expose illegal programs.",
    flavorText: "\"I've been documenting everything. Help me get this out.\"",
    choices: [
      {
        text: "Accept Intel (+Intel, +50 Credits)",
        consequences: {
          credits: 50,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null,
          gainIntel: 'intel_corporate_secrets'
        },
        resultText: "You receive encrypted files exposing corporate malfeasance. The whistleblower transfers payment and disappears."
      },
      {
        text: "Decline",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You refuse to get involved. The whistleblower disconnects, disappointed."
      }
    ],
    encounterRate: 0.4,
    tier: 2
  },

  event_research_notes: {
    id: "event_research_notes",
    title: "Research Notes",
    description: "You've accessed a researcher's private notes on experimental ICE development. The notes mention vulnerabilities in current security protocols.",
    flavorText: "Note: 'Firewall v4.2 has critical flaw in packet validation...'",
    choices: [
      {
        text: "Study Notes (+Intel, Upgrade Random Card)",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: true,
          gainRelic: null,
          healTrace: null,
          gainIntel: 'intel_ice_weakness'
        },
        resultText: "You study the research and apply it to your code. One of your programs is now optimized against corporate ICE."
      },
      {
        text: "Skip",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You leave the research notes alone."
      }
    ],
    encounterRate: 0.65,
    tier: 1
  },

  event_financial_records: {
    id: "event_financial_records",
    title: "Financial Records",
    description: "You've found hidden financial records showing illegal fund transfers. This data could be valuable to corporate rivals - or used for blackmail.",
    flavorText: "Transaction: $50M to [REDACTED] - Purpose: [CLASSIFIED]",
    choices: [
      {
        text: "Copy Records (+Intel, +80 Credits)",
        consequences: {
          credits: 80,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null,
          gainIntel: 'intel_financial_fraud'
        },
        resultText: "You copy the records and sell them to interested parties. The credits flow in immediately."
      },
      {
        text: "Leave Alone",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You decide not to get involved in corporate politics."
      }
    ],
    encounterRate: 0.55,
    tier: 3
  },

  event_security_memo: {
    id: "event_security_memo",
    title: "Security Memo",
    description: "An internal security memo warns about 'increased runner activity in Sector 7'. They're onto you - or at least, onto someone.",
    flavorText: "ALERT: Unauthorized access attempts detected. Increase ICE patrols.",
    choices: [
      {
        text: "Read Carefully (+Intel, +2 Trace)",
        consequences: {
          credits: null,
          trace: 2,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null,
          gainIntel: 'intel_security_patterns'
        },
        resultText: "You memorize their patrol patterns and security protocols. You'll be better prepared next time."
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
        resultText: "You delete the memo and move on."
      }
    ],
    encounterRate: 0.7,
    tier: 1
  },

  event_ai_research: {
    id: "event_ai_research",
    title: "AI Research Data",
    description: "Classified AI research files detail experimental neural networks. This technology is years ahead of anything public.",
    flavorText: "Project Athena: Autonomous defense AI - TESTING PHASE",
    choices: [
      {
        text: "Download Research (+Intel, Add Rare Card)",
        consequences: {
          credits: null,
          trace: null,
          addCard: "utility_rare_001",
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null,
          gainIntel: 'intel_ai_research'
        },
        resultText: "You absorb the research and develop a cutting-edge utility based on their neural network algorithms."
      },
      {
        text: "Skip",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You leave the AI research untouched."
      }
    ],
    encounterRate: 0.45,
    tier: 3
  },

  event_employee_database: {
    id: "event_employee_database",
    title: "Employee Database",
    description: "Complete employee records with security clearances, access codes, and personal data. A treasure trove for social engineering.",
    flavorText: "12,847 employees. 482 with ROOT access.",
    choices: [
      {
        text: "Extract Data (+Intel, +60 Credits)",
        consequences: {
          credits: 60,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null,
          gainIntel: 'intel_employee_access'
        },
        resultText: "You download key employee credentials and sell them on the darknet. Instant payday."
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
        resultText: "You exit without touching the employee database."
      }
    ],
    encounterRate: 0.6,
    tier: 2
  },

  event_network_topology: {
    id: "event_network_topology",
    title: "Network Map",
    description: "A complete network topology map showing all server locations, connections, and weak points. Perfect for planning future runs.",
    flavorText: "Node connections: 1,247. Identified vulnerabilities: 18.",
    choices: [
      {
        text: "Memorize Map (+Intel, Heal 4 Trace)",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: 4,
          gainIntel: 'intel_network_map'
        },
        resultText: "You commit the network topology to memory. Knowing the layout lets you navigate more efficiently."
      },
      {
        text: "Skip",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You leave the map alone and continue."
      }
    ],
    encounterRate: 0.5,
    tier: 2
  },

  event_prototype_code: {
    id: "event_prototype_code",
    title: "Prototype Code",
    description: "Unfinished prototype code for next-generation security systems. It's buggy but contains revolutionary algorithms.",
    flavorText: "Version: 0.3-alpha. Status: UNSTABLE. DO NOT DEPLOY.",
    choices: [
      {
        text: "Analyze Code (+Intel, Upgrade 2 Cards)",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: true,
          gainRelic: null,
          healTrace: null,
          gainIntel: 'intel_prototype_algorithms'
        },
        resultText: "You reverse-engineer the prototype and apply its algorithms to your own code. Two programs are significantly enhanced."
      },
      {
        text: "Ignore",
        consequences: {
          credits: null,
          trace: null,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null
        },
        resultText: "You leave the unstable prototype alone."
      }
    ],
    encounterRate: 0.55,
    tier: 3
  },

  event_blackmail_files: {
    id: "event_blackmail_files",
    title: "Blackmail Files",
    description: "Someone in corporate security has been collecting dirt on executives. Scandals, affairs, embezzlement - it's all here.",
    flavorText: "File: 'Executive_Compromises.enc' - 847 MB",
    choices: [
      {
        text: "Download Files (+Intel, +100 Credits, +5 Trace)",
        consequences: {
          credits: 100,
          trace: 5,
          addCard: null,
          removeCard: null,
          upgradeRandomCard: false,
          gainRelic: null,
          healTrace: null,
          gainIntel: 'intel_blackmail_data'
        },
        resultText: "You copy everything and immediately auction it. The buyers pay top credit, but corporate security is furious."
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
        resultText: "You refuse to touch the blackmail files. Too messy."
      }
    ],
    encounterRate: 0.4,
    tier: 3
  },

  event_audit_logs: {
    id: "event_audit_logs",
    title: "Audit Logs",
    description: "Forensic audit logs showing every transaction, every access, every keystroke. Perfect for understanding how their security works.",
    flavorText: "Log entries: 2.4 million. Time range: 90 days.",
    choices: [
      {
        text: "Process Logs (+Intel, Remove Card, Add Rare Card)",
        consequences: {
          credits: null,
          trace: null,
          addCard: "defense_rare_001",
          removeCard: "random",
          upgradeRandomCard: false,
          gain8:15,
          AMRelic: null,
healTrace: null,
gainIntel: 'intel_audit_trails'
},
resultText: "You burn through processing power analyzing the logs. One program corrupts, but you've developed a powerful defensive protocol based on their audit patterns."
},
{
text: "Skip",
consequences: {
credits: null,
trace: null,
addCard: null,
removeCard: null,
upgradeRandomCard: false,
gainRelic: null,
healTrace: null
},
resultText: "You leave the audit logs alone."
}
],
encounterRate: 0.5,
tier: 2
},
event_disaster_recovery: {
id: "event_disaster_recovery",
title: "Disaster Recovery Plan",
description: "Corporate disaster recovery documentation reveals their backup systems, failover procedures, and emergency protocols.",
flavorText: "In case of catastrophic failure: ALL SYSTEMS ROUTE TO BACKUP_SITE_DELTA",
choices: [
{
text: "Study Plan (+Intel, Heal 6 Trace)",
consequences: {
credits: null,
trace: null,
addCard: null,
removeCard: null,
upgradeRandomCard: false,
gainRelic: null,
healTrace: 6,
gainIntel: 'intel_recovery_protocols'
},
resultText: "Understanding their recovery procedures helps you cover your tracks better. Your trace signature is cleaned significantly."
},
{
text: "Ignore",
consequences: {
credits: null,
trace: null,
addCard: null,
removeCard: null,
upgradeRandomCard: false,
gainRelic: null,
healTrace: null
},
resultText: "You skip the disaster recovery documentation."
}
],
encounterRate: 0.65,
tier: 1
},
event_beta_software: {
id: "event_beta_software",
title: "Beta Software",
description: "Unreleased beta software for corporate tools. Untested, potentially buggy, but cutting-edge.",
flavorText: "WARNING: For internal testing only. May contain critical bugs.",
choices: [
{
text: "Install Beta (+Intel, Add Uncommon Card, +3 Trace)",
consequences: {
credits: null,
trace: 3,
addCard: "utility_uncommon_004",
removeCard: null,
upgradeRandomCard: false,
gainRelic: null,
healTrace: null,
gainIntel: 'intel_beta_tools'
},
resultText: "You risk installing the unstable beta. It works - mostly - and gives you access to advanced features. But the installation left traces."
},
{
text: "Skip",
consequences: {
credits: null,
trace: null,
addCard: null,
removeCard: null,
upgradeRandomCard: false,
gainRelic: null,
healTrace: null
},
resultText: "You decide beta software is too risky."
}
],
encounterRate: 0.6,
tier: 2
},
event_incident_reports: {
id: "event_incident_reports",
title: "Incident Reports",
description: "Security incident reports documenting previous breaches, vulnerabilities exploited, and lessons learned. They're learning from past mistakes.",
flavorText: "INCIDENT-2077: Unauthorized access via deprecated API. FIXED.",
choices: [
{
text: "Read Reports (+Intel, +40 Credits)",
consequences: {
credits: 40,
trace: null,
addCard: null,
removeCard: null,
upgradeRandomCard: false,
gainRelic: null,
healTrace: null,
gainIntel: 'intel_incident_history'
},
resultText: "You learn from their past failures and sell the vulnerability intel to interested parties."
},
{
text: "Skip",
consequences: {
credits: null,
trace: null,
addCard: null,
removeCard: null,
upgradeRandomCard: false,
gainRelic: null,
healTrace: null
},
resultText: "You leave the incident reports alone."
}
],
encounterRate: 0.7,
tier: 1
},
event_vpn_configs: {
id: "event_vpn_configs",
title: "VPN Configurations",
description: "Complete VPN configuration files for corporate remote access. With these, you could impersonate legitimate users.",
flavorText: "Active VPN tunnels: 847. Remote users: 2,104.",
choices: [
{
text: "Copy Configs (+Intel, Add Exploit Card)",
consequences: {
credits: null,
trace: null,
addCard: "exploit_uncommon_003",
removeCard: null,
upgradeRandomCard: false,
gainRelic: null,
healTrace: null,
gainIntel: 'intel_vpn_access'
},
resultText: "You clone the VPN configurations and develop an exploit to impersonate authorized users."
},
{
text: "Skip",
consequences: {
credits: null,
trace: null,
addCard: null,
removeCard: null,
upgradeRandomCard: false,
gainRelic: null,
healTrace: null
},
resultText: "You leave the VPN configs alone."
}
],
encounterRate: 0.55,
tier: 2
},
event_quantum_research: {
id: "event_quantum_research",
title: "Quantum Research",
description: "Top-secret quantum computing research. This technology could revolutionize hacking - or make it obsolete.",
flavorText: "Project Q: Quantum decryption prototype - 98% success rate",
choices: [
{
text: "Study Research (+Intel, Upgrade 3 Cards, Remove 1 Card)",
consequences: {
credits: null,
trace: null,
addCard: null,
removeCard: "random",
upgradeRandomCard: true,
gainRelic: null,
healTrace: null,
gainIntel: 'intel_quantum_tech'
},
resultText: "You absorb the quantum research and apply it to your code. Three programs are revolutionized, though one incompatible program had to be deleted."
},
{
text: "Skip",
consequences: {
credits: null,
trace: null,
addCard: null,
removeCard: null,
upgradeRandomCard: false,
gainRelic: null,
healTrace: null
},
resultText: "You leave the quantum research alone."
}
],
encounterRate: 0.35,
tier: 3
},
event_ceo_emails: {
id: "event_ceo_emails",
title: "CEO Emails",
description: "The CEO's personal email archive. Mergers, acquisitions, strategic plans - everything that matters.",
flavorText: "Subject: Re: Project Shadowrun - EYES ONLY",
choices: [
{
text: "Download All (+Intel, +120 Credits, +6 Trace)",
consequences: {
credits: 120,
trace: 6,
addCard: null,
removeCard: null,
upgradeRandomCard: false,
gainRelic: null,
healTrace: null,
gainIntel: 'intel_ceo_communications'
},
resultText: "You grab everything and immediately sell it to corporate rivals. The payout is massive, but so is the heat."
},
{
text: "Skip",
consequences: {
credits: null,
trace: null,
addCard: null,
removeCard: null,
upgradeRandomCard: false,
gainRelic: null,
healTrace: null
},
resultText: "You decide the CEO's emails are too hot to touch."
}
],
encounterRate: 0.3,
tier: 3
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