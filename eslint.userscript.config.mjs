import * as userscripts from 'eslint-plugin-userscripts'

// The plugin checks userscript metadata; project-specific cross-file checks run separately.
const metadataRules = {
    'userscripts/no-invalid-metadata': 'error',
    'userscripts/no-invalid-headers': 'error',
    'userscripts/no-invalid-grant': 'error',
    'userscripts/require-name': 'error',
    'userscripts/require-description': 'error',
    'userscripts/require-version': 'error',
    'userscripts/require-download-url': 'error',
    'userscripts/require-attribute-space-prefix': 'error',
    'userscripts/use-homepage-and-url': 'off',
    'userscripts/align-attributes': 'off',
    'userscripts/better-use-match': 'off',
}

export default [
    {
        files: ['dist/chatgpt.user.js', 'dist/chatgpt.meta.js'],
        languageOptions: { ecmaVersion: 'latest', sourceType: 'script' },
        plugins: { userscripts: { rules: userscripts.rules } },
        rules: metadataRules,
    },
    {
        files: ['dist/chatgpt.user.js'],
        rules: {
            'userscripts/filename-user': 'error',
            'userscripts/metadata-spacing': 'error',
        },
    },
    {
        files: ['dist/chatgpt.meta.js'],
        rules: {
            'userscripts/filename-user': 'off',
            'userscripts/metadata-spacing': 'off',
        },
    },
]
