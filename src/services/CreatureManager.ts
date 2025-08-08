import { Creature } from '../models/Creature';
import { CreatureType, Unit } from '../data/types';
import Game from '../game';
import { getUrl } from '../assets';
import { UI } from '../ui/interface';
import { PlayerColor } from '../models/Player';

// Mutable version of Unit for internal use
type MutableUnit = Omit<Unit, 'type'> & { type?: CreatureType };

export class CreatureManager {
    creatures: Creature[] = [];
    creatureData: MutableUnit[] = [];
    game: Game;
    UI: UI;

    constructor(game: Game) {
        this.game = game;
        this.creatures = [];
    }
    
    findCreature(o) {
        const ret: Creature[] = [],
            o2 = Object.assign(
                {
                    team: -1, // No team
                    type: '--', // Dark Priest
                },
                o,
            ),
            creatures = this.creatures,
            totalCreatures = creatures.length;

        let creature: Creature, match: boolean, wrongTeam: boolean;

        for (let i = 0; i < totalCreatures; i++) {
            creature = creatures[i];
            if (creature) {
                match = true;
                for (const key in o2) {
                    const val = o2[key];
                    if (key == 'team') {
                        if (val == -1) continue;
                        if (Array.isArray(val)) {
                            wrongTeam = true;
                            if (val.indexOf(creature[key]) != -1) {
                                wrongTeam = false;
                            }
                            if (wrongTeam) {
                                match = false;
                            }
                            continue;
                        }
                    }
                    if (creature[key] != val) {
                        match = false;
                    }
                }
                if (match) {
                    ret.push(creature);
                }
            }
        }
        return ret;
    }

    retrieveCreatureStats(type: CreatureType) {
        const totalCreatures = this.creatureData.length;
        for (let i = totalCreatures - 1; i >= 0; i--) {
            if (
                this.creatureData[i].type == type ||
                this.creatureData[i].realm + this.creatureData[i].level == type
            ) {                if (!this.creatureData[i].type) {
                    this.creatureData[i].type = (this.creatureData[i].realm + this.creatureData[i].level) as CreatureType;
                }
                return this.creatureData[i];
            }
        }
    }

    loadUnitData(data: Unit[]) {
        const dpcolor: PlayerColor[] = ['blue', 'orange', 'green', 'red'];
        this.creatureData = data.map(unit => ({ ...unit })); // Create mutable copies
        data.forEach((creature, index) => {
            if (!creature.playable) {
                return;
            }
            const creatureId = creature.id,
                realm = creature.realm,
                level = creature.level,
                type = (realm.toUpperCase() + level) as CreatureType,
                name = creature.name;
            let count: number, i: number;
            
            // Set type on the mutable copy
            this.creatureData[index].type = type;
            
            this.game.soundsys.loadSound('units/shouts/' + name);
            this.game.gameManager.getImage(getUrl('units/artwork/' + name));
            if (name == 'Dark Priest') {
                for (i = 0, count = dpcolor.length; i < count; i++) {
                    this.game.gameManager.getImage(getUrl('units/avatars/' + name + ' ' + dpcolor[i]));
                }
            } else {
                this.game.gameManager.getImage(getUrl('units/avatars/' + name));
            }              // Add creature type to available creatures array if not already present
            if (!this.game.availableCreatures.includes(type)) {
                this.game.availableCreatures.push(type);                console.log(`[DEBUG] Added creature type: ${type} to availableCreatures`);
            }
        });
        
        console.log(`[DEBUG] Total available creatures loaded: ${this.game.availableCreatures.length}`);
        console.log(`[DEBUG] Available creatures: `, this.game.availableCreatures);
        
        // Update all existing players' available creatures
        if (this.game.playerManager && this.game.playerManager.players) {
            this.game.playerManager.players.forEach((player, index) => {
                player.availableCreatures = [...this.game.availableCreatures];
                console.log(`[DEBUG] Updated player ${index} availableCreatures: ${player.availableCreatures.length} creatures`);
            });
        }
    }

    handleTrigger(triggerName: string, creature: any) {
        // Get the trigger pattern from the game's triggers
        const triggerPattern = this.game.triggers[triggerName];
        if (!triggerPattern) {
            console.warn(`[CreatureManager] Unknown trigger: ${triggerName}`);
            return;
        }

        // Process trigger for all creatures
        this.creatures.forEach((c) => {
            if (c && c.abilities && !c.dead) {
                c.abilities.forEach((ability) => {
                    if (ability && triggerPattern.test(ability.getTrigger())) {
                        if (ability.require(creature)) {
                            ability.activate(creature);
                        }
                    }
                });
            }
        });
    }    triggerAbility(trigger, arg, retValue?) {
		const [triggeredCreature, required] = arg;

		// Add null check for triggeredCreature itself before accessing properties
		if (!triggeredCreature) {
			console.warn('[WARNING] triggerAbility called with undefined triggeredCreature');
			return retValue;
		}

		// For triggered creature
		// Add null check to handle cases where abilities might be undefined
		if (triggeredCreature.abilities && Array.isArray(triggeredCreature.abilities)) {
			triggeredCreature.abilities.forEach((ability) => {
				if (triggeredCreature.dead === true) {
					return;
				}

				if (this.game.triggers[trigger].test(ability.getTrigger())) {
					if (ability.require(required)) {
						retValue = ability.animation(required);
					}
				}
			});
		} else {
			// If abilities are undefined, try to reinitialize them
			console.warn(`[WARNING] Creature ${triggeredCreature.id} has undefined abilities, attempting to reinitialize...`);
			this.game.reinitializeCreatureAbilities();
		}
		// For other creatures
		this.creatures.forEach((creature) => {
			if (triggeredCreature === creature || creature.dead === true) {
				return;
			}

			// Add null check for creature abilities as well
			if (creature.abilities && Array.isArray(creature.abilities)) {
				creature.abilities.forEach((ability) => {
					if (this.game.triggers[trigger + '_other'].test(ability.getTrigger())) {
						if (ability.require(required)) {
							retValue = ability.animation(required, triggeredCreature);
						}
					}
				});
			}
		});

		return retValue;
	}
}
