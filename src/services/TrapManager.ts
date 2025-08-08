import Game from '../game';

export class TrapManager {
    game: Game;
    triggers: Record<string, RegExp>;
    traps: any[] = []; // Array to store all traps

    constructor(game: Game) {
        this.game = game;
        this.triggers = game.triggers;
    }

    triggerTrap(trigger, arg) {
        const [triggeredCreature] = arg;
        triggeredCreature.hexagons.forEach((hex) => {
            hex.activateTrap(this.triggers[trigger], triggeredCreature);
        });
    }

    onStepIn(creature, hex, opts) {
        this.game.creatureManager.triggerAbility('onStepIn', arguments);
        this.game.effectManager.triggerEffect('onStepIn', arguments);
        if (!opts || !opts.ignoreTraps) {
            this.triggerTrap('onStepIn', arguments);
        }
    }

    onStepOut(/* creature, hex, callback */) {
        this.game.creatureManager.triggerAbility('onStepOut', arguments);
        this.game.effectManager.triggerEffect('onStepOut', arguments);
        this.triggerTrap('onStepOut', arguments);
    }

    onReset(creature) {
        this.game.effectManager.triggerDeleteEffect('onReset', creature);
        this.game.creatureManager.triggerAbility('onReset', arguments);
        this.game.effectManager.triggerEffect('onReset', [creature, creature]);
    }
}