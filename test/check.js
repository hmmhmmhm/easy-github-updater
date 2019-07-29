const Updater = require('../dist')
Updater.check({
    sourceFolderPath: `${__dirname}/repo`,
    force: true
}).then((data)=>{
    if(data) console.log(data)
})