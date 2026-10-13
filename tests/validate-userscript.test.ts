import { describe, expect, it } from 'vitest'
import { validateUserscriptArtifacts } from '../scripts/validate-userscript.mjs'

const pkg = {
    version: '2.36.3',
    homepage: 'https://github.com/ottnorml/pionxzh_chatgpt-exporter',
}
const raw = 'https://raw.githubusercontent.com/ottnorml/pionxzh_chatgpt-exporter/master/dist'
const header = `// ==UserScript==
// @version      2.36.3
// @downloadURL  ${raw}/chatgpt.user.js
// @updateURL    ${raw}/chatgpt.meta.js
// ==/UserScript==`
const user = `${header}\n\nconsole.log('userscript')\n`
const meta = `${header}\n`

describe('userscript artifact validation', () => {
    it('accepts matching headers and fork update URLs', () => {
        expect(validateUserscriptArtifacts(pkg, user, meta)).toEqual([])
    })

    it('rejects mismatched headers', () => {
        expect(validateUserscriptArtifacts(pkg, user, meta.replace('2.36.3', '2.36.4')))
            .toContain('Userscript and metadata headers differ')
    })

    it('rejects version or update URL drift', () => {
        expect(validateUserscriptArtifacts({ ...pkg, version: '2.36.4' }, user, meta).join(' '))
            .toContain('@version')
        expect(validateUserscriptArtifacts(pkg, user, meta.replace('/chatgpt.meta.js', '/old.meta.js')).join(' '))
            .toContain('@updateURL')
        expect(validateUserscriptArtifacts(pkg, user, meta.replace('/chatgpt.user.js', '/old.user.js')).join(' '))
            .toContain('@downloadURL')
    })

    it('rejects executable code in the metadata file', () => {
        expect(validateUserscriptArtifacts(pkg, user, `${meta}console.log('unexpected')`))
            .toContain('chatgpt.meta.js must contain metadata only')
    })
})
