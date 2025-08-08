import { TriggerType, TriggerTiming, TriggerScope, ITriggerContext } from './TriggerTypes';
import { BaseTrigger, CustomCondition } from './BaseTrigger';
import { IDamageContext, ICreatureContext, IPhaseContext, ISpellContext, IQueryContext } from './TriggerContexts';

/**
 * Query trigger - activates when a query is made
 */
export class QueryTrigger extends BaseTrigger {
  private handler: (context: IQueryContext) => void | Promise<void>;

  constructor(
    handler: (context: IQueryContext) => void | Promise<void>,
    condition?: (context: IQueryContext) => boolean,
    priority: number = 0
  ) {
    const triggerCondition = condition ? new CustomCondition(condition as any) : undefined;
    super(TriggerType.QUERY, TriggerTiming.DURING, TriggerScope.SELF, triggerCondition, priority);
    this.handler = handler;
  }

  public execute(context: ITriggerContext): void | Promise<void> {
    return this.handler(context as IQueryContext);
  }
}

/**
 * Damage trigger - activates when damage is dealt or taken
 */
export class DamageTrigger extends BaseTrigger {
  private handler: (context: IDamageContext) => void | Promise<void>;

  constructor(
    handler: (context: IDamageContext) => void | Promise<void>,
    timing: TriggerTiming = TriggerTiming.DURING,
    scope: TriggerScope = TriggerScope.SELF,
    condition?: (context: IDamageContext) => boolean,
    priority: number = 0
  ) {
    const triggerCondition = condition ? new CustomCondition(condition as any) : undefined;
    super(TriggerType.DAMAGE, timing, scope, triggerCondition, priority);
    this.handler = handler;
  }

  public execute(context: ITriggerContext): void | Promise<void> {
    return this.handler(context as IDamageContext);
  }
}

/**
 * Under attack trigger - activates when being attacked
 */
export class UnderAttackTrigger extends BaseTrigger {
  private handler: (context: IDamageContext) => void | Promise<void>;

  constructor(
    handler: (context: IDamageContext) => void | Promise<void>,
    timing: TriggerTiming = TriggerTiming.BEFORE,
    condition?: (context: IDamageContext) => boolean,
    priority: number = 0
  ) {
    const triggerCondition = condition ? new CustomCondition(condition as any) : undefined;
    super(TriggerType.UNDER_ATTACK, timing, TriggerScope.SELF, triggerCondition, priority);
    this.handler = handler;
  }

  public execute(context: ITriggerContext): void | Promise<void> {
    return this.handler(context as IDamageContext);
  }
}

/**
 * Phase trigger - activates at start/end of phases
 */
export class PhaseTrigger extends BaseTrigger {
  private handler: (context: IPhaseContext) => void | Promise<void>;

  constructor(
    type: TriggerType.START_PHASE | TriggerType.END_PHASE,
    handler: (context: IPhaseContext) => void | Promise<void>,
    condition?: (context: IPhaseContext) => boolean,
    priority: number = 0
  ) {
    const triggerCondition = condition ? new CustomCondition(condition as any) : undefined;
    super(type, TriggerTiming.DURING, TriggerScope.SELF, triggerCondition, priority);
    this.handler = handler;
  }

  public execute(context: ITriggerContext): void | Promise<void> {
    return this.handler(context as IPhaseContext);
  }
}

/**
 * Creature movement trigger
 */
export class CreatureMoveTrigger extends BaseTrigger {
  private handler: (context: ICreatureContext) => void | Promise<void>;

  constructor(
    handler: (context: ICreatureContext) => void | Promise<void>,
    scope: TriggerScope = TriggerScope.SELF,
    timing: TriggerTiming = TriggerTiming.AFTER,
    condition?: (context: ICreatureContext) => boolean,
    priority: number = 0
  ) {
    const triggerType = scope === TriggerScope.SELF ? TriggerType.CREATURE_MOVE : TriggerType.OTHER_CREATURE_MOVE;
    const triggerCondition = condition ? new CustomCondition(condition as any) : undefined;
    super(triggerType, timing, scope, triggerCondition, priority);
    this.handler = handler;
  }

  public execute(context: ITriggerContext): void | Promise<void> {
    return this.handler(context as ICreatureContext);
  }
}

/**
 * Creature summon trigger
 */
export class CreatureSummonTrigger extends BaseTrigger {
  private handler: (context: ICreatureContext) => void | Promise<void>;

  constructor(
    handler: (context: ICreatureContext) => void | Promise<void>,
    scope: TriggerScope = TriggerScope.SELF,
    timing: TriggerTiming = TriggerTiming.AFTER,
    condition?: (context: ICreatureContext) => boolean,
    priority: number = 0
  ) {
    const triggerType = scope === TriggerScope.SELF ? TriggerType.CREATURE_SUMMON : TriggerType.OTHER_CREATURE_SUMMON;
    const triggerCondition = condition ? new CustomCondition(condition as any) : undefined;
    super(triggerType, timing, scope, triggerCondition, priority);
    this.handler = handler;
  }

  public execute(context: ITriggerContext): void | Promise<void> {
    return this.handler(context as ICreatureContext);
  }
}

/**
 * Spell cast trigger
 */
export class SpellCastTrigger extends BaseTrigger {
  private handler: (context: ISpellContext) => void | Promise<void>;

  constructor(
    handler: (context: ISpellContext) => void | Promise<void>,
    scope: TriggerScope = TriggerScope.SELF,
    timing: TriggerTiming = TriggerTiming.AFTER,
    condition?: (context: ISpellContext) => boolean,
    priority: number = 0
  ) {
    const triggerType = scope === TriggerScope.SELF ? TriggerType.SPELL_CAST : TriggerType.OTHER_SPELL_CAST;
    const triggerCondition = condition ? new CustomCondition(condition as any) : undefined;
    super(triggerType, timing, scope, triggerCondition, priority);
    this.handler = handler;
  }

  public execute(context: ITriggerContext): void | Promise<void> {
    return this.handler(context as ISpellContext);
  }
}

/**
 * Death trigger - activates when a creature dies
 */
export class DeathTrigger extends BaseTrigger {
  private handler: (context: ICreatureContext) => void | Promise<void>;

  constructor(
    handler: (context: ICreatureContext) => void | Promise<void>,
    scope: TriggerScope = TriggerScope.SELF,
    timing: TriggerTiming = TriggerTiming.DURING,
    condition?: (context: ICreatureContext) => boolean,
    priority: number = 0
  ) {
    const triggerType = scope === TriggerScope.SELF ? TriggerType.DIE : TriggerType.OTHER_CREATURE_DIE;
    const triggerCondition = condition ? new CustomCondition(condition as any) : undefined;
    super(triggerType, timing, scope, triggerCondition, priority);
    this.handler = handler;
  }

  public execute(context: ITriggerContext): void | Promise<void> {
    return this.handler(context as ICreatureContext);
  }
}
