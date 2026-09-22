import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createTestServer } from './helpers/vite.mjs'

let server

before(async () => {
    globalThis.document = {
        documentElement: {
            lang: 'en',
        },
    }

    globalThis.__htmlConversation = {
        id: 'chat-id',
        title: 'Metadata test',
        model: 'GPT-5',
        modelSlug: 'gpt-5-2',
        createTime: 1,
        updateTime: 2,
        conversationNodes: [],
    }

    server = await createTestServer({
        '../api': `
            export async function fetchConversation() {
                return {}
            }
            export async function getCurrentChatId() {
                return 'chat-id'
            }
            export function processConversation() {
                return globalThis.__htmlConversation
            }
            export function shouldSkipMessageInExport() {
                return false
            }
        `,
        '../constants': `
            export const KEY_SOURCES_ENABLED = 'sources'
            export const KEY_THINKING_ENABLED = 'thinking'
            export const KEY_TIMESTAMP_24H = 'timestamp-24h'
            export const KEY_TIMESTAMP_ENABLED = 'timestamp-enabled'
            export const KEY_TIMESTAMP_HTML = 'timestamp-html'
            export const baseUrl = 'https://chatgpt.com'
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
            export async function getUserAvatar() {
                return ''
            }
        `,
        '../temporaryChat': `
            export function checkIfTemporaryChatIsExportable() {
                return true
            }
        `,
        '../utils/citations': `
            export function transformContentReferences(value) {
                return value
            }
        `,
        '../utils/download': `
            export function buildZipFileName() {
                return 'conversations.zip'
            }
            export function getFileNameWithFormat() {
                return 'conversation.html'
            }
            export function downloadFile(...args) {
                globalThis.__downloaded = args
            }
        `,
        '../utils/markdown': `
            export function fromMarkdown(value) {
                return value
            }
            export function toHtml(value) {
                return value
            }
        `,
        '../utils/storage': `
            export const ScriptStorage = {
                get() {
                    return false
                },
            }
        `,
        '../utils/text': `
            export function standardizeLineBreaks(value) {
                return value
            }
        `,
        '../utils/utils': `
            export function dateStr() {
                return '2026-09-22'
            }
            export function getColorScheme() {
                return 'light'
            }
            export function timestamp() {
                return '2026-09-22T10-00-00'
            }
            export function unixTimestampToISOString(value) {
                return String(value)
            }
        `,
    })
})

after(async () => {
    await server?.close()
    delete globalThis.document
    delete globalThis.__htmlConversation
    delete globalThis.__downloaded
})

test('HTML export replaces the documented model_name metadata variable', async () => {
    const { exportToHtml } = await server.ssrLoadModule('/src/exporter/html.ts')

    await exportToHtml('{title}', [
        {
            name: 'Model slug',
            value: '{model_name}',
        },
    ])

    assert.equal(globalThis.__downloaded[1], 'text/html')

    const html = globalThis.__downloaded[2]
    assert.match(html, /<div>gpt-5-2<\/div>/)
    assert.doesNotMatch(html, /\{model_name\}/)
})
