/**
 * /api/features
 * List all .feature files from src/features directory
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface FeatureFileMeta {
  id: string;
  path: string;
  name: string;
  directory: string;
  size: number;
  modified: string;
}

async function scanFeatureFiles(dir: string, baseDir: string = dir): Promise<FeatureFileMeta[]> {
  const files: FeatureFileMeta[] = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        const subFiles = await scanFeatureFiles(fullPath, baseDir);
        files.push(...subFiles);
      } else if (entry.name.endsWith('.feature')) {
        // Get file stats
        const stats = await fs.stat(fullPath);
        const relativePath = path.relative(baseDir, fullPath);
        const directory = path.dirname(relativePath);

        files.push({
          id: relativePath.replace(/\\/g, '/'), // Use relative path as ID
          path: relativePath.replace(/\\/g, '/'),
          name: entry.name,
          directory: directory === '.' ? '' : directory,
          size: stats.size,
          modified: stats.mtime.toISOString()
        });
      }
    }
  } catch (error) {
    console.error('Error scanning directory:', error);
  }

  return files;
}

export async function GET(request: NextRequest) {
  try {
    // Get features directory path (relative to project root)
    const featuresDir = path.join(process.cwd(), '..', 'src', 'features');

    // Check if directory exists
    try {
      await fs.access(featuresDir);
    } catch {
      return NextResponse.json(
        { error: 'Features directory not found', path: featuresDir },
        { status: 404 }
      );
    }

    // Scan all .feature files
    const files = await scanFeatureFiles(featuresDir);

    // Sort by path
    files.sort((a, b) => a.path.localeCompare(b.path));

    return NextResponse.json({
      count: files.length,
      files
    });
  } catch (error) {
    console.error('Error listing feature files:', error);
    return NextResponse.json(
      { error: 'Failed to list feature files', details: String(error) },
      { status: 500 }
    );
  }
}
