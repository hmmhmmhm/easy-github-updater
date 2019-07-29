const Updater = require('../dist')
Updater.automatic({
    sourceFolderPath: `${__dirname}/repo`,
    force: true,
    rebase: true,
    keep: ['/tt/*']
})