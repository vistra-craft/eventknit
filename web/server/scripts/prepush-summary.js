import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const results = {
  prisma: { passed: false, errors: [] },
  lint: { passed: false, errors: [], files: [] },
  typeCheck: { passed: false, errors: [], files: [] },
  tests: { passed: false, errors: [], failedTests: [], files: [] },
  build: { passed: false, errors: [], files: [] },
};

function runCommand(command, stepName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${stepName}`);
  console.log('='.repeat(60));
  
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    
    // Use shell: true to handle npm commands properly
    // When shell is true, we can pass command as a string
    const child = spawn(command, [], {
      cwd: rootDir,
      shell: true,
      stdio: ['inherit', 'pipe', 'pipe'], // stdin inherit, stdout/stderr pipe to capture
    });
    
    // Show output in real-time and capture it
    child.stdout.on('data', (data) => {
      const text = data.toString();
      process.stdout.write(text); // Show in real-time
      stdout += text; // Also capture
    });
    
    child.stderr.on('data', (data) => {
      const text = data.toString();
      process.stderr.write(text); // Show in real-time
      stderr += text; // Also capture
    });
    
    child.on('close', (code) => {
      const combinedOutput = stdout + stderr;
      if (code === 0) {
        resolve({ success: true, output: combinedOutput });
      } else {
        resolve({ 
          success: false, 
          output: combinedOutput, 
          error: { code, stdout, stderr }
        });
      }
    });
    
    child.on('error', (error) => {
      resolve({ 
        success: false, 
        output: stderr || error.message, 
        error: { error, stdout, stderr }
      });
    });
  });
}

// Main execution function
async function runAllChecks() {
  // Step 1: Prisma Generate
  const prismaResult = await runCommand('npm run prisma:generate', 'Prisma Generate');
  results.prisma.passed = prismaResult.success;
  if (!prismaResult.success) {
    results.prisma.errors.push(prismaResult.output);
  }

  // Step 2: Lint
  const lintResult = await runCommand('npm run lint', 'ESLint');
  results.lint.passed = lintResult.success;
  if (!lintResult.success) {
    // Extract file names from ESLint output
    const lintOutput = lintResult.output || lintResult.error?.stdout || lintResult.error?.stderr || '';
    const fileMatches = lintOutput.match(/([^\s]+\.ts)/g);
    if (fileMatches) {
      results.lint.files = [...new Set(fileMatches)];
    }
    results.lint.errors.push(lintOutput);
  }

  // Step 3: Type Check
  const typeCheckResult = await runCommand('npm run type-check', 'TypeScript Type Check');
  results.typeCheck.passed = typeCheckResult.success;
  if (!typeCheckResult.success) {
    // Extract file names from TypeScript output
    const tsOutput = typeCheckResult.output || typeCheckResult.error?.stdout || typeCheckResult.error?.stderr || '';
    const fileMatches = tsOutput.match(/([^\s]+\.ts)/g);
    if (fileMatches) {
      results.typeCheck.files = [...new Set(fileMatches)];
    }
    results.typeCheck.errors.push(tsOutput);
  }

  // Step 4: Tests
  const testResult = await runCommand('npm run test:run', 'Jest Tests');
  results.tests.passed = testResult.success;
  if (!testResult.success) {
    // Extract failed test names from Jest output (check both stdout and stderr)
    const stdout = testResult.error?.stdout || '';
    const stderr = testResult.error?.stderr || '';
    const testOutput = testResult.output || stdout || stderr || '';
  
  // Parse Jest output line by line to extract failed test descriptions
  const lines = testOutput.split('\n');
  let currentTest = null;
  let inErrorBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Match failed test pattern: ✕ suite name › test description
    // Examples: "✕ updatePreferences › should force SMS to be disabled even if provided"
    // Or: "✕ UserPreferencesService › updatePreferences › should force SMS to be disabled"
    const failedTestMatch = line.match(/✕\s+(.+?)(?:\s+\(.+\))?$/);
    if (failedTestMatch) {
      const testDescription = failedTestMatch[1].trim();
      // Clean up any trailing characters, timing info, or formatting
      const cleanDescription = testDescription
        .replace(/\s+/g, ' ')
        .replace(/\s*\(.+?\)\s*$/, '') // Remove timing like (123ms)
        .trim();
      if (cleanDescription && !results.tests.failedTests.includes(cleanDescription)) {
        results.tests.failedTests.push(cleanDescription);
      }
      currentTest = cleanDescription;
      inErrorBlock = true;
      continue;
    }
    
    // Also match alternative formats
    // Pattern: "FAIL suite › test"
    const failPatternMatch = line.match(/FAIL\s+(.+)/);
    if (failPatternMatch) {
      const testDescription = failPatternMatch[1].trim();
      if (testDescription && !results.tests.failedTests.includes(testDescription)) {
        results.tests.failedTests.push(testDescription);
      }
    }
    
    // Match test descriptions in error blocks (sometimes Jest shows them differently)
    // Look for lines that contain "›" which is Jest's separator
    if (line.includes('›') && !line.match(/✕/) && !line.match(/at\s+/)) {
      // This might be a continuation or alternative format
      const testDescMatch = line.match(/(.+?›.+?)(?:\s+\(.+\))?$/);
      if (testDescMatch) {
        const testDescription = testDescMatch[1]
          .trim()
          .replace(/\s*\(.+?\)\s*$/, '') // Remove timing
          .trim();
        if (testDescription && !results.tests.failedTests.includes(testDescription)) {
          results.tests.failedTests.push(testDescription);
        }
      }
    }
    
    // Look for test names in error messages (sometimes they appear in expect() failures)
    // Pattern: "Expected ... in test: suite › test"
    if (inErrorBlock && line.includes('›') && line.match(/Expected|Received|Error/)) {
      const errorTestMatch = line.match(/([^\n]+?›[^\n]+?)(?:\s+Expected|\s+Received|\s+Error|$)/);
      if (errorTestMatch) {
        const testDescription = errorTestMatch[1].trim();
        if (testDescription && testDescription.includes('›') && 
            !results.tests.failedTests.includes(testDescription)) {
          results.tests.failedTests.push(testDescription);
        }
      }
    }
    
    // Reset error block flag when we see a new test or summary
    if (line.match(/PASS|FAIL|Test Suites:|Tests:/) && !line.match(/✕/)) {
      inErrorBlock = false;
    }
  }
  
  // Extract test file names with failures
  const filePatterns = [
    /(tests\/[^\s]+\.(test|spec)\.ts)/g,
    /([^\s]+\.test\.ts)/g,
    /([^\s]+\.spec\.ts)/g,
  ];
  
  for (const pattern of filePatterns) {
    const fileMatches = testOutput.match(pattern);
    if (fileMatches) {
      results.tests.files.push(...fileMatches);
    }
  }
  
  // Remove duplicates
  results.tests.files = [...new Set(results.tests.files)];
  results.tests.failedTests = [...new Set(results.tests.failedTests)];
  
  // Extract summary stats
  const suiteMatch = testOutput.match(/Test Suites:.*?(\d+)\s+failed/);
  const testMatch = testOutput.match(/Tests:.*?(\d+)\s+failed/);
  if (suiteMatch || testMatch) {
    results.tests.summary = `Failed: ${suiteMatch?.[1] || 0} suites, ${testMatch?.[1] || 0} tests`;
  }
  
    results.tests.errors.push(testOutput);
  }

  // Step 5: Build
  const buildResult = await runCommand('npm run build', 'TypeScript Build');
  results.build.passed = buildResult.success;
  if (!buildResult.success) {
    // Extract file names from build output
    const buildOutput = buildResult.output || buildResult.error?.stdout || buildResult.error?.stderr || '';
    const fileMatches = buildOutput.match(/(src\/[^\s]+\.ts)/g);
    if (fileMatches) {
      results.build.files = [...new Set(fileMatches)];
    }
    results.build.errors.push(buildOutput);
  }

  // Print Summary
  console.log('\n\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    PRE-PUSH SUMMARY                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  const allPassed = Object.values(results).every(r => r.passed);

  if (allPassed) {
    console.log('✅ All checks passed! Ready to push.');
    console.log('');
    process.exit(0);
  } else {
    console.log('❌ Some checks failed. Please fix the following:\n');
    
    // Prisma
    if (!results.prisma.passed) {
      console.log('🔴 Prisma Generate: FAILED');
      console.log('   Errors:', results.prisma.errors[0]?.split('\n')[0] || 'Unknown error');
      console.log('');
    } else {
      console.log('✅ Prisma Generate: PASSED');
    }
    
    // Lint
    if (!results.lint.passed) {
      console.log('🔴 ESLint: FAILED');
      if (results.lint.files.length > 0) {
        console.log(`   Files with errors (${results.lint.files.length}):`);
        results.lint.files.slice(0, 10).forEach(file => {
          console.log(`   - ${file}`);
        });
        if (results.lint.files.length > 10) {
          console.log(`   ... and ${results.lint.files.length - 10} more files`);
        }
      }
      console.log('');
    } else {
      console.log('✅ ESLint: PASSED');
    }
    
    // Type Check
    if (!results.typeCheck.passed) {
      console.log('🔴 TypeScript Type Check: FAILED');
      if (results.typeCheck.files.length > 0) {
        console.log(`   Files with type errors (${results.typeCheck.files.length}):`);
        results.typeCheck.files.slice(0, 10).forEach(file => {
          console.log(`   - ${file}`);
        });
        if (results.typeCheck.files.length > 10) {
          console.log(`   ... and ${results.typeCheck.files.length - 10} more files`);
        }
      }
      console.log('');
    } else {
      console.log('✅ TypeScript Type Check: PASSED');
    }
    
    // Tests
    if (!results.tests.passed) {
      console.log('🔴 Jest Tests: FAILED');
      if (results.tests.summary) {
        console.log(`   ${results.tests.summary}`);
      }
      
      // Show failed test descriptions (this is what the user wants to see)
      if (results.tests.failedTests.length > 0) {
        console.log(`\n   Failed Test Cases (${results.tests.failedTests.length}):`);
        results.tests.failedTests.forEach((test, index) => {
          console.log(`   ${index + 1}. ${test}`);
        });
      }
      
      // Show test files with failures
      if (results.tests.files.length > 0) {
        console.log(`\n   Test Files with Failures (${results.tests.files.length}):`);
        results.tests.files.slice(0, 15).forEach(file => {
          console.log(`   - ${file}`);
        });
        if (results.tests.files.length > 15) {
          console.log(`   ... and ${results.tests.files.length - 15} more test files`);
        }
      }
      console.log('');
    } else {
      console.log('✅ Jest Tests: PASSED');
    }
    
    // Build
    if (!results.build.passed) {
      console.log('🔴 TypeScript Build: FAILED');
      if (results.build.files.length > 0) {
        console.log(`   Files with build errors (${results.build.files.length}):`);
        results.build.files.slice(0, 10).forEach(file => {
          console.log(`   - ${file}`);
        });
        if (results.build.files.length > 10) {
          console.log(`   ... and ${results.build.files.length - 10} more files`);
        }
      }
      console.log('');
    } else {
      console.log('✅ TypeScript Build: PASSED');
    }
    
    console.log('');
    console.log('💡 Quick Fix Commands:');
    console.log('   - Fix linting: npm run lint:fix');
    console.log('   - Run tests: npm run test');
    console.log('   - Check types: npm run type-check');
    console.log('');
    
    process.exit(1);
  }
}

// Run all checks
runAllChecks().catch((error) => {
  console.error('Error running checks:', error);
  process.exit(1);
});

