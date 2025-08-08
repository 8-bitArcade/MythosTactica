import { Damage } from '../damage';
import { Team } from '../utility/team';
import * as matrices from '../utility/matrices';
import * as arrayUtils from '../utility/arrayUtils';
import { Effect } from '../models/Effect';
import { Direction } from '../utility/hex';
import type Game from '../game';

/** Creates the abilities
 * @param G the game object  
 * @return void
 */
// Helper for Flat Frons damage logic
function vehemothDamageTarget(ability, target, G) {
	const shouldExecute = target.health <= ability._executeHealthThreshold && target.isFrozen();
	const damageType = shouldExecute
		? { pure: target.health }
		: { crush: ability.damages?.crush ?? 0, frost: ability.damages?.frost ?? 0 };
	const damage = new Damage(ability.creature, damageType, 1, [], G);
	let damageResult;

	if (shouldExecute) {
		G.UI.chat.suppressMessage(/is dead/i, 1);
		damageResult = target.takeDamage(damage);
		if (damageResult.kill) {
			G.gameManager.log(`%CreatureName${target.id}% has been shattered!`);
			target.hint('Shattered', 'damage');
		}
	} else {
		damageResult = target.takeDamage(damage);
	}
	return damageResult;
}

export default (G: Game) => {
	// @ts-ignore - Ability system uses dynamic properties not captured in Ability interface
	G.playerManager.abilities[6] = [
		// Lamellar Body: onCreatureSummon
		{
			trigger: 'onCreatureSummon',
			require: function (this: any) {
				if (this.creature.dead || this.creature.temp) return false;
				let buff = 0;
				G.playerManager.creatures.forEach((crea) => {
					if (crea.realm == 'S' && !crea.dead && !crea.temp) buff += 2;
				});
				if (buff == (this._buff ?? 0)) return false;
				this._buff = buff;
				return true;
			},
			activate: function (this: any) {
				this.creature.facePlayerDefault();
				const regrowBuff = this.isUpgraded() ? this._buff : 0;
				this.creature.replaceEffect(
					new Effect(
						'Lamellar Body',
						this.creature,
						this.creature,
						'',
						{
							alterations: {
								defense: this._buff,
								frost: this._buff,
								regrowth: regrowBuff,
							},
							stackable: false,
						},
						G,
					),
				);
			},
		},
		// Lamellar Body: onOtherCreatureSummon
		{
			trigger: 'onOtherCreatureSummon' as any,
			require: function (this: any) {
				if (this.creature.dead || this.creature.temp) return false;
				let buff = 0;
				G.playerManager.creatures.forEach((crea) => {
					if (crea.realm == 'S' && !crea.dead && !crea.temp) buff += 2;
				});
				if (buff == (this._buff ?? 0)) return false;
				this._buff = buff;
				return true;
			},
			activate: function (this: any) {
				this.creature.facePlayerDefault();
				const regrowBuff = this.isUpgraded() ? this._buff : 0;
				this.creature.replaceEffect(
					new Effect(
						'Lamellar Body',
						this.creature,
						this.creature,
						'',
						{
							alterations: {
								defense: this._buff,
								frost: this._buff,
								regrowth: regrowBuff,
							},
							stackable: false,
						},
						G,
					),
				);
			},
		},
		// Lamellar Body: onOtherCreatureDeath
		{
			trigger: 'onOtherCreatureDeath' as any,
			require: function (this: any) {
				if (this.creature.dead || this.creature.temp) return false;
				let buff = 0;
				G.playerManager.creatures.forEach((crea) => {
					if (crea.realm == 'S' && !crea.dead && !crea.temp) buff += 2;
				});
				if (buff == (this._buff ?? 0)) return false;
				this._buff = buff;
				return true;
			},
			activate: function (this: any) {
				this.creature.facePlayerDefault();
				const regrowBuff = this.isUpgraded() ? this._buff : 0;
				this.creature.replaceEffect(
					new Effect(
						'Lamellar Body',
						this.creature,
						this.creature,
						'',
						{
							alterations: {
								defense: this._buff,
								frost: this._buff,
								regrowth: regrowBuff,
							},
							stackable: false,
						},
						G,
					),
				);
			},
		},
		// Second Ability: Flat Frons
		{
			trigger: 'onQuery',
			_directions: [0, 1, 0, 0, 1, 0],
			_targetTeam: Team.Enemy,
			_executeHealthThreshold: 49,
			require: function (this: any) {
				if (!this.testRequirements()) return false;
				if (!this.atLeastOneTarget(this._getHexes(), { team: this._targetTeam })) {
					if (this.isUpgraded()) {
						if (!this.testDirection({
							team: this._targetTeam,
							directions: this._directions,
							distance: this.creature.remainingMove + 1,
							sourceCreature: this.creature,
						})) return false;
					} else return false;
				}
				return true;
			},
			query: function (this: any) {
				const ability = this;
				const vehemoth = this.creature;
				const object = {
					fnOnConfirm: function () { ability.animation(...arguments); },
					flipped: vehemoth.player.flipped,
					id: vehemoth.id,
					team: Team.Enemy,
					requireCreature: true,
					choices: [],
				};
				object.choices = this._getHexes().map((hex) => [hex]);
				if (this.isUpgraded()) {
					const directionObject = G.grid.getDirectionChoices({
						flipped: vehemoth.player.flipped,
						team: this._targetTeam,
						requireCreature: true,
						stopOnCreature: true,
						sourceCreature: vehemoth,
						id: vehemoth.id,
						x: vehemoth.x,
						y: vehemoth.y,
						directions: this._directions,
						distance: vehemoth.remainingMove + 1,
					});
					object.choices = object.choices.filter(
						(objectHexes) => !directionObject.choices.some((directionHexes) => objectHexes.every((v) => directionHexes.includes(v))),
					);
					object.choices = [...object.choices, ...directionObject.choices];
				}
				G.grid.queryChoice(object);
			},
			activate: function (path, args) {
				const ability = this;
				const vehemoth = ability.creature;
				G.cameraShake(0.02, 333, true, 'HORIZONTAL', true);
				ability.end();
				path = arrayUtils.sortByDirection(path, args.direction);
				const target = arrayUtils.last(path).creature;
				const targetIsNearby = this._getHexes().some((hex) => hex.creature?.id === target.id);
				if (targetIsNearby) {
					vehemothDamageTarget(ability, target, G);
				} else {
					arrayUtils.filterCreature(path, false, true, vehemoth.id);
					let destination = arrayUtils.last(path);
					const x = destination.x + (args.direction === 4 ? vehemoth.size - 1 : 0);
					destination = G.grid.hexes[destination.y][x];
					let knockbackHexes = G.grid.getHexLine(target.x, target.y, args.direction, vehemoth.player.flipped);
					arrayUtils.filterCreature(knockbackHexes, false, true, target.id);
					knockbackHexes = knockbackHexes.slice(0, path.length);
					vehemoth.moveTo(destination, {
						overrideSpeed: 100,
						callback: function () {
							let knockbackHex = arrayUtils.last(knockbackHexes);
							const damageResult = vehemothDamageTarget(ability, target, G);
							if (damageResult.kill) return;
							if (knockbackHex) {
								if (args.direction === Direction.Left) {
									knockbackHex = knockbackHex && G.grid.hexes[knockbackHex.y][knockbackHex.x + target.size - 1];
								}
								target.moveTo(knockbackHex, {
									callback: function () { G.playerManager.activeCreature.queryMove(); },
									ignoreMovementPoint: true,
									ignorePath: true,
									animation: 'push',
								});
							} else {
								G.playerManager.activeCreature.queryMove();
							}
						},
					});
				}
			},
			_getHexes() {
				return this.creature.getHexMap(matrices.frontnback3hex, false);
			},
		},

		/**
		 * Primary Ability: Flake Convertor
		 *
		 * Inline ranged attack on a fatigued enemy unit within 5 range. Deals damage
		 * equal to the positive Frost mastery difference between Vehemoth and the target,
		 * who also receives the "Frozen" status.
		 *
		 * When upgraded, the "Frozen" status becomes "Cryostasis" which is a special
		 * "Freeze" that is not broken when receiving damage.
		 *
		 * Targeting rules:
		 * - The target must be an enemy unit.
		 * - The target must have the "Fatigued" status (no remaining endurance).
		 * - The target must be inline (forwards or backwards) within 5 range.
		 * - The path to the target unit cannot be interrupted by any obstacles or units.
		 *
		 * Other rules:
		 * - Attacked unit receives the "Frozen" status, making them skip their next turn.
		 * - There is no cap to the damage dealt from the positive Frost mastery difference.
		 * - Attack damage will be 0 if the target has a higher Frost mastery than Vehemoth,
		 *   but the "Frozen"/"Cryostasis" effect will still be applied.
		 * - The upgraded "Cryostasis" effect does not break when receiving damage from
		 *   the Vehemoth or ANY other source.
		 */
		{
			trigger: 'onQuery',
			_targetTeam: Team.Enemy,
			_directions: [1, 1, 1, 1, 1, 1],
			require: function () {
				const distance = 5;
				if (!this.testRequirements()) return false;
				if (!this.testDirection({
					sourceCreature: this.creature,
					team: this._targetTeam,
					directions: this._directions,
					distance,
					optTest: this._confirmTarget,
				})) return false;
				return true;
			},
			query: function () {
				const ability = this;
				const vehemoth = this.creature;
				const distance = 5;
				G.grid.queryDirection({
					fnOnConfirm: function () { ability.animation(...arguments); },
					flipped: vehemoth.player.flipped,
					team: this._targetTeam,
					id: vehemoth.id,
					requireCreature: true,
					x: vehemoth.x,
					y: vehemoth.y,
					directions: this._directions,
					distance,
					optTest: this._confirmTarget,
				});
			},
			activate: function (path, args) {
				const ability = this;
				const vehemoth = this.creature;
				const target = arrayUtils.last(path).creature;
				ability.end();
				G.cameraShake(0.01, 50, true, 'HORIZONTAL', true);
				const [tween, sprite] = G.animations.projectile(
					this as any, // Cast to any: see note below
					target,
					'effects_freezing-spit',
					path,
					args,
					52,
					-20,
				);
				// NOTE: 'this' is a plain object, not an Ability instance, but only 'creature' is used by projectile.
				// This cast is a workaround until all abilities are refactored to use Ability instances.
				const frostMasteryDifference = Math.max(Number(vehemoth.stats.frost) - Number(target.stats.frost), 0);
				const damage = new Damage(
					ability.creature,
					{ frost: frostMasteryDifference },
					1,
					[],
					G,
				);
				if (
    tween &&
    typeof tween === 'object' &&
    'onComplete' in tween &&
    tween.onComplete &&
    typeof tween.onComplete.add === 'function'
) {
					tween.onComplete.add(function () {
						if (sprite && typeof sprite === 'object' && 'destroy' in sprite && typeof (sprite as any).destroy === 'function') {
							(sprite as any).destroy();
						}
						let damageResult;
						if (damage.damages.frost > 0) {
							damageResult = target.takeDamage(damage);
						}
						target.freeze(ability.isUpgraded());
						if (damageResult && !damageResult.kill) {
							G.gameManager.log(
								`%CreatureName${target.id}% ${ability.isUpgraded() ? 'enters Cryostasis' : 'has been Frozen'} and cannot act`
							);
							target.hint(ability.isUpgraded() ? 'Cryostasis' : 'Frozen', 'damage');
						}
					}, sprite);
				}
			},
			_confirmTarget(creature) {
				return creature.isFatigued();
			},
		},
		// Falling Arrow (Ultimate Ability)
		{
			trigger: 'onQuery',
			_directions: [0, 1, 0, 0, 1, 0],
			_targetTeam: Team.Enemy,
			require: function () {
				const vehemoth = this.creature;
				if (!this.testRequirements()) return false;
				if (!this.atLeastOneTarget(this._getHexes(), { team: this._targetTeam })) return false;
				return true;
			},
			query: function () {
				const ability = this;
				const vehemoth = this.creature;
				this.game.grid.queryCreature({
					fnOnConfirm: function () { ability.animation(...arguments); },
					team: this._targetTeam,
					id: vehemoth.id,
					flipped: vehemoth.player.flipped,
					hexes: this._getHexes(),
				});
			},
			activate: function (target) {
				const ability = this;
				const vehemoth = this.creature;
				ability.end();
				G.cameraShake(0.02, 123, true, 'VERTICAL', true);
				const levelDifference = Math.max(Number(vehemoth.level) - Number(target.level), 0);
				const bonusFrost = 3;
				const bonusPierce = 2;
				const damages = {
					...ability.damages,
					frost: Number(ability.damages?.frost ?? 0) + levelDifference * bonusFrost,
					pierce:
						Number(ability.damages?.pierce ?? 0) + (ability.isUpgraded() ? levelDifference * bonusPierce : 0),
				};
				const damage = new Damage(vehemoth, damages, 1, [], G);
				target.takeDamage(damage);
			},
			_getHexes() {
				const vehemoth = this.creature;
				return [
					...G.grid.getHexMap(
						vehemoth.x,
						vehemoth.y - 4,
						2,
						true,
						matrices.fourDistanceCone,
					),
					...this.creature.getHexMap(matrices.fourDistanceCone, false),
				];
			},
		},
	];
};
