import { Update } from './update/update'
import { getEventSignal } from './update/eventSignal'
import { Logger } from './logger'

export interface ICheckResult {
    message: string
    commitDate: string
    committerName: string
    data: {
        message: string
        name: string
        date: string
    }
    encodedMessage: string
}

export const check = (
    {
        branch = 'master',
        repoUrl,

        sourceFolderPath,
        isNeedDefaultProcess,
        force = false
    }: {
        branch: string
        repoUrl?: string
        sourceFolderPath: string
        isNeedDefaultProcess?: boolean
        force: boolean
    }
): Promise<ICheckResult | undefined> => {

    return new Promise((resolve)=>{
        let updater = new Update()

        if (sourceFolderPath === undefined)
            sourceFolderPath = process.cwd()
    
        if (isNeedDefaultProcess == true || isNeedDefaultProcess == undefined) {
            updater.events.on(
                getEventSignal('newVersionDetected'),
                (eventInfo) => {
                    updater.getNewestGitHubCommit(eventInfo.repoUrl, async (data) => {
    
                        if(!data) {
                            resolve()
                            return
                        }
    
                        let {
                            message,
                            date: commitDate,
                            name: committerName
                        } = data
    
                        let encodedMessage = ``
                        encodedMessage += Logger('New updates of the application have been found at Github.', true)
                        encodedMessage += Logger(`Repository URL: ${eventInfo.repoUrl}, Branch: ${eventInfo.branch}\r\n`, true)
    
                        encodedMessage += Logger(`Installed Application Version: ${eventInfo.localVersion}`, true)
                        encodedMessage += Logger(`Update available version of application: ${eventInfo.webVersion}\r\n`, true)
    
                        encodedMessage += Logger('[Github commit Information]', true)
                        encodedMessage += Logger(`Message: ${message}`, true)
                        encodedMessage += Logger(`Comitter: ${committerName}`, true)
                        encodedMessage += Logger(`CommitDate: ${commitDate}\r\n`, true)

                        resolve({
                            message,
                            commitDate,
                            committerName,
                            data,
                            encodedMessage
                        })
                    })
                }
            )
        }
    
        let localGitInfo = updater.getLocalGitInfo(sourceFolderPath)
        if (localGitInfo.type != "git") return
    
        if (repoUrl === undefined) repoUrl = localGitInfo.url
    
        if (repoUrl[repoUrl.length - 1] != '/') repoUrl += '/'
        if (branch === undefined) branch = 'master'
    
        let webGitInfoCallback = async (webGitInfo) => {
            if (webGitInfo.type != "git"){
                resolve()
                return
            }
    
            let eventInfo = {
                repoUrl,
                sourceFolderPath,
                branch,
                localVersion: localGitInfo.version,
                webVersion: webGitInfo.version
            }
    
            if (!force && (webGitInfo.version == localGitInfo.version || webGitInfo.version == null)) {
                resolve()
            } else {
                updater.events.emit(
                    getEventSignal('newVersionDetected'),
                    eventInfo
                )
            }
        }
    
        updater.getWebGitInfo(repoUrl, branch, webGitInfoCallback)
    })
}