import Game from '../game';

export class EffectManager {
    game: Game;
    triggers: Record<string, RegExp>;

    constructor(game: Game) {
        this.game = game;
        this.triggers = game.triggers;
    }

    get effects() {
        return this.game.effects || [];
    }

    get turn() {
        return this.game.turn || 0;
    }

    triggerEffect(trigger, arg, retValue?) {
        const [triggeredCreature, required] = arg;

        // For triggered creature
        triggeredCreature.effects.forEach((effect) => {
            if (triggeredCreature.dead === true) {
                return;
            }

            if (this.triggers[trigger].test(effect.trigger)) {
                retValue = effect.activate(required);
            }
        });

        // For other creatures
        this.game.creatureManager.creatures.forEach((creature) => {
            if (creature) {
                if (triggeredCreature === creature || creature.dead === true) {
                    return;
                }

                creature.effects.forEach((effect) => {
                    if (this.triggers[trigger + '_other'].test(effect.trigger)) {
                        retValue = effect.activate(required);
                    }
                });
            }
        });

        return retValue;
    }    triggerDeleteEffect(trigger, creature) {
        if (!creature) {
            console.warn('[DEBUG] triggerDeleteEffect called with undefined creature');
            return;
        }
        const effects = creature == 'all' ? this.effects : creature.effects;
        if (!effects) {
            console.warn('[DEBUG] triggerDeleteEffect called on creature without effects array');
            return;
        }
        let totalEffects = effects.length;

        for (let i = 0; i < totalEffects; i++) {
            const effect = effects[i];

            if (
                effect.turnLifetime > 0 &&
                trigger === effect.deleteTrigger &&
                this.turn - effect.creationTurn >= effect.turnLifetime
            ) {
                effect.deleteEffect();
                // Updates UI in case effect changes it
                if (effect.target) {
                    effect.target.updateHealth();
                }

                i--;
                totalEffects--;
            }
        }
    }
}
