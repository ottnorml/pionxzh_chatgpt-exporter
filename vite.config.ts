import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'
import monkey, { cdn } from 'vite-plugin-monkey'
import packageJson from './package.json' with { type: 'json' }

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        preact({
            devToolsEnabled: false,
            devtoolsInProd: false,
        }),
        monkey({
            entry: 'src/main.tsx',
            userscript: {
                'name': {
                    '': packageJson.title,
                    'zh-CN': packageJson['title:zh-CN'],
                    'zh-TW': packageJson['title:zh-TW'],
                },
                'author': packageJson.author,
                'namespace': packageJson.author,
                'description': {
                    '': packageJson.description,
                    'zh-CN': packageJson['description:zh-CN'],
                    'zh-TW': packageJson['description:zh-TW'],
                },
                'license': packageJson.license,
                // ChatGPT is a SPA. Load on every same-origin route so the
                // exporter can mount/unmount itself when navigation crosses
                // between supported and unsupported paths without a reload.
                'match': [
                    'https://chat.openai.com/*',
                    'https://chatgpt.com/*',
                ],
                'icon': 'https://chatgpt.com/favicon.ico',
                'run-at': 'document-end',
            },
            build: {
                fileName: 'chatgpt.user.js',
                externalGlobals: [
                    ['jszip', cdn.jsdelivr('JSZip', 'dist/jszip.min.js')],
                    // SnapDOM's IIFE exposes its named export as window.snapdom.
                    ['@zumer/snapdom', cdn.jsdelivr('window', 'dist/snapdom.js')],
                ],
                // Serialized into the bundle and run in the page, so it must be self-contained.
                cssSideEffects: (css: string) => {
                    const o = document.createElement('style')
                    o.textContent = css
                    document.head.append(o)
                    setInterval(() => {
                        if (o.isConnected) return
                        document.head.append(o)
                    }, 300)
                },
            },
            server: {
                open: true,
            },
        }),
    ],
    build: {
        cssMinify: false,
    },
})
