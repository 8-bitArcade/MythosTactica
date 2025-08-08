/**
 * Team-related utilities and enum for game logic.
 * Provides the Team enum and a function to compare team relationships between creatures.
 * @module team
 */
import { Creature } from '../models/Creature';

/**
 * Enum representing possible team relationships.
 */
export enum Team {
	Enemy = 1, ///< Opposing team
	Ally = 2, ///< Same side
	Same = 3, ///< Identical team
	Both = 4, ///< Any team
}

/**
 * Compare the teams of two creatures according to a team relationship.
 *
 * @param {Creature} creature1 - The first creature.
 * @param {Creature} creature2 - The second creature.
 * @param {Team} team - The team relationship to check (Enemy, Ally, Same, Both).
 * @returns {boolean} True if the relationship holds, false otherwise.
 */
export function isTeam(creature1: Creature, creature2: Creature, team: Team): boolean {
	switch (team) {
		case Team.Enemy:
			return creature1.team % 2 !== creature2.team % 2;
		case Team.Ally:
			return creature1.team % 2 === creature2.team % 2;
		case Team.Same:
			return creature1.team === creature2.team;
		case Team.Both:
			return true;
	}
}
