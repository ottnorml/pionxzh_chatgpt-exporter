import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createTestServer } from './helpers/vite.mjs'

let server

before(async () => {
    server = await createTestServer()
})

after(async () => {
    await server?.close()
})

test('dateStr formats dates as YYYY-MM-DD', async () => {
    const { dateStr } = await server.ssrLoadModule('/src/utils/utils.ts')

    assert.equal(dateStr(new Date(2026, 8, 22)), '2026-09-22')
})

test('jsonlStringify emits one compact JSON object per line', async () => {
    const { jsonlStringify } = await server.ssrLoadModule('/src/utils/utils.ts')

    assert.equal(
        jsonlStringify([{ role: 'user' }, { role: 'assistant' }]),
        '{"role":"user"}\n{"role":"assistant"}',
    )
})
