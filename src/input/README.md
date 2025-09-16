# InputManager Documentation

The InputManager provides centralized input handling for MythosTactica, supporting mouse, keyboard, and touch inputs with Phaser 3 integration.

## Features

### 🖱️ Mouse Input
- **Hex Grid Coordinate Detection**: Automatically converts screen coordinates to hex grid coordinates
- **Click Handling**: Single and double-click support with proper hex targeting
- **Hover Effects**: Creature hover states and visual feedback
- **Cursor Management**: Dynamic cursor changes based on hex state

### ⌨️ Keyboard Shortcuts
- **Game Controls**: ESC (cancel), Space/Enter (confirm), Tab (cycle creatures)
- **Ability Selection**: Number keys 1-4 for ability selection
- **UI Shortcuts**: Q for queue display, F11/Shift+F for fullscreen
- **Debug Mode**: Ctrl+Shift+D for debug toggle
- **Customizable**: Add/remove shortcuts dynamically

### 📱 Touch Input
- **Tap Gestures**: Single tap and double tap support
- **Long Press**: Context menu and creature info display
- **Swipe Gestures**: Navigation and camera movement
- **Mobile Optimized**: Proper touch thresholds and gesture recognition

## Usage

### Basic Setup
The InputManager is automatically initialized when the game starts:

```typescript
// InputManager is created in Game constructor
this.inputManager = new InputManager(this);

// Initialized in game setup with current scene
this.inputManager.initialize(this.currentScene);
this.inputManager.setInputMode('game');
```

### Input Modes
- `'menu'`: Menu navigation mode
- `'game'`: Active gameplay mode
- `'ui'`: UI interaction mode
- `'disabled'`: All input disabled

### Adding Custom Shortcuts
```typescript
// Add a new keyboard shortcut
G.inputManager.addShortcut('KeyH', {
    action: () => console.log('Help requested'),
    description: 'Show help',
    modifiers: { ctrl: true }
});

// Remove a shortcut
G.inputManager.removeShortcut('KeyH', { ctrl: true });
```

### Touch Configuration
```typescript
// Configure touch input behavior
G.inputManager.configureTouchInput({
    enabled: true,
    doubleTapThreshold: 300,
    longPressThreshold: 500,
    swipeThreshold: 50
});
```

## Integration with Existing Systems

### Hex Grid Integration
The InputManager works seamlessly with the existing HexGrid system:
- Uses existing `onSelectFn`, `onConfirmFn`, and `onHoverOffFn` handlers
- Maintains compatibility with hex query system
- Preserves all existing hex interaction behavior

### Game State Integration
Automatically adapts to game state changes:
- Enables/disables input based on game state
- Adjusts input mode for different game phases
- Integrates with existing game loop

### Signal System Integration
Works with the existing signal system:
- Dispatches creature selection events
- Integrates with UI signal channels
- Maintains backward compatibility

## Debugging

### Debug Information
```javascript
// Get current input state (available in browser console)
console.log(InputManager.getDebugInfo());

// Output example:
{
    enabled: true,
    mode: 'game',
    activeHex: '(5, 3)',
    hoveredHex: '(6, 3)',
    selectedCreature: 'Dark Priest',
    shortcutsCount: 12,
    touchEnabled: true
}
```

### Console Access
The InputManager is exposed globally for debugging:
```javascript
// Available in browser console
InputManager.getInputState()
InputManager.getShortcuts()
InputManager.enableInput()
InputManager.disableInput()
```

## Architecture

### Coordinate System
The InputManager uses the existing hex coordinate system:
- Converts Phaser pointer coordinates to hex grid coordinates
- Accounts for hex offset pattern (even/odd row offsets)
- Uses `HEX_WIDTH_PX` and `HEX_HEIGHT_PX` constants from `const.ts`

### Event Flow
1. **Input Event** → Phaser Input System
2. **Coordinate Conversion** → Hex Grid Coordinates
3. **Hex Lookup** → Find target hex
4. **Action Dispatch** → Existing hex event handlers
5. **State Update** → Update input state

### Memory Management
- Proper cleanup of event listeners
- Reference management to prevent memory leaks
- Destroy method for complete cleanup

## Requirements Fulfilled

This implementation fulfills the following requirements from the specification:

- **5.1**: ✅ Hex grid coordinate detection using Phaser 3's input system
- **5.2**: ✅ Keyboard shortcut handling through the InputManager
- **5.3**: ✅ Touch input support for mobile devices
- **5.4**: ✅ Integration with existing game systems

## Future Enhancements

- **Gesture Recognition**: More complex touch gestures
- **Input Recording**: Record and replay input sequences
- **Accessibility**: Screen reader and keyboard navigation support
- **Customization**: User-configurable key bindings
- **Analytics**: Input usage tracking and optimization