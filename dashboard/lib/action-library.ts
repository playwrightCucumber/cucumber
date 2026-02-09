/**
 * Action Library - Standard actions for Scenario Builder
 * Each action maps to a Gherkin step template
 */

export type ActionCategory = 'navigation' | 'interaction' | 'input' | 'wait' | 'assertion';

export type ParameterType = 'string' | 'number' | 'selector' | 'url' | 'boolean' | 'select';

export interface ActionParameter {
    name: string;
    type: ParameterType;
    required: boolean;
    label: string;
    placeholder?: string;
    options?: { value: string; label: string }[];
    defaultValue?: string;
}

export interface ActionDefinition {
    id: string;
    name: string;
    category: ActionCategory;
    icon: string;
    description: string;
    gherkinTemplate: string;
    parameters: ActionParameter[];
}

/**
 * Complete action library with all available actions
 */
export const ACTION_LIBRARY: ActionDefinition[] = [
    // ═══════════════════════════════════════════════════════════════
    // NAVIGATION
    // ═══════════════════════════════════════════════════════════════
    {
        id: 'goto',
        name: 'Go to URL',
        category: 'navigation',
        icon: '🌐',
        description: 'Navigate to a specific URL',
        gherkinTemplate: 'I navigate to "{url}"',
        parameters: [
            { name: 'url', type: 'url', required: true, label: 'URL', placeholder: 'https://example.com' }
        ]
    },
    {
        id: 'goBack',
        name: 'Go Back',
        category: 'navigation',
        icon: '⬅️',
        description: 'Navigate to the previous page',
        gherkinTemplate: 'I go back',
        parameters: []
    },
    {
        id: 'reload',
        name: 'Reload Page',
        category: 'navigation',
        icon: '🔄',
        description: 'Reload the current page',
        gherkinTemplate: 'I reload the page',
        parameters: []
    },

    // ═══════════════════════════════════════════════════════════════
    // INTERACTION
    // ═══════════════════════════════════════════════════════════════
    {
        id: 'click',
        name: 'Click Element',
        category: 'interaction',
        icon: '👆',
        description: 'Click on an element',
        gherkinTemplate: 'I click on "{selector}"',
        parameters: [
            { name: 'selector', type: 'selector', required: true, label: 'Element Selector', placeholder: '#button or [data-testid="submit"]' }
        ]
    },
    {
        id: 'doubleClick',
        name: 'Double Click',
        category: 'interaction',
        icon: '👆👆',
        description: 'Double click on an element',
        gherkinTemplate: 'I double click on "{selector}"',
        parameters: [
            { name: 'selector', type: 'selector', required: true, label: 'Element Selector', placeholder: '#button' }
        ]
    },
    {
        id: 'rightClick',
        name: 'Right Click',
        category: 'interaction',
        icon: '🖱️',
        description: 'Right click on an element',
        gherkinTemplate: 'I right click on "{selector}"',
        parameters: [
            { name: 'selector', type: 'selector', required: true, label: 'Element Selector', placeholder: '#element' }
        ]
    },
    {
        id: 'hover',
        name: 'Hover Element',
        category: 'interaction',
        icon: '🎯',
        description: 'Hover over an element',
        gherkinTemplate: 'I hover over "{selector}"',
        parameters: [
            { name: 'selector', type: 'selector', required: true, label: 'Element Selector', placeholder: '#menu' }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    // INPUT
    // ═══════════════════════════════════════════════════════════════
    {
        id: 'fill',
        name: 'Fill Input',
        category: 'input',
        icon: '✏️',
        description: 'Fill text into an input field',
        gherkinTemplate: 'I fill "{value}" into "{selector}"',
        parameters: [
            { name: 'selector', type: 'selector', required: true, label: 'Input Selector', placeholder: '#email or [name="email"]' },
            { name: 'value', type: 'string', required: true, label: 'Value to Fill', placeholder: 'test@example.com' }
        ]
    },
    {
        id: 'clear',
        name: 'Clear Input',
        category: 'input',
        icon: '🗑️',
        description: 'Clear the content of an input field',
        gherkinTemplate: 'I clear "{selector}"',
        parameters: [
            { name: 'selector', type: 'selector', required: true, label: 'Input Selector', placeholder: '#search' }
        ]
    },
    {
        id: 'type',
        name: 'Type Text',
        category: 'input',
        icon: '⌨️',
        description: 'Type text character by character (simulates real typing)',
        gherkinTemplate: 'I type "{value}" into "{selector}"',
        parameters: [
            { name: 'selector', type: 'selector', required: true, label: 'Input Selector', placeholder: '#input' },
            { name: 'value', type: 'string', required: true, label: 'Text to Type', placeholder: 'Hello World' }
        ]
    },
    {
        id: 'selectOption',
        name: 'Select Option',
        category: 'input',
        icon: '📋',
        description: 'Select an option from a dropdown',
        gherkinTemplate: 'I select "{value}" from "{selector}"',
        parameters: [
            { name: 'selector', type: 'selector', required: true, label: 'Dropdown Selector', placeholder: '#country' },
            { name: 'value', type: 'string', required: true, label: 'Option Value', placeholder: 'Indonesia' }
        ]
    },
    {
        id: 'check',
        name: 'Check Checkbox',
        category: 'input',
        icon: '☑️',
        description: 'Check a checkbox',
        gherkinTemplate: 'I check "{selector}"',
        parameters: [
            { name: 'selector', type: 'selector', required: true, label: 'Checkbox Selector', placeholder: '#terms' }
        ]
    },
    {
        id: 'uncheck',
        name: 'Uncheck Checkbox',
        category: 'input',
        icon: '⬜',
        description: 'Uncheck a checkbox',
        gherkinTemplate: 'I uncheck "{selector}"',
        parameters: [
            { name: 'selector', type: 'selector', required: true, label: 'Checkbox Selector', placeholder: '#newsletter' }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    // WAIT
    // ═══════════════════════════════════════════════════════════════
    {
        id: 'waitForSelector',
        name: 'Wait for Element',
        category: 'wait',
        icon: '⏳',
        description: 'Wait for an element to appear',
        gherkinTemplate: 'I wait for "{selector}" to be visible',
        parameters: [
            { name: 'selector', type: 'selector', required: true, label: 'Element Selector', placeholder: '#loading' }
        ]
    },
    {
        id: 'waitForResponse',
        name: 'Wait for API Response',
        category: 'wait',
        icon: '📡',
        description: 'Wait for an API endpoint to respond',
        gherkinTemplate: 'I wait for API "{endpoint}" to respond',
        parameters: [
            { name: 'endpoint', type: 'string', required: true, label: 'API Endpoint', placeholder: '/api/users' }
        ]
    },
    {
        id: 'waitForURL',
        name: 'Wait for URL',
        category: 'wait',
        icon: '🔗',
        description: 'Wait for URL to contain a specific string',
        gherkinTemplate: 'I wait for URL to contain "{urlPattern}"',
        parameters: [
            { name: 'urlPattern', type: 'string', required: true, label: 'URL Pattern', placeholder: '/dashboard' }
        ]
    },
    {
        id: 'waitForNetworkIdle',
        name: 'Wait for Network Idle',
        category: 'wait',
        icon: '🌐',
        description: 'Wait for network requests to complete',
        gherkinTemplate: 'I wait for network to be idle',
        parameters: []
    },
    {
        id: 'waitForTime',
        name: 'Wait for Time',
        category: 'wait',
        icon: '⏱️',
        description: 'Wait for a specific duration',
        gherkinTemplate: 'I wait for {seconds} seconds',
        parameters: [
            { name: 'seconds', type: 'number', required: true, label: 'Seconds', placeholder: '2', defaultValue: '2' }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    // ASSERTION
    // ═══════════════════════════════════════════════════════════════
    {
        id: 'expectVisible',
        name: 'Expect Element Visible',
        category: 'assertion',
        icon: '👁️',
        description: 'Assert that an element is visible',
        gherkinTemplate: 'I should see "{selector}"',
        parameters: [
            { name: 'selector', type: 'selector', required: true, label: 'Element Selector', placeholder: '#success-message' }
        ]
    },
    {
        id: 'expectHidden',
        name: 'Expect Element Hidden',
        category: 'assertion',
        icon: '🙈',
        description: 'Assert that an element is hidden',
        gherkinTemplate: 'I should not see "{selector}"',
        parameters: [
            { name: 'selector', type: 'selector', required: true, label: 'Element Selector', placeholder: '#error-message' }
        ]
    },
    {
        id: 'expectText',
        name: 'Expect Text Content',
        category: 'assertion',
        icon: '📝',
        description: 'Assert that an element contains specific text',
        gherkinTemplate: 'I should see text "{text}" in "{selector}"',
        parameters: [
            { name: 'selector', type: 'selector', required: true, label: 'Element Selector', placeholder: '#title' },
            { name: 'text', type: 'string', required: true, label: 'Expected Text', placeholder: 'Welcome' }
        ]
    },
    {
        id: 'expectURL',
        name: 'Expect URL',
        category: 'assertion',
        icon: '🔗',
        description: 'Assert that URL contains a specific string',
        gherkinTemplate: 'the URL should contain "{urlPattern}"',
        parameters: [
            { name: 'urlPattern', type: 'string', required: true, label: 'URL Pattern', placeholder: '/dashboard' }
        ]
    },
    {
        id: 'expectEnabled',
        name: 'Expect Element Enabled',
        category: 'assertion',
        icon: '✅',
        description: 'Assert that an element is enabled',
        gherkinTemplate: '"{selector}" should be enabled',
        parameters: [
            { name: 'selector', type: 'selector', required: true, label: 'Element Selector', placeholder: '#submit-btn' }
        ]
    },
    {
        id: 'expectDisabled',
        name: 'Expect Element Disabled',
        category: 'assertion',
        icon: '🚫',
        description: 'Assert that an element is disabled',
        gherkinTemplate: '"{selector}" should be disabled',
        parameters: [
            { name: 'selector', type: 'selector', required: true, label: 'Element Selector', placeholder: '#submit-btn' }
        ]
    },
    {
        id: 'expectValue',
        name: 'Expect Input Value',
        category: 'assertion',
        icon: '🔢',
        description: 'Assert that an input has a specific value',
        gherkinTemplate: '"{selector}" should have value "{value}"',
        parameters: [
            { name: 'selector', type: 'selector', required: true, label: 'Input Selector', placeholder: '#email' },
            { name: 'value', type: 'string', required: true, label: 'Expected Value', placeholder: 'test@example.com' }
        ]
    }
];

/**
 * Get actions by category
 */
export function getActionsByCategory(category: ActionCategory): ActionDefinition[] {
    return ACTION_LIBRARY.filter(action => action.category === category);
}

/**
 * Get action by ID
 */
export function getActionById(id: string): ActionDefinition | undefined {
    return ACTION_LIBRARY.find(action => action.id === id);
}

/**
 * Get all unique categories
 */
export function getCategories(): ActionCategory[] {
    return [...new Set(ACTION_LIBRARY.map(action => action.category))];
}

/**
 * Category display info
 */
export const CATEGORY_INFO: Record<ActionCategory, { label: string; icon: string; description: string }> = {
    navigation: { label: 'Navigation', icon: '🧭', description: 'Navigate between pages' },
    interaction: { label: 'Interaction', icon: '👆', description: 'Click and interact with elements' },
    input: { label: 'Input', icon: '⌨️', description: 'Fill forms and inputs' },
    wait: { label: 'Wait', icon: '⏳', description: 'Wait for conditions' },
    assertion: { label: 'Assertion', icon: '✅', description: 'Verify expected results' }
};
