import Event from 'events'
import path from 'path'
import url from 'url'
import http from 'http'
import https from 'https'
import fs from 'fs'
import { getEventSignal } from './eventSignal'
import admZip from 'adm-zip'

export class Update {
    events: Event
    saveOptions: any

    constructor(){
        this.events = new Event()
        this.saveOptions = {}
    }

    getLocalGitInfo(sourceFolderPath?: string) {
        if (sourceFolderPath === undefined)
            sourceFolderPath = path.join(process.argv[1], '../')

        let packageJsonPath = path.join(sourceFolderPath, '/package.json')

        let type = '',
            url = '',
            version = ''

        try {
            let packageJson = require(packageJsonPath)

            if (typeof(packageJson.repository) != "undefined" &&
                typeof(packageJson.repository.type) != "undefined" &&
                typeof(packageJson.repository.url) != "undefined") {
                type = packageJson.repository.type
                url = packageJson.repository.url
            }
            if (typeof(packageJson.version) != "undefined")
                version = packageJson.version

            if (url != null) {
                if (url.split('git+').length > 1) url = url.split('git+')[1]
                if (url.split('.git').length > 1) url = url.split('.git')[0]
            }
        } catch (e) {}

        return {
            type: type.toLowerCase(),
            url: url,
            version: version
        }
    }

    async getWebGitInfo(
        repoUrl: string,
        branch: string = 'master',

        callback: (data: {
            type: string
            version: string
        }) => Promise<void>
    ){
        await this.getWebPackageJson(repoUrl, branch, async (packageJson) => {
            let type = '',
                version = ''

            if (typeof(packageJson.repository) != "undefined" &&
                typeof(packageJson.repository.type) != "undefined") {
                type = packageJson.repository.type
            }

            if (typeof(packageJson.version) != "undefined")
                version = packageJson.version

            await callback({
                type: type.toLowerCase(),
                version: version
            })
        })
    }

    async getWebPackageJson(
        repoUrl: string,
        branch: string = 'master',

        callback: (packageJson?: any) => Promise<void>
    ){
        if (repoUrl[repoUrl.length - 1] != '/') repoUrl += '/'
        let packageJsonUrl = url.resolve(repoUrl, `${branch}/package.json`)
        let parsedPackageJsonUrl = url.parse(packageJsonUrl)

        let protocol: null
        | typeof http
        | typeof https
            = null

        switch (parsedPackageJsonUrl.protocol) {
        case 'http:':
            protocol = http
            break
            case 'https:':
            protocol = https
            break
        }
        parsedPackageJsonUrl.host = 'raw.githubusercontent.com'
        let packageJson = ''

        return new Promise(async (resolve)=>{
            if(!protocol){
                await callback(undefined)
                resolve()
                return
            }
            protocol.get(
                url.format(parsedPackageJsonUrl),
                response => {
                    response.on('data', chunk => {
                        packageJson += chunk
                    })
                    response.on('end', async () => {
                        await callback(JSON.parse(packageJson))
                        resolve()
                    })
                }
            )
        })
    }

    async downloadWebProjectZip(
        repoUrl: string,
        branch: string = 'master',
        sourceFolderPath: string
    ){

        if (repoUrl[repoUrl.length - 1] != '/') repoUrl += '/'
        let projectZipUrl = url.resolve(repoUrl, `zip/${branch}`)
        let parsedProjectZipUrl = url.parse(projectZipUrl)

        let protocol: null
        | typeof http
        | typeof https
            = null

        if (fs.existsSync(path.join(sourceFolderPath, `_${branch}.zip`)))
            fs.unlinkSync(path.join(sourceFolderPath, `_${branch}.zip`))

        switch (parsedProjectZipUrl.protocol) {
        case 'http:':
            protocol = http
                break
            case 'https:':
            protocol = https
                break
        }

        return new Promise((resolve)=>{
            parsedProjectZipUrl.host = 'codeload.github.com'
            if (protocol !== null) {
                protocol.get(url.format(parsedProjectZipUrl), (response) => {
    
                    let eventInfo = {
                        repoUrl: repoUrl,
                        sourceFolderPath: sourceFolderPath,
                        branch: branch
                    }

                    this.events.emit(
                        getEventSignal('projectDownloadStart'),
                        eventInfo
                    )

                    let file = fs.createWriteStream(path.join(sourceFolderPath, `_${branch}.zip`))
                    let contentLength = 0
                    let currentLength = 0

                    if(response.headers['content-length'])
                        contentLength =
                            parseInt(response.headers['content-length'], 10)

                    response.pipe(file)

                    response.on('data', (chunk) => {
                        currentLength += chunk.length
                        let percentage = (100.0 * (currentLength / contentLength)).toFixed(2)
    
                        this.events.emit(
                            getEventSignal('projectDownloadProgress'),
                            percentage,
                            eventInfo
                        )
                    })
    
                    response.on('end', () => {
                        file.end()
                    })
    
                    file.on('finish', () => {
                        this.events.emit(
                            getEventSignal('projectDownloadEnd'),
                            eventInfo
                        )
                        resolve()
                    })

                    response.on('error', () => {
                        resolve()
                    })
                })
            }
        })
    }

    extractProjectZip(
        repoUrl: string,
        branch: string = 'master',
        sourceFolderPath: string
    ){
        let zip = new admZip(path.join(sourceFolderPath, `_${branch}.zip`))
        let zipEntries = zip.getEntries() // an array of ZipEntry records

        zip.extractEntryTo(zipEntries[0], sourceFolderPath, false, true)
        fs.unlinkSync(path.join(sourceFolderPath, `_${branch}.zip`))

        let eventInfo = {
            repoUrl: repoUrl,
            sourceFolderPath: sourceFolderPath,
            branch: branch
        }

        this.events.emit(
            getEventSignal('projectExtractComplete'),
            eventInfo
        )
    }

    async getNewestGitHubCommit(repoUrl: string, callback: (data?: {message, name, date}) => Promise<void>) {
        await this.getGitHubCommits(repoUrl, async (body) => {
            if(!body || typeof body[0] == 'undefined' || typeof body[0]['commit'] =='undefined'){
                await callback()
                return
            }
            await callback({
                message: body[0].commit.message,
                name: body[0].commit.committer.name,
                date: body[0].commit.committer.date
            })
        })
    }

    getGitHubCommits(repoUrl: string, callback: (data?: any) => Promise<void>) {
        let options = {
            hostname: 'api.github.com',
            port: 443,
            path: `/repos/${repoUrl.split(`github.com/`)[1].split(`.git`)[0]}/commits`.replace('//', '/'),
            method: 'GET',
            headers: { 'user-agent': 'easy-github-updater' }
        }

        return new Promise((resolve)=>{
            let body = ''
            let request = https.request(options, (response) => {
                response.on('data', (chunk) => {
                    body += chunk
                })
                response.on("end", async () => {
                    body = JSON.parse(body)
                    await callback(body)
                    resolve()
                })
                response.on('error', async () => {
                    await callback(undefined)
                    resolve()
                })

            })
            request.end()
        })
    }
}