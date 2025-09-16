// Demonstration of jQuery replacement utilities
// This file shows how the utilities can be used in practice

import { $ } from '../script';

// Example usage of jQuery replacement utilities
export function demonstrateJQueryReplacement() {
	// Create a container element
	const container = $.createElement('div', { 
		id: 'demo-container', 
		className: 'demo-class' 
	});

	// Add some content
	const title = $.createElement('h2', {}, 'jQuery Replacement Demo');
	const paragraph = $.createElement('p', {}, 'This demonstrates the jQuery replacement utilities.');
	
	$.append(container, title);
	$.append(container, paragraph);

	// Add some styling
	$.css(container, {
		'background-color': '#f0f0f0',
		'padding': '20px',
		'border-radius': '5px'
	});

	// Create a form for demonstration
	const form = $.createElement('form') as HTMLFormElement;
	form.innerHTML = `
		<input name="username" placeholder="Username" required>
		<input name="email" type="email" placeholder="Email" required>
		<button type="submit">Submit</button>
	`;

	$.append(container, form);

	// Add form validation
	const validationRules = {
		username: (value: string) => value.length >= 3 || 'Username must be at least 3 characters',
		email: (value: string) => value.includes('@') || 'Please enter a valid email'
	};

	// Event delegation example
	$.delegate(container, 'form', 'submit', (e) => {
		e.preventDefault();
		const errors = $.validateForm(form, validationRules);
		
		if (Object.keys(errors).length === 0) {
			console.log('Form is valid!');
			console.log('Form data:', $.serialize(form));
		} else {
			console.log('Validation errors:', errors);
		}
	});

	// Animation example
	$.fadeIn(container, 500);

	return container;
}

// Example of complex UI interaction
export function createInteractiveElement() {
	const wrapper = $.createElement('div', { className: 'interactive-wrapper' });
	
	// Create tabs
	const tabContainer = $.createElement('div', { className: 'tabs' });
	const tab1 = $.createElement('button', { 'data-tab': 'tab1' }, 'Tab 1');
	const tab2 = $.createElement('button', { 'data-tab': 'tab2' }, 'Tab 2');
	
	$.append(tabContainer, tab1);
	$.append(tabContainer, tab2);
	
	// Create content areas
	const contentContainer = $.createElement('div', { className: 'tab-content' });
	const content1 = $.createElement('div', { 'data-content': 'tab1' }, 'Content for Tab 1');
	const content2 = $.createElement('div', { 'data-content': 'tab2' }, 'Content for Tab 2');
	
	$.append(contentContainer, content1);
	$.append(contentContainer, content2);
	
	// Initially hide second content
	$.css(content2, { display: 'none' });
	$.addClass(tab1, 'active');
	
	// Add tab switching functionality
	$.delegate(tabContainer, 'button', 'click', (e) => {
		const clickedTab = e.target as HTMLElement;
		const tabId = $.data(clickedTab, 'tab') as string;
		
		// Remove active class from all tabs
		$.findAll(tabContainer, 'button').forEach(tab => {
			$.removeClass(tab, 'active');
		});
		
		// Add active class to clicked tab
		$.addClass(clickedTab, 'active');
		
		// Hide all content
		$.findAll(contentContainer, '[data-content]').forEach(content => {
			$.css(content, { display: 'none' });
		});
		
		// Show selected content
		const selectedContent = $.find(contentContainer, `[data-content="${tabId}"]`);
		$.css(selectedContent, { display: 'block' });
	});
	
	$.append(wrapper, tabContainer);
	$.append(wrapper, contentContainer);
	
	return wrapper;
}

// Example of working with existing DOM elements
export function enhanceExistingElements() {
	// Find all buttons and enhance them
	const buttons = $.getAll('button');
	buttons.forEach(button => {
		const htmlButton = button as HTMLElement;
		
		// Add hover effects
		$.on(htmlButton, 'mouseenter', () => {
			$.addClass(htmlButton, 'hover');
		});
		
		$.on(htmlButton, 'mouseleave', () => {
			$.removeClass(htmlButton, 'hover');
		});
		
		// Add click animation
		$.on(htmlButton, 'click', () => {
			$.addClass(htmlButton, 'clicked');
			setTimeout(() => {
				$.removeClass(htmlButton, 'clicked');
			}, 200);
		});
	});
	
	// Enhance forms with better validation feedback
	const forms = $.getAll('form');
	forms.forEach(form => {
		const htmlForm = form as HTMLFormElement;
		
		$.on(htmlForm, 'submit', (e) => {
			// Add visual feedback for form submission
			const submitButton = $.find(htmlForm, 'button[type="submit"]');
			if (submitButton) {
				$.setText(submitButton, 'Submitting...');
				$.addClass(submitButton, 'loading');
			}
		});
	});
}