import { createServer } from 'vite'

const MOCK_PREFIX = '\0test-mock:'

function createMockPlugin(mocks) {
    return {
        name: 'test-module-mocks',
        enforce: 'pre',
        resolveId(source) {
            if (Object.hasOwn(mocks, source)) {
                return `${MOCK_PREFIX}${encodeURIComponent(source)}`
            }
            return null
        },
        load(id) {
            if (!id.startsWith(MOCK_PREFIX)) return null
            const source = decodeURIComponent(id.slice(MOCK_PREFIX.length))
            return mocks[source]
        },
    }
}

export function createTestServer(mocks = {}) {
    return createServer({
        appType: 'custom',
        configFile: false,
        logLevel: 'silent',
        plugins: [createMockPlugin(mocks)],
        server: {
            middlewareMode: true,
        },
    })
}
