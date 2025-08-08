import { Creature } from '../models/Creature';
import { setAudioMode } from '../sound/soundsys';
import { Drop } from '../models/Drop';
import { Trap } from '../models/Trap';
import { Effect } from '../models/Effect';
import { Ability } from '../models/Ability';
import type Game from '../game';

import { Animations } from '../animations';
import { GameLog } from '../utility/gamelog';
import { HexGrid } from '../utility/hexgrid';
import { Player, PlayerColor, PlayerID } from '../models/Player';
import { UI } from '../ui/interface';
import MatchI from '../multiplayer/match';
import Gameplay from '../multiplayer/gameplay';
import { DEBUG_DISABLE_GAME_STATUS_CONSOLE_LOG, DEBUG_DISABLE_MUSIC } from '../debug';
import { Point, configure as configurePointFacade } from '../utility/pointfacade';
import { pretty as version } from '../utility/version';
import { CreatureType, Realm, UnitData } from '../data/types';

type CreatureHintType = 'msg_effects' | 'damage' | string;

export class PlayerManager {
    game: Game;
    abilities: Array<Partial<Ability>[]> = [];
    traps: Trap[] = [];
    drops: Drop[] = [];
	effects: Effect[];
    activeCreature: Creature | undefined;
    matchid: number;
    playersReady: boolean;
    preventSetup: boolean;
    animations: Animations;
    queue: any;
    creatureData: any[] = [];
    pause: boolean;
    gameState: 'initialized' | 'loading' | 'loaded' | 'playing' | 'ended';
    pauseTime: number;
    unitDrops: number;
    minimumTurnBeforeFleeing: number;
    availableCreatures: CreatureType[] = [];
    animationQueue: any[] = [];
    checkTimeFrequency: number = 1000;
    gamelog: GameLog;
    configData: object;
    match: MatchI | object;
    gameplay: Gameplay;
    session: any = null;
    client: any = null;
    connect: any = null;
    multiplayer: boolean;
    matchInitialized: boolean;
    realms: Realm[] = [];
    availableMusic: any[] = [];
    inputMethod: string = 'Mouse';
    firstKill: boolean;
    freezedInput: boolean;
    turnThrottle: boolean;
    turn: number;
    Phaser: any;
    msg: any;
    triggers: Record<string, RegExp>;
    signals: any;
    players: Player[] = [];
    UI: UI;
    grid: HexGrid;
    trapId: number;
    effectId: number;
    dropId: number;
    startMatchTime: Date;    $combatFrame: HTMLElement | null;
    timeInterval: any;
    windowResizeTimeout: any;
    musicPlayer: any;
    scene: any;creatures: Creature[] = [];
    timePool?: number;
	turnTimePool?: number;
    playerMode: number = 2;

    constructor(game: Game) {
        this.game = game;
        this.players = [];
        this.creatures = [];
        this.traps = [];
        this.drops = [];
    }

    get activePlayer() {
        if (this.multiplayer) {
            if (this.players && this.match instanceof MatchI && this.match.userTurn) {
                return this.players[this.match.userTurn];
            }
            return undefined;
        }
        if (this.activeCreature && this.activeCreature.player) {
            return this.activeCreature.player;
        }
        return undefined;
    }    setup(playerMode: number) {
        this.playerMode = playerMode;
        // Phaser 3: Use scene and scale manager
        const scene = this.scene; // Assume PlayerManager is constructed with a reference to the scene
        const scale = scene.scale;

        // Set up background
        const bg = scene.add.sprite(0, 0, 'background').setOrigin(0, 0);
        bg.setInteractive();
        bg.on('pointerup', (pointer) => {
            if (this.freezedInput || this.UI.dashopen) return;
            switch (pointer.button) {
                case 0:
                    // Left mouse button pressed
                    break;
                case 1:
                    // Middle mouse button pressed
                    break;
                case 2:
                    // Right mouse button pressed
                    if (this.activeCreature) {
                        this.UI.showCreature(this.activeCreature.type, this.activeCreature.player.id, "grid");
                    }
                    break;
            }
        });

        // Reset global counters
        this.trapId = 0;
        this.effectId = 0;
        this.dropId = 0;

        // Use the game's grid (should already exist)
        this.grid = this.game.grid;
        configurePointFacade({
            getCreatures: () => this.creatures,
            getCreaturePassablePoints: (creature) => [],
            getCreatureBlockedPoints: (creature) => {
                if (creature.dead || creature.temp) {
                    return [];
                } else {
                    const ps = [];
                    for (let i = 0; i < creature.size; i++) {
                        ps.push({ x: creature.x - i, y: creature.y });
                    }
                    return ps;
                }
            },
            getTraps: () => this.traps,
            getTrapPassablePoints: (trap: Trap) => [trap],
            getTrapBlockedPoints: (trap) => [],
            getDrops: () => this.drops,
            getDropPassablePoints: (drop) => [drop],
            getDropBlockedPoints: (drop) => [],
        });

        this.startMatchTime = new Date();
        
        // UI setup
        this.$combatFrame = document.getElementById('combatframe');
        if (this.$combatFrame) {
            this.$combatFrame.style.display = 'block';
        }
        const matchMakingElement = document.getElementById('matchMaking');
        if (matchMakingElement) {
            matchMakingElement.style.display = 'none';
        }
        
        this.initPlayers(playerMode);
        this.activeCreature = this.players[0].creatures[0]; // Prevent errors

        this.initUI();        
        setAudioMode('full', this.game.soundsys, this.UI);
        this.gameState = 'playing';

        this.game.gameManager.log(`Welcome to Mythos Tactica ${version}`);
        this.game.gameManager.log('Setting up a ' + playerMode + ' player match');

        this.timeInterval = setInterval(() => {
            this.checkTime();
        }, this.checkTimeFrequency);

        this.game.gameManager.nextCreature();
        this.game.gameManager.resizeCombatFrame();
        this.UI.resizeDash();

        // Phaser 3: Use scale manager for resize events
        scale.on('resize', () => {
            this.game.gameManager.resizeCombatFrame();
            this.UI.resizeDash();
        });

        this.game.soundsys.playMusic();
        if (DEBUG_DISABLE_MUSIC) {
            this.musicPlayer.audio.pause();
        }

        this.game.gameManager.matchInit();
    }

    initPlayers(playerMode: number) {
        for (let i = 0; i < playerMode; i++) {
            const player = new Player(i as PlayerID, this.game);
            this.players.push(player);
            let pos: Point;
            if (playerMode > 2) {
                switch (player.id) {
                    case 0: pos = { x: 0, y: 1 }; break;
                    case 1: pos = { x: 15, y: 1 }; break;
                    case 2: pos = { x: 0, y: 7 }; break;
                    case 3: pos = { x: 15, y: 7 }; break;
                }
            } else {
                switch (player.id) {
                    case 0: pos = { x: 0, y: 4 }; break;
                    case 1: pos = { x: 14, y: 4 }; break;
                }
            }
            player.summon('--', pos);
        }
    }    initUI() {
        const self = this;
        this.UI = new UI(
            {
                get isAcceptingInput() {
                    return !self.freezedInput;
                },
            },
            this.game,
            this.game.soundsys,
        );
        
        // Connect GameManager to the same UI instance
        this.game.gameManager.UI = this.UI;
        
        // Also set the UI on the Game instance so that G.UI is available globally
        this.game.UI = this.UI;
    }

    startTimer() {
		clearInterval(this.timeInterval);

		const totalTime = new Date().valueOf();
		this.activeCreature.player.startTime = new Date(totalTime - this.pauseTime);
		this.checkTime();

		this.timeInterval = setInterval(() => {
			this.checkTime();
		}, this.checkTimeFrequency);
	}

	stopTimer() {
		clearInterval(this.timeInterval);
	}

	checkTime() {
		const date = new Date().valueOf() - this.pauseTime,
			p = this.activeCreature.player,
			alertTime = 5, // In seconds
			totalPlayers = this.playerMode;

		let msgStyle: CreatureHintType = 'msg_effects';

		p.totalTimePool = Math.max(p.totalTimePool, 0); // Clamp

		// Check all timepools
		// Check is always true for infinite time
		let playerStillHaveTime = this.timePool > 0 ? false : true;
		for (let i = 0; i < totalPlayers; i++) {
			// Each player
			playerStillHaveTime = this.players[i].totalTimePool > 0 || playerStillHaveTime;
		}

		// Check Match Time
		if (!playerStillHaveTime) {
			this.endGame();
			return;
		}

		this.UI.updateTimer();

		const startTime = p.startTime.valueOf();

		// Turn time and timepool not infinite
		if (this.timePool > 0 && this.turnTimePool > 0) {
			if (
				(date - startTime) / 1000 > this.turnTimePool ||
				p.totalTimePool - (date - startTime) < 0
			) {
				if (p.totalTimePool - (date - startTime) < 0) {
					p.deactivate(); // Only if timepool is empty
				}

				this.skipTurn();
				return;
			} else {
				if ((p.totalTimePool - (date - startTime)) / 1000 < alertTime) {
					msgStyle = 'damage';
				}

				if (this.turnTimePool - (date - startTime) / 1000 < alertTime && this.UI.dashopen) {
					// Alert
					this.UI.btnToggleDash.changeState('glowing');
					this.activeCreature.hint(
						// Math.ceil(this.turnTimePool - (date - p.startTime) / 1000),
						Math.ceil(this.turnTimePool - (date - startTime) / 1000).toString(),
						msgStyle = 'msg_effects',
					);
				}
			}
		} else if (this.turnTimePool > 0) {
			// Turn time is not infinite
			if ((date - startTime) / 1000 > this.turnTimePool) {
				this.skipTurn();
				return;
			} else {
				if (this.turnTimePool - (date - startTime) / 1000 < alertTime && this.UI.dashopen) {
					// Alert
					this.UI.btnToggleDash.changeState('glowing');
					this.activeCreature.hint(
						Math.ceil(this.turnTimePool - (date - startTime) / 1000).toString(),
						msgStyle = 'msg_effects',
					);
				}
			}
		} else if (this.timePool > 0) {
			// Timepool is not infinite
			if (p.totalTimePool - (date - startTime) < 0) {
				p.deactivate();
				this.skipTurn();
				return;
			} else {
				if (p.totalTimePool - (date - startTime) < alertTime) {
					msgStyle = 'damage';
				}

				if (this.turnTimePool - (date - startTime) / 1000 < alertTime && this.UI.dashopen) {
					// Alert
					this.UI.btnToggleDash.changeState('glowing');
					this.activeCreature.hint(
						Math.ceil(this.turnTimePool - (date - startTime) / 1000).toString(),
						msgStyle = 'msg_effects',
					);
				}
			}
		}
	}    resizeCombatFrame() {
        const cardWrapper = document.getElementById('cardwrapper');
        const card = document.getElementById('card');
        const cardWrapperInner = document.getElementById('cardwrapper_inner');
        
        if (cardWrapper && card && cardWrapperInner) {
            if (cardWrapper.offsetWidth < card.offsetWidth) {
                cardWrapperInner.style.width = cardWrapper.offsetWidth + 'px';
            }        }
    }

    // Delegate methods to GameManager
    skipTurn() {
        if (this.game.gameManager) {
            this.game.gameManager.skipTurn();
        }
    }

    endGame() {
        if (this.game.gameManager) {
            this.game.gameManager.endGame();
        }
    }

    // TODO: Implement or delegate log, checkTime, nextCreature, resizeCombatFrame, matchInit, etc. to this.game or as needed.
}
