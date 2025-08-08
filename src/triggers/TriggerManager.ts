import { TriggerType, TriggerTiming, ITriggerContext, ITriggerRegistration } from './TriggerTypes';
import { BaseTrigger, CompoundTrigger } from './BaseTrigger';

/**
 * TriggerManager handles registration and activation of triggers
 */
export class TriggerManager {
  private triggers: Map<TriggerType, Set<ITriggerRegistration>> = new Map();
  private globalTriggers: Set<ITriggerRegistration> = new Set();

  /**
   * Register a trigger
   */
  public register(registration: ITriggerRegistration): void {
    if (!this.triggers.has(registration.type)) {
      this.triggers.set(registration.type, new Set());
    }
    this.triggers.get(registration.type)!.add(registration);
  }

  /**
   * Register a global trigger that activates on any event
   */
  public registerGlobal(registration: ITriggerRegistration): void {
    this.globalTriggers.add(registration);
  }

  /**
   * Unregister a trigger
   */
  public unregister(registration: ITriggerRegistration): void {
    const typeSet = this.triggers.get(registration.type);
    if (typeSet) {
      typeSet.delete(registration);
      if (typeSet.size === 0) {
        this.triggers.delete(registration.type);
      }
    }
    this.globalTriggers.delete(registration);
  }

  /**
   * Activate triggers for a specific event type
   */
  public async activate(
    type: TriggerType,
    context: ITriggerContext,
    timing: TriggerTiming = TriggerTiming.DURING
  ): Promise<void> {
    const registrations: ITriggerRegistration[] = [];

    // Collect triggers for this specific type
    const typeSet = this.triggers.get(type);
    if (typeSet) {
      registrations.push(...Array.from(typeSet));
    }

    // Add global triggers
    registrations.push(...Array.from(this.globalTriggers));

    // Filter by timing and conditions
    const activeTriggers = registrations.filter(reg => {
      if (reg.timing && reg.timing !== timing) {
        return false;
      }
      if (reg.condition && !reg.condition.evaluate(context)) {
        return false;
      }
      return true;
    });

    // Sort by priority (higher priority first)
    activeTriggers.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Execute triggers
    for (const trigger of activeTriggers) {
      try {
        await trigger.handler(context);
      } catch (error) {
        console.error(`Error executing trigger ${type}:`, error);
      }
    }
  }

  /**
   * Register a BaseTrigger instance
   */
  public registerTrigger(trigger: BaseTrigger, handler?: (context: ITriggerContext) => void | Promise<void>): void {
    const registration: ITriggerRegistration = {
      type: trigger.type,
      timing: trigger.timing,
      scope: trigger.scope,
      condition: trigger.condition,
      handler: handler || ((context) => trigger.execute(context)),
      priority: trigger.priority
    };
    this.register(registration);
  }

  /**
   * Register a CompoundTrigger instance
   */
  public registerCompoundTrigger(compound: CompoundTrigger, handler?: (context: ITriggerContext) => void | Promise<void>): void {
    // For compound triggers, we register for all constituent trigger types
    const uniqueTypes = new Set(compound.triggers.map(t => t.type));
    
    for (const type of uniqueTypes) {
      const registration: ITriggerRegistration = {
        type,
        handler: handler || ((context) => {
          if (compound.shouldActivate(context)) {
            return compound.execute(context);
          }
        }),
        priority: Math.max(...compound.triggers.map(t => t.priority))
      };
      this.register(registration);
    }
  }

  /**
   * Clear all triggers
   */
  public clear(): void {
    this.triggers.clear();
    this.globalTriggers.clear();
  }

  /**
   * Get all registered triggers for debugging
   */
  public getRegisteredTriggers(): Map<TriggerType, ITriggerRegistration[]> {
    const result = new Map<TriggerType, ITriggerRegistration[]>();
    for (const [type, set] of this.triggers) {
      result.set(type, Array.from(set));
    }
    return result;
  }

  /**
   * Check if any triggers are registered for a specific type
   */
  public hasTriggers(type: TriggerType): boolean {
    const typeSet = this.triggers.get(type);
    return (typeSet && typeSet.size > 0) || this.globalTriggers.size > 0;
  }
}

/**
 * Global trigger manager instance
 */
export const globalTriggerManager = new TriggerManager();
