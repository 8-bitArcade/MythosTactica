import { TriggerType, TriggerTiming, TriggerScope, ITriggerContext, ITriggerCondition, ITriggerRegistration } from './TriggerTypes';

/**
 * Base trigger model class
 */
export abstract class BaseTrigger {
  public readonly type: TriggerType;
  public readonly timing: TriggerTiming;
  public readonly scope: TriggerScope;
  public readonly condition?: ITriggerCondition;
  public readonly priority: number;

  constructor(
    type: TriggerType,
    timing: TriggerTiming = TriggerTiming.DURING,
    scope: TriggerScope = TriggerScope.SELF,
    condition?: ITriggerCondition,
    priority: number = 0
  ) {
    this.type = type;
    this.timing = timing;
    this.scope = scope;
    this.condition = condition;
    this.priority = priority;
  }

  /**
   * Check if this trigger should activate for the given context
   */
  public shouldActivate(context: ITriggerContext): boolean {
    // Check scope
    if (!this.checkScope(context)) {
      return false;
    }

    // Check custom condition if provided
    if (this.condition && !this.condition.evaluate(context)) {
      return false;
    }

    return true;
  }

  /**
   * Check if the scope matches the trigger context
   */
  protected checkScope(context: ITriggerContext): boolean {
    if (this.scope === TriggerScope.ANY) {
      return true;
    }

    // Additional scope checking logic would go here
    // For now, return true - this will be expanded based on game logic
    return true;
  }

  /**
   * Execute the trigger
   */
  public abstract execute(context: ITriggerContext): void | Promise<void>;
}

/**
 * Simple trigger implementation for basic cases
 */
export class SimpleTrigger extends BaseTrigger {
  private handler: (context: ITriggerContext) => void | Promise<void>;

  constructor(
    type: TriggerType,
    handler: (context: ITriggerContext) => void | Promise<void>,
    timing: TriggerTiming = TriggerTiming.DURING,
    scope: TriggerScope = TriggerScope.SELF,
    condition?: ITriggerCondition,
    priority: number = 0
  ) {
    super(type, timing, scope, condition, priority);
    this.handler = handler;
  }

  public execute(context: ITriggerContext): void | Promise<void> {
    return this.handler(context);
  }
}

/**
 * Compound trigger for multiple trigger types
 */
export class CompoundTrigger {
  public readonly triggers: BaseTrigger[];
  public readonly operator: 'AND' | 'OR';

  constructor(triggers: BaseTrigger[], operator: 'AND' | 'OR' = 'OR') {
    this.triggers = triggers;
    this.operator = operator;
  }

  public shouldActivate(context: ITriggerContext): boolean {
    if (this.operator === 'AND') {
      return this.triggers.every(trigger => trigger.shouldActivate(context));
    } else {
      return this.triggers.some(trigger => trigger.shouldActivate(context));
    }
  }

  public async execute(context: ITriggerContext): Promise<void> {
    const activeTriggers = this.triggers.filter(trigger => trigger.shouldActivate(context));
    
    // Sort by priority (higher priority first)
    activeTriggers.sort((a, b) => b.priority - a.priority);

    // Execute triggers
    for (const trigger of activeTriggers) {
      await trigger.execute(context);
    }
  }
}

/**
 * Condition implementations
 */
export class AlwaysCondition implements ITriggerCondition {
  evaluate(context: ITriggerContext): boolean {
    return true;
  }
}

export class NeverCondition implements ITriggerCondition {
  evaluate(context: ITriggerContext): boolean {
    return false;
  }
}

export class CustomCondition implements ITriggerCondition {
  private predicate: (context: ITriggerContext) => boolean;

  constructor(predicate: (context: ITriggerContext) => boolean) {
    this.predicate = predicate;
  }

  evaluate(context: ITriggerContext): boolean {
    return this.predicate(context);
  }
}
