import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const stepsDir = path.join(process.cwd(), '..', 'src', 'steps');
    const stepDefinitions: any[] = [];

    async function scanDirectory(dir: string, priority: string) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.isFile() && entry.name.endsWith('.steps.ts')) {
            const filePath = path.join(dir, entry.name);
            const content = await fs.readFile(filePath, 'utf-8');
            
            // Parse step definitions from file
            const steps = parseStepDefinitions(content, filePath, priority);
            stepDefinitions.push(...steps);
          } else if (entry.isDirectory()) {
            await scanDirectory(path.join(dir, entry.name), entry.name);
          }
        }
      } catch (error) {
        console.error(`Error scanning directory ${dir}:`, error);
      }
    }

    await scanDirectory(stepsDir, 'p0');

    return NextResponse.json({
      count: stepDefinitions.length,
      stepDefinitions
    });
  } catch (error) {
    console.error('Error listing step definitions:', error);
    return NextResponse.json(
      { error: 'Failed to list step definitions' },
      { status: 500 }
    );
  }
}

function parseStepDefinitions(content: string, filePath: string, priority: string) {
  const steps: any[] = [];
  const stepRegex = /(Given|When|Then|And|But)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  
  let match;
  while ((match = stepRegex.exec(content)) !== null) {
    const keyword = match[1];
    const pattern = match[2];
    
    // Extract function body (simplified - just get the line)
    const startIndex = match.index;
    const functionStart = content.indexOf('async function', startIndex);
    if (functionStart === -1) continue;
    
    const functionEnd = content.indexOf('});', functionStart);
    if (functionEnd === -1) continue;
    
    const functionBody = content.substring(functionStart, functionEnd);
    
    steps.push({
      keyword,
      pattern,
      filePath: path.relative(path.join(process.cwd(), '..'), filePath),
      priority,
      hasParameters: pattern.includes('{string}') || pattern.includes('{int}'),
      editable: true
    });
  }
  
  return steps;
}

export async function POST(request: NextRequest) {
  try {
    const { keyword, pattern, actions, priority, filePath: targetFile } = await request.json();

    if (!keyword || !pattern || !actions || actions.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: keyword, pattern, actions' },
        { status: 400 }
      );
    }

    const stepsDir = path.join(process.cwd(), '..', 'src', 'steps', priority || 'p0');
    await fs.mkdir(stepsDir, { recursive: true });

    // Generate file name from pattern
    const fileName = targetFile || generateFileName(pattern);
    const fullPath = path.join(stepsDir, fileName);

    // Generate step definition code
    const code = generateStepDefinitionCode(keyword, pattern, actions);

    // Check if file exists
    let existingContent = '';
    try {
      existingContent = await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      // File doesn't exist, create new with imports
      existingContent = generateFileTemplate();
    }

    // Append new step definition
    const updatedContent = appendStepDefinition(existingContent, code);
    
    await fs.writeFile(fullPath, updatedContent, 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Step definition created successfully',
      filePath: path.relative(path.join(process.cwd(), '..'), fullPath)
    });

  } catch (error) {
    console.error('Error creating step definition:', error);
    return NextResponse.json(
      { error: 'Failed to create step definition', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function generateFileName(pattern: string): string {
  // Convert pattern to file name (e.g., "I click {string}" -> "click.steps.ts")
  const clean = pattern.toLowerCase()
    .replace(/\{string\}/g, '')
    .replace(/\{int\}/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(word => !['i', 'a', 'an', 'the', 'should', 'be'].includes(word))
    .slice(0, 3)
    .join('-');
  
  return `${clean}.steps.ts`;
}

function generateFileTemplate(): string {
  return `import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { Logger } from '../../utils/Logger.js';

const logger = new Logger('CustomSteps');

`;
}

function generateStepDefinitionCode(keyword: string, pattern: string, actions: any[]): string {
  // Parse parameters from pattern
  const params: string[] = [];
  let paramIndex = 0;
  const paramNames: string[] = [];
  
  pattern.replace(/\{string\}/g, () => {
    const paramName = `param${paramIndex++}`;
    params.push(`${paramName}: string`);
    paramNames.push(paramName);
    return '';
  });
  
  pattern.replace(/\{int\}/g, () => {
    const paramName = `param${paramIndex++}`;
    params.push(`${paramName}: number`);
    paramNames.push(paramName);
    return '';
  });

  const paramsSignature = params.length > 0 ? `, ${params.join(', ')}` : '';
  
  // Helper function to wrap value in quotes if it's not a parameter reference
  const wrapValue = (value: string) => {
    // If it's a parameter reference (param0, param1, etc.), don't quote it
    if (/^param\d+$/.test(value)) {
      return value;
    }
    // Otherwise, wrap in quotes (it's a literal string)
    return `'${value}'`;
  };
  
  // Generate action code
  const actionCode = actions.map((action: any, index: number) => {
    const indent = '  ';
    let code = '';
    
    if (action.log) {
      code += `${indent}logger.info('${action.log}');\n`;
    }
    
    switch (action.type) {
      case 'click':
        code += `${indent}await this.page.click(${wrapValue(action.selector)});\n`;
        break;
      case 'fill':
        code += `${indent}await this.page.fill(${wrapValue(action.selector)}, ${wrapValue(action.value)});\n`;
        break;
      case 'navigate':
        code += `${indent}await this.page.goto(${wrapValue(action.url)});\n`;
        break;
      case 'wait':
        code += `${indent}await this.page.waitForTimeout(${action.duration || 1000});\n`;
        break;
      case 'waitForSelector':
        code += `${indent}await this.page.waitForSelector(${wrapValue(action.selector)});\n`;
        break;
      case 'expect':
        code += `${indent}const element = await this.page.locator(${wrapValue(action.selector)}).textContent();\n`;
        code += `${indent}expect(element).toContain(${wrapValue(action.expected)});\n`;
        break;
      case 'custom':
        code += `${indent}${action.code}\n`;
        break;
    }
    
    return code;
  }).join('\n');

  return `
${keyword}('${pattern}'${paramsSignature ? `, async function (${paramsSignature.substring(2)})` : ', async function ()'} {
${actionCode}});

`;
}

function appendStepDefinition(existingContent: string, newCode: string): string {
  // Remove trailing whitespace and ensure proper spacing
  const trimmed = existingContent.trim();
  return trimmed + '\n' + newCode;
}
