/**
 * Security integration tests for Vite dev server
 * Tests for CVE fixes in server.fs.deny bypass vulnerabilities
 */

const DEV_SERVER_URL = 'http://localhost:8080';

// Known vulnerability patterns that should be blocked
const VULNERABLE_PATTERNS = [
  // CVE: bypassed with `/. `
  '/.env',
  '/./package.json',
  '/./node_modules/react/package.json',
  
  // CVE: invalid request-target
  '/@fs/../package.json',
  '/@fs/./package.json',
  
  // CVE: .svg/relative paths  
  '/logo.svg/../package.json',
  '/assets/../package.json',
  
  // CVE: ?import query bypass
  '/package.json?import',
  '/.env?import',
  
  // CVE: ?raw query bypass
  '/package.json?raw',
  '/.env?raw',
  '/package.json?raw&import',
  
  // Additional path traversal patterns
  '/../package.json',
  '/../../package.json',
  '/%2e%2e/package.json',
  '/%2e%2e%2fpackage.json'
];

/**
 * Test that vulnerable patterns return 403/404 instead of exposing files
 */
export async function testViteSecurityPatterns(): Promise<boolean> {
  let allTestsPassed = true;
  
  for (const pattern of VULNERABLE_PATTERNS) {
    try {
      const response = await fetch(`${DEV_SERVER_URL}${pattern}`);
      
      // These patterns should be blocked (403, 404, or 500)
      if (response.status === 200) {
        console.error(`❌ Security test failed: ${pattern} returned 200 (should be blocked)`);
        allTestsPassed = false;
      } else {
        console.log(`✅ Security test passed: ${pattern} blocked with status ${response.status}`);
      }
    } catch (error) {
      // Network errors are acceptable for security tests
      console.log(`✅ Security test passed: ${pattern} blocked (network error)`);
    }
  }
  
  return allTestsPassed;
}

/**
 * Test that legitimate requests still work
 */
export async function testLegitimateRequests(): Promise<boolean> {
  const legitimatePatterns = [
    '/',
    '/index.html',
    '/src/main.tsx',
    '/src/App.tsx'
  ];
  
  let allTestsPassed = true;
  
  for (const pattern of legitimatePatterns) {
    try {
      const response = await fetch(`${DEV_SERVER_URL}${pattern}`);
      
      if (response.status !== 200 && response.status !== 304) {
        console.error(`❌ Legitimate request failed: ${pattern} returned ${response.status}`);
        allTestsPassed = false;
      } else {
        console.log(`✅ Legitimate request passed: ${pattern}`);
      }
    } catch (error) {
      console.error(`❌ Legitimate request failed: ${pattern}`, error);
      allTestsPassed = false;
    }
  }
  
  return allTestsPassed;
}

// Export test runner for CI
export async function runSecurityTests(): Promise<void> {
  console.log('🔒 Running Vite security tests...');
  
  const securityTestsPass = await testViteSecurityPatterns();
  const legitimateTestsPass = await testLegitimateRequests();
  
  if (securityTestsPass && legitimateTestsPass) {
    console.log('🎉 All security tests passed!');
    process.exit(0);
  } else {
    console.error('❌ Some security tests failed!');
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runSecurityTests();
}