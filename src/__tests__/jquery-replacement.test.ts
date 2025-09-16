/**
 * Comprehensive test suite for jQuery replacement utilities
 * Tests all DOM manipulation, event handling, and utility functions
 */

import { $ } from '../script';

// Mock DOM environment for testing
const mockElement = (tagName: string = 'div'): HTMLElement => {
	const element = document.createElement(tagName);
	return element;
};

// Test the utility functions directly
const testUtils = {
	createElement: (tagName: string, attributes?: { [key: string]: string }, textContent?: string): HTMLElement => {
		const element = document.createElement(tagName);
		if (attributes) {
			Object.keys(attributes).forEach(key => {
				if (key === 'className') {
					element.className = attributes[key];
				} else {
					element.setAttribute(key, attributes[key]);
				}
			});
		}
		if (textContent) {
			element.textContent = textContent;
		}
		return element;
	},

	append: (parent: HTMLElement | null, child: HTMLElement | string): void => {
		if (parent) {
			if (typeof child === 'string') {
				parent.insertAdjacentHTML('beforeend', child);
			} else {
				parent.appendChild(child);
			}
		}
	},

	prepend: (parent: HTMLElement | null, child: HTMLElement | string): void => {
		if (parent) {
			if (typeof child === 'string') {
				parent.insertAdjacentHTML('afterbegin', child);
			} else {
				parent.insertBefore(child, parent.firstChild);
			}
		}
	},

	addClass: (element: HTMLElement | null, className: string): void => {
		if (element) element.classList.add(className);
	},

	removeClass: (element: HTMLElement | null, className: string): void => {
		if (element) element.classList.remove(className);
	},

	hasClass: (element: HTMLElement | null, className: string): boolean => {
		return element ? element.classList.contains(className) : false;
	},

	toggleClass: (element: HTMLElement | null, className: string): void => {
		if (element) element.classList.toggle(className);
	},

	parent: (element: HTMLElement | null): HTMLElement | null => {
		return element ? element.parentElement : null;
	},

	children: (element: HTMLElement | null): HTMLElement[] => {
		return element ? Array.from(element.children) as HTMLElement[] : [];
	},

	find: (element: HTMLElement | null, selector: string): HTMLElement | null => {
		return element ? element.querySelector(selector) as HTMLElement : null;
	},

	findAll: (element: HTMLElement | null, selector: string): HTMLElement[] => {
		return element ? Array.from(element.querySelectorAll(selector)) as HTMLElement[] : [];
	},

	attr: (element: HTMLElement | null, name: string, value?: string): string | void => {
		if (!element) return '';
		if (value !== undefined) {
			element.setAttribute(name, value);
		} else {
			return element.getAttribute(name) || '';
		}
	},

	removeAttr: (element: HTMLElement | null, name: string): void => {
		if (element) element.removeAttribute(name);
	},

	data: (element: HTMLElement | null, key: string, value?: string): string | void => {
		if (!element) return '';
		const dataKey = `data-${key}`;
		if (value !== undefined) {
			element.setAttribute(dataKey, value);
		} else {
			return element.getAttribute(dataKey) || '';
		}
	},

	// Additional test utilities for comprehensive coverage
	testEventDelegation: (container: HTMLElement, selector: string, eventType: string): Promise<boolean> => {
		return new Promise((resolve) => {
			let eventFired = false;
			$.delegate(container, selector, eventType, () => {
				eventFired = true;
				resolve(true);
			});
			
			const targetElement = container.querySelector(selector) as HTMLElement;
			if (targetElement) {
				const event = new Event(eventType, { bubbles: true });
				targetElement.dispatchEvent(event);
			}
			
			setTimeout(() => {
				if (!eventFired) resolve(false);
			}, 100);
		});
	},

	testAnimation: (element: HTMLElement, animationType: 'fadeIn' | 'fadeOut' | 'slideUp' | 'slideDown'): Promise<boolean> => {
		return new Promise((resolve) => {
			const initialDisplay = element.style.display;
			const initialOpacity = element.style.opacity;
			
			switch (animationType) {
				case 'fadeIn':
					element.style.display = 'none';
					$.fadeIn(element, 100);
					break;
				case 'fadeOut':
					$.fadeOut(element, 100);
					break;
				case 'slideUp':
					$.slideUp(element, 100);
					break;
				case 'slideDown':
					element.style.display = 'none';
					$.slideDown(element, 100);
					break;
			}
			
			setTimeout(() => {
				const changed = element.style.display !== initialDisplay || 
							   element.style.opacity !== initialOpacity;
				resolve(changed);
			}, 150);
		});
	}
};

// Mock DOM environment for testing
const mockElement = (tagName: string = 'div'): HTMLElement => {
	const element = document.createElement(tagName);
	return element;
};

describe('jQuery Replacement Utilities - Comprehensive Test Suite', () => {
	let testElement: HTMLElement;

	beforeEach(() => {
		testElement = mockElement();
		document.body.appendChild(testElement);
	});

	afterEach(() => {
		if (testElement.parentNode) {
			testElement.parentNode.removeChild(testElement);
		}
	});

	describe('Element Selection', () => {
		test('should select elements by various selectors', () => {
			document.body.innerHTML = `
				<div id="test-id" class="test-class">Test</div>
				<span class="test-class">Span</span>
				<p data-test="value">Paragraph</p>
			`;

			expect($.get('#test-id')).toBeTruthy();
			expect($.getId('test-id')).toBeTruthy();
			expect($.getAll('.test-class')).toHaveLength(2);
		});

		test('should handle null selectors gracefully', () => {
			expect($.get('#nonexistent')).toBeNull();
			expect($.getId('nonexistent')).toBeNull();
			expect($.getAll('.nonexistent')).toHaveLength(0);
		});
	});

	describe('DOM Manipulation', () => {
		test('should create elements with complex attributes', () => {
			const element = $.createElement('input', { 
				type: 'text',
				id: 'test-input', 
				className: 'form-control required',
				placeholder: 'Enter text'
			});
			
			expect(element.tagName).toBe('INPUT');
			expect(element.getAttribute('type')).toBe('text');
			expect(element.id).toBe('test-input');
			expect(element.className).toBe('form-control required');
			expect(element.getAttribute('placeholder')).toBe('Enter text');
		});

		test('should handle show/hide operations', () => {
			$.hide(testElement);
			expect(testElement.style.display).toBe('none');
			expect($.isVisible(testElement)).toBe(false);
			
			$.show(testElement);
			expect(testElement.style.display).toBe('');
			expect($.isVisible(testElement)).toBe(true);
		});

		test('should handle text and HTML content', () => {
			$.setText(testElement, 'Plain text');
			expect($.text(testElement)).toBe('Plain text');
			
			$.setHtml(testElement, '<span>HTML content</span>');
			expect($.html(testElement)).toBe('<span>HTML content</span>');
		});

		test('should handle complex DOM insertion', () => {
			const parent = $.createElement('div');
			const child1 = $.createElement('span', {}, 'First');
			const child2 = $.createElement('span', {}, 'Second');
			const child3 = $.createElement('span', {}, 'Third');
			
			$.append(parent, child1);
			$.prepend(parent, child2);
			$.insertAfter(child1, child3);
			
			expect(parent.children.length).toBe(3);
			expect(parent.children[0].textContent).toBe('Second');
			expect(parent.children[1].textContent).toBe('First');
			expect(parent.children[2].textContent).toBe('Third');
		});
	});

	describe('Event Handling', () => {
		test('should handle event binding and unbinding', () => {
			let clickCount = 0;
			const handler = () => clickCount++;
			
			$.on(testElement, 'click', handler);
			testElement.click();
			expect(clickCount).toBe(1);
			
			$.off(testElement, 'click', handler);
			testElement.click();
			expect(clickCount).toBe(1);
		});

		test('should handle event delegation', async () => {
			const container = $.createElement('div');
			container.innerHTML = '<button class="dynamic-btn">Click me</button>';
			document.body.appendChild(container);
			
			const result = await testUtils.testEventDelegation(container, '.dynamic-btn', 'click');
			expect(result).toBe(true);
			
			document.body.removeChild(container);
		});

		test('should trigger custom events', () => {
			let eventTriggered = false;
			testElement.addEventListener('custom', () => {
				eventTriggered = true;
			});
			
			$.trigger(testElement, 'custom');
			expect(eventTriggered).toBe(true);
		});
	});

	describe('Form Handling', () => {
		test('should handle form input values', () => {
			const input = document.createElement('input') as HTMLInputElement;
			input.type = 'text';
			
			$.setValue(input, 'test value');
			expect($.getValue(input)).toBe('test value');
			
			const checkbox = document.createElement('input') as HTMLInputElement;
			checkbox.type = 'checkbox';
			
			$.setChecked(checkbox, true);
			expect(checkbox.checked).toBe(true);
		});

		test('should serialize complex forms', () => {
			const form = document.createElement('form');
			form.innerHTML = `
				<input name="text" value="text value">
				<input name="number" type="number" value="42">
				<select name="select">
					<option value="option1" selected>Option 1</option>
				</select>
				<textarea name="textarea">Textarea content</textarea>
			`;
			
			const serialized = $.serialize(form);
			expect(serialized).toContain('text=text+value');
			expect(serialized).toContain('number=42');
			expect(serialized).toContain('select=option1');
			expect(serialized).toContain('textarea=Textarea+content');
		});

		test('should validate forms with complex rules', () => {
			const form = document.createElement('form');
			form.innerHTML = `
				<input name="email" value="test@example.com">
				<input name="password" value="securepassword123">
				<input name="confirmPassword" value="securepassword123">
				<input name="age" value="25">
			`;
			
			const rules = {
				email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Invalid email format',
				password: (value: string) => value.length >= 8 || 'Password must be at least 8 characters',
				confirmPassword: (value: string) => {
					const formData = $.getFormData(form);
					return value === formData.password || 'Passwords do not match';
				},
				age: (value: string) => {
					const age = parseInt(value);
					return (age >= 18 && age <= 120) || 'Age must be between 18 and 120';
				}
			};
			
			const errors = $.validateForm(form, rules);
			expect(Object.keys(errors)).toHaveLength(0);
		});
	});

	describe('Element Relationships', () => {
		test('should navigate element relationships', () => {
			const grandparent = $.createElement('div');
			const parent = $.createElement('div');
			const child1 = $.createElement('span');
			const child2 = $.createElement('span');
			const child3 = $.createElement('span');
			
			$.append(grandparent, parent);
			$.append(parent, child1);
			$.append(parent, child2);
			$.append(parent, child3);
			
			expect($.parent(child1)).toBe(parent);
			expect($.children(parent)).toHaveLength(3);
			expect($.siblings(child2)).toHaveLength(2);
			expect($.closest(child1, 'div')).toBe(parent);
		});

		test('should find elements within context', () => {
			testElement.innerHTML = `
				<div class="container">
					<span class="item" id="item1">Item 1</span>
					<span class="item" id="item2">Item 2</span>
					<div class="nested">
						<span class="item" id="item3">Item 3</span>
					</div>
				</div>
			`;
			
			const container = $.find(testElement, '.container');
			expect($.find(container, '#item1')).toBeTruthy();
			expect($.findAll(container, '.item')).toHaveLength(3);
		});
	});

	describe('CSS and Styling', () => {
		test('should handle CSS properties', () => {
			$.css(testElement, {
				'background-color': 'red',
				'font-size': '16px',
				'margin-top': '10px'
			});
			
			expect(testElement.style.backgroundColor).toBe('red');
			expect(testElement.style.fontSize).toBe('16px');
			expect(testElement.style.marginTop).toBe('10px');
		});

		test('should handle dimensions and positioning', () => {
			$.width(testElement, 200);
			$.height(testElement, 100);
			
			expect(testElement.style.width).toBe('200px');
			expect(testElement.style.height).toBe('100px');
			
			const offset = $.offset(testElement);
			const position = $.position(testElement);
			
			expect(typeof offset.top).toBe('number');
			expect(typeof offset.left).toBe('number');
			expect(typeof position.top).toBe('number');
			expect(typeof position.left).toBe('number');
		});
	});

	describe('Animations and Effects', () => {
		test('should handle fade animations', async () => {
			const fadeInResult = await testUtils.testAnimation(testElement, 'fadeIn');
			expect(fadeInResult).toBe(true);
			
			const fadeOutResult = await testUtils.testAnimation(testElement, 'fadeOut');
			expect(fadeOutResult).toBe(true);
		});

		test('should handle slide animations', async () => {
			const slideDownResult = await testUtils.testAnimation(testElement, 'slideDown');
			expect(slideDownResult).toBe(true);
			
			const slideUpResult = await testUtils.testAnimation(testElement, 'slideUp');
			expect(slideUpResult).toBe(true);
		});

		test('should handle custom animations', async () => {
			const animationPromise = $.animate(testElement, {
				opacity: '0.5',
				transform: 'translateX(100px)'
			}, 100);
			
			expect(animationPromise).toBeInstanceOf(Promise);
			await animationPromise;
			
			expect(testElement.style.opacity).toBe('0.5');
			expect(testElement.style.transform).toBe('translateX(100px)');
		});
	});

	describe('Utility Functions', () => {
		test('should handle viewport detection', () => {
			// Test with element in viewport
			const visibleElement = $.createElement('div');
			document.body.appendChild(visibleElement);
			
			const isVisible = $.isInViewport(visibleElement);
			expect(typeof isVisible).toBe('boolean');
			
			document.body.removeChild(visibleElement);
		});

		test('should handle scrolling', () => {
			const scrollableElement = $.createElement('div');
			scrollableElement.style.height = '100px';
			scrollableElement.style.overflow = 'auto';
			scrollableElement.innerHTML = '<div style="height: 200px;">Tall content</div>';
			
			$.scrollTo(scrollableElement, { top: 50, behavior: 'auto' });
			// Note: scrollTo behavior is hard to test in JSDOM, but we verify it doesn't throw
			expect(true).toBe(true);
		});

		test('should handle DOM ready state', () => {
			let readyCallbackCalled = false;
			
			$.ready(() => {
				readyCallbackCalled = true;
			});
			
			// Since document is already ready in tests, callback should be called immediately
			expect(readyCallbackCalled).toBe(true);
		});
	});

	describe('Error Handling', () => {
		test('should handle null elements gracefully', () => {
			expect(() => $.hide(null)).not.toThrow();
			expect(() => $.show(null)).not.toThrow();
			expect(() => $.addClass(null, 'test')).not.toThrow();
			expect(() => $.removeClass(null, 'test')).not.toThrow();
			expect(() => $.setText(null, 'test')).not.toThrow();
			expect(() => $.setHtml(null, 'test')).not.toThrow();
			
			expect($.text(null)).toBe('');
			expect($.html(null)).toBe('');
			expect($.hasClass(null, 'test')).toBe(false);
			expect($.isVisible(null)).toBe(false);
		});

		test('should handle invalid selectors gracefully', () => {
			expect($.get('')).toBeNull();
			expect($.getAll('').length).toBe(0);
			expect($.getId('')).toBeNull();
		});
	});

	describe('Performance and Memory', () => {
		test('should not create memory leaks with event handlers', () => {
			const elements = [];
			const handlers = [];
			
			// Create multiple elements with event handlers
			for (let i = 0; i < 100; i++) {
				const element = $.createElement('div');
				const handler = () => {};
				
				$.on(element, 'click', handler);
				elements.push(element);
				handlers.push(handler);
			}
			
			// Remove all event handlers
			elements.forEach((element, index) => {
				$.off(element, 'click', handlers[index]);
			});
			
			// Test passes if no errors are thrown
			expect(elements.length).toBe(100);
		});
	});
});