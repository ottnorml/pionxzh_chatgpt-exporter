import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createTestServer } from './helpers/vite.mjs'

let server

before(async () => {
    server = await createTestServer({
        '../api': `
            export function shouldSkipMessageInExport() {
                return false
            }
        `,
    })
})

after(async () => {
    await server?.close()
})

test('Ooba export preserves all text content parts', async () => {
    const { convertToOoba } = await server.ssrLoadModule('/src/utils/conversion.ts')

    const conversation = {
        conversationNodes: [
            {
                id: 'user',
                message: {
                    author: { role: 'user' },
                    content: {
                        content_type: 'text',
                        parts: ['first user part', 'second user part'],
                    },
                },
            },
            {
                id: 'assistant',
                message: {
                    author: { role: 'assistant' },
                    content: {
                        content_type: 'text',
                        parts: ['first assistant part', 'second assistant part'],
                    },
                },
            },
        ],
    }

    const result = JSON.parse(convertToOoba(conversation))

    assert.deepEqual(result.internal, [
        [
            'first user part\nsecond user part',
            'first assistant part\nsecond assistant part',
        ],
    ])
    assert.deepEqual(result.visible, result.internal)
})
