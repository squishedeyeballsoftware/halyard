// eslint-disable-next-line no-undef

module.exports = {
    'testMatch': [
        '**/?(*.)+(unit).+(js)'
    ],
    'reporters': [
        'default',
        ['jest-html-reporters', {
            'publicPath': './coverage',
            'filename': 'report.html',
            'expand': false
        }]
    ],
    setupFiles: ['<rootDir>/jestsetup.js'],
    testEnvironment: 'node',
}