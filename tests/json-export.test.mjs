import assert from 'node:assert/strict'
import { after, before, beforeEach, test } from 'node:test'
import { createTestServer } from './helpers/vite.mjs'

let server

before(async () => {
    server = await createTestServer({
        '../api': `
            export async function fetchConversation() {
                return globalThis.__rawConversation
            }
            export async function getCurrentChatId() {
                return 'chat-id'
            }
            export function processConversation() {
                throw new Error('raw JSON export must not call processConversation')
            }
        `,
        '../i18n': `
            export default {
                t(value) {
                    return value
                },
            }
        `,
        '../page': `
            export function checkIfConversationStarted() {
                return true
            }
        `,
        '../temporaryChat': `
            export function checkIfTemporaryChatIsExportable() {
                return true
            }
        `,
        '../utils/conversion': `
            export function convertToOoba() {
                return ''
            }
            export function convertToTavern() {
                return ''
            }
        `,
        '../utils/download': `
            export function buildJsonBatchFileName() {
                return 'conversations.json'
            }
            export function buildZipFileName() {
                return 'conversations.zip'
            }
            export function getFileNameWithFormat() {
                return 'conversation.json'
            }
            export function downloadFile(...args) {
                globalThis.__downloaded = args
            }
        `,
    })
})

after(async () => {
    await server?.close()
    delete globalThis.__rawConversation
    delete globalThis.__downloaded
})

beforeEach(() => {
    globalThis.__rawConversation = {
        id: 'chat-id',
        title: 'Raw conversation',
        create_time: 1,
        update_time: 2,
        current_node: 'assistant-2',
        mapping: {
            'assistant-1': {
                id: 'assistant-1',
                parent: 'root',
                children: ['assistant-2'],
                message: {
                    author: { role: 'assistant' },
                    recipient: 'all',
                    content: {
                        content_type: 'text',
                        parts: ['First'],
                    },
                },
            },
            'assistant-2': {
                id: 'assistant-2',
                parent: 'assistant-1',
                children: [],
                message: {
                    author: { role: 'assistant' },
                    recipient: 'all',
                    content: {
                        content_type: 'text',
                        parts: [' continuation'],
                    },
                },
            },
        },
    }
    globalThis.__downloaded = null
})

test('single JSON export serializes the untouched raw conversation', async () => {
    const { exportToJson } = await server.ssrLoadModule('/src/exporter/json.ts')
    const expected = structuredClone(globalThis.__rawConversation)

    await exportToJson('{title}')

    assert.deepEqual(globalThis.__rawConversation, expected)
    assert.equal(globalThis.__downloaded[1], 'application/json')
    assert.deepEqual(
        JSON.parse(globalThis.__downloaded[2]),
        [expected],
    )
})

test('JSON ZIP export does not process raw conversations before archiving', async () => {
    const { exportAllToJson } = await server.ssrLoadModule('/src/exporter/json.ts')
    const expected = structuredClone(globalThis.__rawConversation)

    await exportAllToJson('{title}', [globalThis.__rawConversation])

    assert.deepEqual(globalThis.__rawConversation, expected)
    assert.equal(globalThis.__downloaded[1], 'application/zip')
})
