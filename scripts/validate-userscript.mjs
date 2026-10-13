import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// ESLint checks metadata syntax. This only checks invariants between generated files.
export function validateUserscriptArtifacts(packageJson, userScript, metadataScript) {
    const errors = []
    const marker = '// ==/UserScript=='

    function split(source) {
        const end = source.indexOf(marker)
        if (!source.startsWith('// ==UserScript==') || end === -1) {
            throw new Error('Missing userscript metadata header')
        }
        const boundary = end + marker.length
        return [source.slice(0, boundary), source.slice(boundary)]
    }

    const [userHeader] = split(userScript)
    const [metaHeader, metaBody] = split(metadataScript)

    if (userHeader !== metaHeader) {
        errors.push('Userscript and metadata headers differ')
    }
    if (metaBody.trim()) {
        errors.push('chatgpt.meta.js must contain metadata only')
    }

    const repoPath = new URL(packageJson.homepage).pathname.replace(/\/$/, '')
    const rawURL = `https://raw.githubusercontent.com${repoPath}/master/dist`
    const expected = {
        version: packageJson.version,
        downloadURL: `${rawURL}/chatgpt.user.js`,
        updateURL: `${rawURL}/chatgpt.meta.js`,
    }

    for (const [key, value] of Object.entries(expected)) {
        const actual = metaHeader.match(new RegExp(`^//\\s*@${key}\\s+(.+)$`, 'm'))?.[1].trim()
        if (actual !== value) {
            errors.push(`@${key}: expected ${value}, got ${actual ?? '(missing)'}`)
        }
    }

    return errors
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
    try {
        const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
        const userScript = readFileSync('dist/chatgpt.user.js', 'utf8')
        const metadataScript = readFileSync('dist/chatgpt.meta.js', 'utf8')
        const errors = validateUserscriptArtifacts(packageJson, userScript, metadataScript)
        if (errors.length) {
            console.error(errors.join('\n'))
            process.exitCode = 1
        }
        else {
            console.log('Userscript artifacts validated.')
        }
    }
    catch (error) {
        console.error(error.message)
        process.exitCode = 1
    }
}
