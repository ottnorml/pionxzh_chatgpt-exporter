import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateUserscriptArtifacts } from '../scripts/validate-userscript.mjs'

const pkg = {
    title: 'ChatGPT Exporter',
    author: 'pionxzh',
    version: '2.36.3',
    license: 'MIT',
    homepage: 'https://github.com/ottnorml/pionxzh_chatgpt-exporter',
    repository: { url: 'https://github.com/ottnorml/pionxzh_chatgpt-exporter.git' },
    bugs: { url: 'https://github.com/ottnorml/pionxzh_chatgpt-exporter/issues' },
}

const header = `// ==UserScript==
// @name         ChatGPT Exporter
// @namespace    pionxzh
// @author       pionxzh
// @version      2.36.3
// @license      MIT
// @homepage     https://github.com/ottnorml/pionxzh_chatgpt-exporter
// @homepageURL  https://github.com/ottnorml/pionxzh_chatgpt-exporter
// @source       https://github.com/ottnorml/pionxzh_chatgpt-exporter.git
// @supportURL   https://github.com/ottnorml/pionxzh_chatgpt-exporter/issues
// @downloadURL  https://raw.githubusercontent.com/ottnorml/pionxzh_chatgpt-exporter/master/dist/chatgpt.user.js
// @updateURL    https://raw.githubusercontent.com/ottnorml/pionxzh_chatgpt-exporter/master/dist/chatgpt.meta.js
// ==/UserScript==`
const script = `${header}\n\n(function () {})()\n`
const meta = `${header}\n`

function errors(userScript = script, metadataScript = meta, packageJson = pkg) {
    return validateUserscriptArtifacts(packageJson, userScript, metadataScript)
}

test('accepts matching artifact headers', () => {
    assert.deepEqual(errors(), [])
})
test('rejects missing metadata output', () => {
    assert.match(errors(script, '')[0], /metadata must start/)
})
test('rejects an incorrect update URL', () => {
    const broken = header.replace('/chatgpt.meta.js', '/wrong.meta.js')
    assert.ok(errors(`${broken}\n\n(function () {})()\n`).some(e => e.includes('@updateURL')))
})
test('rejects missing download URL', () => {
    const broken = header.replace(/^\/\/ @downloadURL.*\n/m, '')
    assert.ok(errors(`${broken}\n\n(function () {})()\n`, `${broken}\n`).some(e => e.includes('@downloadURL')))
})
test('rejects a mismatched version', () => {
    const broken = header.replace('@version      2.36.3', '@version      2.36.4')
    assert.ok(errors(`${broken}\n\n(function () {})()\n`, `${broken}\n`).some(e => e.includes('@version')))
})
test('rejects executable code in metadata', () => {
    assert.ok(errors(script, `${meta}console.log('unexpected')`).some(e => e.includes('contains code')))
})
test('rejects mismatched headers', () => {
    assert.ok(errors(script, meta.replace('@name         ChatGPT Exporter', '@name         Other')).some(e => e.includes('Headers differ')))
})
test('rejects missing executable script code', () => {
    assert.ok(errors(meta, meta).some(e => e.includes('missing executable')))
})
test('rejects inconsistent repository metadata', () => {
    assert.ok(errors(script, meta, { ...pkg, repository: { url: 'https://github.com/other/repo.git' } }).some(e => e.includes('repository.url')))
})
