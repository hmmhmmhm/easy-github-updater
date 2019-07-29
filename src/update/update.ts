import Event from 'events'
import NestedFolder from 'nested-static'
import path from 'path'
import url from 'url'
import https from 'https'
import fs, { readdirSync } from 'fs-extra'
import { getEventSignal } from './eventSignal'
import admZip from 'adm-zip'
import wildcard from 'wildcard'

export interface IPathsType {
    subPath: string
    staticPath: string
    filePath: string
    fileName: string
}

export const collectFilePaths
:(folderPath: string) => Promise<IPathsType[]> =

async (
    folderPath: string
) => {

    // Search all of the child folders
    return new Promise((resolve)=>{
        NestedFolder(folderPath, async (folders)=>{
            let data: IPathsType[] = []

            for(let folder of folders){
                let files = fs.readdirSync(folder.staticPath)

                // Search all of the files
                for(let file of files){
                    let filePath = folder.staticPath + '/' + file
                    let stats = fs.statSync(filePath)
                    if(stats.isDirectory()) continue

                    data.push({
                        subPath: folder.subPath,
                        staticPath: folder.staticPath,
                        filePath,
                        fileName: file
                    })
                }
            }
            resolve(data)
        })
    })
}

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
        packageJsonUrl = packageJsonUrl.replace('github.com/', 'raw.githubusercontent.com/')

        let packageJson = ''

        return new Promise(async (resolve)=>{
            let request = https.request(packageJsonUrl, (response) => {
                response.on('data', (chunk) => {
                    packageJson += chunk
                })
                response.on("end", async () => {
                    await callback(JSON.parse(packageJson))
                    resolve()
                })
                response.on('error', async () => {
                    await callback()
                    resolve()
                })
            })
            request.end()
        })
    }

    downloadWebProjectZip(
        repoUrl: string,
        branch: string = 'master',
        sourceFolderPath: string
    ){

        if (repoUrl[repoUrl.length - 1] != '/') repoUrl += '/'

        let projectZipUrl = url.resolve(repoUrl, `zip/${branch}`)
        projectZipUrl = projectZipUrl.replace('github.com/', 'codeload.github.com/')

        if (fs.existsSync(path.join(sourceFolderPath, `_${branch}.zip`)))
            fs.unlinkSync(path.join(sourceFolderPath, `_${branch}.zip`))

        let request = https.request(projectZipUrl, (response) => {
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

            let pipe = response.pipe(file)

            response.on('data', (chunk) => {
                currentLength += chunk.length
                let percentage = (100.0 * (currentLength / contentLength)).toFixed(2)

                this.events.emit(
                    getEventSignal('projectDownloadProgress'),
                    percentage,
                    eventInfo
                )
            })
            response.on('end', ()=>{
                this.events.emit(
                    getEventSignal('projectDownloadEnd'),
                    eventInfo
                )
            })
        })
        request.end()
    }

    extractProjectZip(
        repoUrl: string,
        branch: string = 'master',
        sourceFolderPath: string,
        rebase: boolean = true,
        keep: string[] = []
    ){

        // COLLECT BEFORE FILE LISTS
        let fieldName = `_updatedata_${branch}`
        setTimeout(async ()=>{
            try{
                let zip = new admZip(path.join(sourceFolderPath, `_${branch}.zip`))
                let zipEntries = zip.getEntries() // an array of ZipEntry records
                zip.extractAllTo(`${sourceFolderPath}/${fieldName}`, /*overwrite*/true)
    
                let subFile = readdirSync(`${sourceFolderPath}/${fieldName}`)
    
                let before = await collectFilePaths(`${sourceFolderPath}/${fieldName}/${subFile[0]}`)
    
                await fs.copySync(`${sourceFolderPath}/${fieldName}/${subFile[0]}`, sourceFolderPath)
                await fs.unlinkSync(path.join(sourceFolderPath, `_${branch}.zip`))
                await fs.remove(`${sourceFolderPath}/${fieldName}`)
    
                // COLLECT AFTER FILE LISTS
                let after = await collectFilePaths(sourceFolderPath)
    
                let diff: IPathsType[] = []
                for(let afterItem of after){
                    let isLegacyFile = true
                    for(let beforeItem of before){
                        if(beforeItem.subPath == afterItem.subPath
                            && beforeItem.fileName == afterItem.fileName){
    
                            isLegacyFile = false
                            break
                        }
                    }
    
                    if(isLegacyFile) diff.push(afterItem)
                }
    
                for(let diffItem of diff){
    
                    // rebase 옵션이 참인 경우 diffItem.staticPath 다 지우기
                    if(rebase){
    
                        // keep 목록이 있는 경우
                        // keep 에 통과되는 `${subPath}${fileName}` 만 안 지우기
                        let isKeepItem = false
                        if(Array.isArray(keep)){
                            for(let keepItem of keep){
    
                                if(wildcard(keepItem, `${diffItem.subPath}${diffItem.fileName}`)){
                                    isKeepItem = true
                                    break
                                }
                            }
                        }
    
                        // diffItem.staticPath 다 지우기
                        if(!isKeepItem) await fs.unlinkSync(`${diffItem.staticPath}/${diffItem.fileName}`)
                    }
                }
            }catch(e){
                try{
                    await fs.unlinkSync(path.join(sourceFolderPath, `_${branch}.zip`))
                    await fs.remove(`${sourceFolderPath}/${fieldName}`)
                }catch(e){}
            }

            let eventInfo = {
                repoUrl: repoUrl,
                sourceFolderPath: sourceFolderPath,
                branch: branch
            }

            this.events.emit(
                getEventSignal('projectExtractComplete'),
                eventInfo
            )
        }, 1000)
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