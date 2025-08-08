import { ITriggerContext } from './TriggerTypes';

/**
 * Specific trigger context implementations for different event types
 */

export interface IDamageContext extends ITriggerContext {
  damage: any;           // Damage instance
  attacker?: any;        // Creature dealing damage
  defender: any;         // Creature receiving damage
  amount: number;        // Damage amount
  damageType?: string;   // Type of damage
}

export interface ICreatureContext extends ITriggerContext {
  creature: any;         // The creature involved in the event
  owner?: any;          // Owner of the creature
  position?: any;       // Position/hex where event occurred
  previousPosition?: any; // Previous position (for movement)
}

export interface IPhaseContext extends ITriggerContext {
  phase: string;         // Phase name ('ready', 'combat', etc.)
  player?: any;         // Player whose phase it is
  turn?: number;        // Turn number
}

export interface ISpellContext extends ITriggerContext {
  spell: any;           // Spell being cast
  caster: any;          // Creature casting the spell
  targets?: any[];      // Spell targets
  cost?: number;        // Mana cost
}

export interface IQueryContext extends ITriggerContext {
  query: string;        // Query string
  queryResult?: any;    // Result of the query
  queryData?: any;      // Additional query data
}

export interface ITrapContext extends ITriggerContext {
  trap: any;            // Trap instance
  triggerer: any;       // Creature that triggered the trap
  position: any;        // Position where trap was triggered
}

/**
 * Context factory for creating specific trigger contexts
 */
export class TriggerContextFactory {
  static createDamageContext(
    game: any,
    damage: any,
    attacker?: any,
    defender?: any,
    ability?: any,
    additionalData?: any
  ): IDamageContext {
    return {
      game,
      source: attacker,
      target: defender,
      ability,
      data: additionalData,
      damage,
      attacker,
      defender,
      amount: damage?.amount || 0,
      damageType: damage?.type
    };
  }

  static createCreatureContext(
    game: any,
    creature: any,
    ability?: any,
    position?: any,
    previousPosition?: any,
    additionalData?: any
  ): ICreatureContext {
    return {
      game,
      source: creature,
      target: creature,
      ability,
      data: additionalData,
      creature,
      owner: creature?.owner,
      position,
      previousPosition
    };
  }

  static createPhaseContext(
    game: any,
    phase: string,
    player?: any,
    turn?: number,
    ability?: any,
    additionalData?: any
  ): IPhaseContext {
    return {
      game,
      source: player,
      ability,
      data: additionalData,
      phase,
      player,
      turn
    };
  }

  static createSpellContext(
    game: any,
    spell: any,
    caster: any,
    targets?: any[],
    ability?: any,
    additionalData?: any
  ): ISpellContext {
    return {
      game,
      source: caster,
      target: targets?.[0],
      ability,
      data: additionalData,
      spell,
      caster,
      targets,
      cost: spell?.cost
    };
  }

  static createQueryContext(
    game: any,
    query: string,
    source?: any,
    ability?: any,
    queryResult?: any,
    additionalData?: any
  ): IQueryContext {
    return {
      game,
      source,
      ability,
      data: additionalData,
      query,
      queryResult,
      queryData: additionalData
    };
  }

  static createTrapContext(
    game: any,
    trap: any,
    triggerer: any,
    position: any,
    ability?: any,
    additionalData?: any
  ): ITrapContext {
    return {
      game,
      source: trap,
      target: triggerer,
      ability,
      data: additionalData,
      trap,
      triggerer,
      position
    };
  }
}
