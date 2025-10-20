/**
 * Local API Smoke Test (no server required)
 * - Imports Next.js route handlers directly and invokes them
 * - Useful in constrained environments without DB/Redis/API keys
 *
 * Run: npx tsx scripts/local-api-smoke.ts
 */

/* eslint-disable no-console */

type TestFn = () => Promise<void>

interface TestCase {
  name: string
  run: TestFn
}

async function getJson(res: Response): Promise<any> {
  try {
    return await res.json()
  } catch {
    const text = await res.text()
    return { _raw: text }
  }
}

async function run(name: string, fn: TestFn) {
  const start = Date.now()
  try {
    await fn()
    console.log(`✔ ${name} (${Date.now() - start}ms)`) 
    return { name, ok: true }
  } catch (err) {
    console.error(`✖ ${name} failed:`, (err as Error)?.message || err)
    return { name, ok: false, err }
  }
}

async function main() {
  const tests: TestCase[] = []

  // /api/health
  tests.push({
    name: 'GET /api/health handler executes',
    run: async () => {
      const mod = await import('../src/app/api/health/route')
      // Create a NextRequest-like object for testing
      const mockRequest = {
        url: 'http://local/api/health',
        method: 'GET',
        headers: new Headers(),
        nextUrl: new URL('http://local/api/health'),
        cookies: new Map(),
        geo: {},
        ip: '127.0.0.1'
      } as any
      const res: Response = await mod.GET(mockRequest)
      const data = await getJson(res)
      if (!('status' in data)) throw new Error('missing status in response')
      // Expect unhealthy/degraded in local env without DB/Redis, but handler should still respond
      if (![200, 503].includes(res.status)) throw new Error(`unexpected status ${res.status}`)
    },
  })

  // /api/v1/health
  tests.push({
    name: 'GET /api/v1/health handler executes',
    run: async () => {
      const mod = await import('../src/app/api/v1/health/route')
      const res: Response = await mod.GET()
      const data = await getJson(res)
      if (!('version' in data)) throw new Error('missing version in response')
      if (res.headers.get('X-API-Version') !== 'v1') throw new Error('missing X-API-Version header')
    },
  })

  // /api/csrf
  tests.push({
    name: 'GET /api/csrf returns token',
    run: async () => {
      const mod = await import('../src/app/api/csrf/route')
      const res: Response = await mod.GET()
      const data = await getJson(res)
      if (!data?.token) throw new Error('no CSRF token returned')
    },
  })

  // /api/providers/health (keys likely missing; should still respond with object)
  tests.push({
    name: 'GET /api/providers/health handler executes',
    run: async () => {
      const mod = await import('../src/app/api/providers/health/route')
      const res: Response = await mod.GET()
      const data = await getJson(res)
      if (!('providers' in data)) throw new Error('missing providers in response')
    },
  })

  const results = []
  for (const t of tests) {
    results.push(await run(t.name, t.run))
  }

  const passed = results.filter(r => r.ok).length
  const failed = results.length - passed
  console.log(`\nSummary: ${passed} passed, ${failed} failed`)
  if (failed > 0) process.exitCode = 1
}

main().catch((e) => {
  console.error('Smoke test crashed:', e)
  process.exitCode = 1
})

// Make this file a module to avoid global scope conflicts
export {}
