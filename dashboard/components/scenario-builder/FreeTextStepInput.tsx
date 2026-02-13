'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface StepDefinition {
  pattern: string;
  text: string;
  type: 'Given' | 'When' | 'Then' | 'And' | 'But';
  file: string;
  parameters: Array<{ name: string; type: string; position: number }>;
  example?: string;
}

interface ValidationResult {
  valid: boolean;
  matches: StepDefinition[];
  suggestions: StepDefinition[];
}

interface FreeTextStepInputProps {
  value: string;
  stepType: 'Given' | 'When' | 'Then';
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  placeholder?: string;
}

export default function FreeTextStepInput({
  value,
  stepType,
  onChange,
  onValidationChange,
  placeholder = 'Type step text...'
}: FreeTextStepInputProps) {
  const [suggestions, setSuggestions] = useState<StepDefinition[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();
  const validateTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch autocomplete suggestions
  const fetchSuggestions = useCallback(async (searchText: string) => {
    if (searchText.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`/api/steps?q=${encodeURIComponent(searchText)}&type=${stepType}`);
      const data = await response.json();
      
      if (data.steps) {
        setSuggestions(data.steps.slice(0, 10)); // Limit to 10 suggestions
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  }, [stepType]);

  // Validate step text
  const validateStep = useCallback(async (stepText: string) => {
    if (!stepText.trim()) {
      setValidationResult(null);
      onValidationChange?.(true);
      return;
    }

    setIsValidating(true);
    try {
      const response = await fetch('/api/steps/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: stepText })
      });
      const result = await response.json();
      
      setValidationResult(result);
      onValidationChange?.(result.valid);
    } catch (error) {
      console.error('Error validating step:', error);
      onValidationChange?.(false);
    } finally {
      setIsValidating(false);
    }
  }, [onValidationChange]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Debounced fetch suggestions
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
   fetchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
    
    setShowSuggestions(true);
    
    // Debounced validate
    if (validateTimeoutRef.current) {
      clearTimeout(validateTimeoutRef.current);
    }
    validateTimeoutRef.current = setTimeout(() => {
      validateStep(newValue);
    }, 500);
  };
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      if (validateTimeoutRef.current) clearTimeout(validateTimeoutRef.current);
    };
  }, []);

  // Handle suggestion selection
  const selectSuggestion = (suggestion: StepDefinition) => {
    const stepText = suggestion.example || suggestion.text;
    onChange(stepText);
    setShowSuggestions(false);
    setSuggestions([]);
    validateStep(stepText);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        if (suggestions[selectedIndex]) {
          e.preventDefault();
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions]);

  return (
    <div className="relative">
      {/* Input Field */}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          onBlur={() => {
            // Delay to allow click on suggestions
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            validationResult === null
              ? 'border-gray-300 focus:ring-blue-500'
              : validationResult.valid
              ? 'border-green-500 focus:ring-green-500 bg-green-50'
              : 'border-red-500 focus:ring-red-500 bg-red-50'
          }`}
        />
        
        {/* Validation Indicator */}
        {isValidating && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
        
        {!isValidating && validationResult && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {validationResult.valid ? (
              <span className="text-green-500 text-lg">✓</span>
            ) : (
              <span className="text-red-500 text-lg">✗</span>
            )}
          </div>
        )}
      </div>

      {/* Autocomplete Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onMouseDown={() => selectSuggestion(suggestion)}
              className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                index === selectedIndex ? 'bg-blue-100' : ''
              }`}
            >
              <div className="font-medium text-sm">{suggestion.text}</div>
              {suggestion.example && (
                <div className="text-xs text-gray-500 mt-1">{suggestion.example}</div>
              )}
              <div className="text-xs text-gray-400 mt-1">
                {suggestion.type} • {suggestion.file.replace(/^\.\.\//, '')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Validation Messages */}
      {validationResult && !validationResult.valid && value.trim() && (
        <div className="mt-2">
          {/* Invalid Step Message */}
          <div className="text-sm text-red-600 mb-2">
            ⚠ Step not found in step definitions
          </div>

          {/* Suggestions */}
          {validationResult.suggestions.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="text-sm font-medium text-yellow-800 mb-2">
                Did you mean?
              </div>
              {validationResult.suggestions.slice(0, 3).map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => {
                    onChange(suggestion.text);
                    validateStep(suggestion.text);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer hover:underline mb-1"
                >
                  {suggestion.text}
                  <span className="text-gray-400 ml-2 text-xs">
                    ({suggestion.file.replace(/^\.\.\//, '')})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Valid Step Confirmation */}
      {validationResult && validationResult.valid && value.trim() && (
        <div className="mt-2 text-sm text-green-600 flex items-center gap-2">
          <span>✓</span>
          <span>Step definition found</span>
          {validationResult.matches[0] && (
            <span className="text-gray-400 text-xs">
              ({validationResult.matches[0].file.replace(/^\.\.\//, '')})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
