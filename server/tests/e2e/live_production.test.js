const test = require('node:test');
const assert = require('node:assert');

test('Live Production Resources Health & Response Tests', async (t) => {
  const domains = [
    { name: 'Gateway Landing', url: 'https://scholarhubhpu.in' },
    { name: 'Scholar Sync Frontend', url: 'https://sync.scholarhubhpu.in' },
    { name: 'Scholar Track Frontend', url: 'https://track.scholarhubhpu.in' },
    { name: 'Production API Backend', url: 'https://server.scholarhubhpu.in/api/health' }
  ];

  for (const domain of domains) {
    await t.test(`Ping ${domain.name} (${domain.url})`, async () => {
      try {
        const response = await fetch(domain.url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TestRunner'
          }
        });
        
        console.log(`📡 Hitting ${domain.url} -> Status: ${response.status} ${response.statusText}`);
        assert.ok(response.status >= 200 && response.status < 400, `Expected 2xx or 3xx status, got ${response.status}`);
        
        const bodyText = await response.text();
        if (domain.url.includes('/api/health')) {
          assert.strictEqual(bodyText, 'Server is awake', `Expected "Server is awake" response body, got "${bodyText}"`);
        } else {
          const contentType = response.headers.get('content-type') || '';
          assert.ok(contentType.includes('text/html') || contentType.includes('application/json'), `Expected HTML or JSON, got ${contentType}`);
        }
      } catch (err) {
        assert.fail(`Failed to connect to ${domain.url}: ${err.message}`);
      }
    });
  }
});
