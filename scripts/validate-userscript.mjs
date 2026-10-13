import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

function expectOne(entries, key, expected, label, errors) {
    const values = entries.get(key) ?? []
    if (values.length !== 1) {
        errors.push(`${label}: expected exactly one @${key}, found ${values.length}`)
    }
    else if (expected !== undefined && values[0] !== expected) {
        errors.push(`${label}: @${key} must be ${JSON.stringify(expected)}, got ${JSON.stringify(values[0])}`)
    }
}

export function parseUserscript(source, label, errors) {
    const lines = source.replace(/\r\n?/g, '\n').split('\n')
    if (lines[0] !== '// ==UserScript==') {
        errors.push(`${label}: metadata must start on the first line`)
        return null
    }
    const closingIndex = lines.indexOf('// ==/UserScript==')
    if (closingIndex < 0) {
        errors.push(`${label}: missing // ==/UserScript== marker`)
        return null
    }
    const entries = new Map()
    for (const line of lines.slice(1, closingIndex)) {
        const match = /^\/\/ @([^\s]+)(?:\s+(.*))?$/.exec(line)
        if (!match) {
            errors.push(`${label}: malformed metadata line: ${line}`)
            continue
        }
        const values = entries.get(match[1]) ?? []
        values.push((match[2] ?? '').trim())
        entries.set(match[1], values)
    }
    return {
        header: lines.slice(0, closingIndex + 1).join('\n'),
        body: lines.slice(closingIndex + 1).join('\n'),
        entries,
    }
}

export function validateUserscriptArtifacts(packageJson, userScript, metadataScript) {
    const errors = []
    const user = parseUserscript(userScript, 'chatgpt.user.js', errors)
    const meta = parseUserscript(metadataScript, 'chatgpt.meta.js', errors)
    if (!user || !meta) return errors

    if (user.header !== meta.header) {
        errors.push('Headers differ between chatgpt.user.js and chatgpt.meta.js')
    }
    if (!user.body.trim()) {
        errors.push('chatgpt.user.js is missing executable script code')
    }
    if (meta.body.trim()) {
        errors.push('chatgpt.meta.js contains code after its metadata header')
    }

    let homepage
    try {
        homepage = new URL(packageJson.homepage)
        if (homepage.origin !== 'https://github.com' || !/^\/[^/]+\/[^/]+\/?$/.test(homepage.pathname)) {
            throw new Error('homepage must be a GitHub repository URL')
        }
    }
    catch {
        errors.push('package.json: homepage must be https://github.com/<owner>/<repo>')
        return errors
    }

    const repositoryURL = homepage.toString().replace(/\/$/, '')
    const expectedRepositoryURL = `${repositoryURL}.git`
    if (packageJson.repository?.url !== expectedRepositoryURL) {
        errors.push(`package.json: repository.url must be ${expectedRepositoryURL}`)
    }
    if (packageJson.bugs?.url !== `${repositoryURL}/issues`) {
        errors.push(`package.json: bugs.url must be ${repositoryURL}/issues`)
    }

    const rawURL = `https://raw.githubusercontent.com${homepage.pathname.replace(/\/$/, '')}/master/dist`
    const expected = {
        name: packageJson.title,
        namespace: packageJson.author,
        author: packageJson.author,
        version: packageJson.version,
        license: packageJson.license,
        homepage: repositoryURL,
        homepageURL: repositoryURL,
        source: expectedRepositoryURL,
        supportURL: `${repositoryURL}/issues`,
        downloadURL: `${rawURL}/chatgpt.user.js`,
        updateURL: `${rawURL}/chatgpt.meta.js`,
    }

    for (const [label, parsed] of [['chatgpt.user.js', user], ['chatgpt.meta.js', meta]]) {
        for (const [key, value] of Object.entries(expected)) {
            expectOne(parsed.entries, key, value, label, errors)
        }
    }
    return errors
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
    try {
        const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
        const user = readFileSync('dist/chatgpt.user.js', 'utf8')
        const meta = readFileSync('dist/chatgpt.meta.js', 'utf8')
        const errors = validateUserscriptArtifacts(pkg, user, meta)
        if (errors.length) {
            console.error(`Userscript validation failed:\n- ${errors.join('\n- ')}`)
            process.exitCode = 1
        }
        else {
            console.log('Userscript artifacts validated successfully.')
        }
    }
    catch (error) {
        console.error(`Userscript validation failed: ${error.message}`)
        process.exitCode = 1
    }
}
