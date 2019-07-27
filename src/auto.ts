import { Update } from './update/update'
import { getEventSignal } from './update/eventSignal'
import { Logger } from './logger'
import path from 'path'
import readline from 'readline'

export const automatic = (
    {
        waitTime = 10000,
        branch = 'master',
        repoUrl,
        sourceFolderPath,
        isNeedDefaultProcess,
        rebase = false
    }: {
        waitTime: number,
        branch: string,
        repoUrl?: string,
        sourceFolderPath: string,
        isNeedDefaultProcess?: boolean,
        rebase: boolean
    }
) => {
    let updater = new Update()

    if (sourceFolderPath === undefined)
        sourceFolderPath = process.cwd()

    if (isNeedDefaultProcess == true || isNeedDefaultProcess == undefined) {
        updater.events.on(
            getEventSignal('newVersionDetected'),
            (eventInfo) => {
                updater.getNewestGitHubCommit(eventInfo.repoUrl, async (data) => {

                    if(!data) return

                    let {
                        message,
                        date: commitDate,
                        name: committerName
                    } = data

                    /**
                     * milisecond
                     */
                    let checkWaitTime: number | null = null

                    if (typeof(updater.saveOptions[`${eventInfo.repoUrl}:${eventInfo.branch}`]) != 'undefined')
                        checkWaitTime = updater.saveOptions[`${eventInfo.repoUrl}:${eventInfo.branch}`][waitTime]

                    if (checkWaitTime === 0) {
                        updater.downloadWebProjectZip(
                            eventInfo.repoUrl,
                            eventInfo.branch,
                            eventInfo.sourceFolderPath
                        )
                        return
                    }

                    if (checkWaitTime == null)
                        checkWaitTime = 10000

                    Logger('New updates of the application have been found at Github.')
                    Logger(`Repository URL: ${eventInfo.repoUrl}, Branch: ${eventInfo.branch}\r\n`)

                    Logger(`Installed Application Version: ${eventInfo.localVersion}`)
                    Logger(`Update available version of application: ${eventInfo.webVersion}\r\n`)

                    Logger('[Github commit Information]')
                    Logger(`Message: ${message}`)
                    Logger(`Comitter: ${committerName}`)
                    Logger(`CommitDate: ${commitDate}\r\n`)

                    Logger(`If you do not select, it will be launch ${(checkWaitTime/1000)} seconds after automatically.`)
                    Logger(`If want to update, please enter 'yes'.`)
                    Logger('(yes/no):')

                    let line = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout
                    })

                    let timerKnock = 
                        setTimeout(() => {
                            grantedCalback()
                        },
                        checkWaitTime)

                    let grantedCalback = () => {
                        if(timerKnock) clearTimeout(timerKnock)
                        if(line) line.close()

                        updater.downloadWebProjectZip(
                            eventInfo.repoUrl,
                            eventInfo.branch,
                            eventInfo.sourceFolderPath
                        )
                    }

                    let deniedCallback = () => {
                        if(timerKnock) clearTimeout(timerKnock)
                        if(line) line.close()
                        updater.events.emit(
                            getEventSignal('startCallback'),
                            eventInfo
                        )
                    }

                    line.on('line', (input) => {
                        switch (input.toLowerCase()) {
                            case 'y':
                            case 'yes':
                                grantedCalback()
                                break
                            case 'n':
                            case 'no':
                                deniedCallback()
                                break
                            default:
                                Logger(`${input} is not correct, please type 'yes' or 'no'.`)
                                break
                        }
                    })
                })
            }
        )
        
        updater.events.on(
            getEventSignal('projectDownloadStart'),
            (eventInfo) => {
                if (typeof(updater.saveOptions[`${eventInfo.repoUrl}:${eventInfo.branch}`]['automatic']) == 'undefined') return

                if (updater.saveOptions[`${eventInfo.repoUrl}:${eventInfo.branch}`]['automatic'])
                    Logger(`START THE DOWNLOAD PROJECT FILE... (${eventInfo.repoUrl}:${eventInfo.branch})`)
            })

        updater.events.on(
            getEventSignal('projectDownloadEnd'),
            (eventInfo) => {
                if (typeof(updater.saveOptions[`${eventInfo.repoUrl}:${eventInfo.branch}`]['automatic']) == 'undefined') return
                if (updater.saveOptions[`${eventInfo.repoUrl}:${eventInfo.branch}`]['automatic']) {
                    Logger(`START THE EXTRACT PROJECT ZIP... (${eventInfo.repoUrl}:${eventInfo.branch})`)

                    updater.extractProjectZip(
                        eventInfo.repoUrl,
                        eventInfo.branch,
                        eventInfo.sourceFolderPath
                    )
                }
            })

        updater.events.on(
            getEventSignal('projectExtractComplete'),
            (eventInfo) => {
                if (typeof(updater.saveOptions[`${eventInfo.repoUrl}:${eventInfo.branch}`]['automatic']) == 'undefined')
                    return

                if (updater.saveOptions[`${eventInfo.repoUrl}:${eventInfo.branch}`]['automatic'])
                    Logger(`PROJECT UPDATE COMPLETE! (${eventInfo.repoUrl}:${eventInfo.branch})`)

                updater.events.emit(
                    getEventSignal('startCallback'),
                    eventInfo
                )
            })
    }

    let localGitInfo = updater.getLocalGitInfo(sourceFolderPath)
    if (localGitInfo.type != "git") return

    if (repoUrl === undefined) repoUrl = localGitInfo.url

    if (repoUrl[repoUrl.length - 1] != '/') repoUrl += '/'
    if (branch === undefined) branch = 'master'

    updater.saveOptions[`${repoUrl}:${branch}`] = {
        waitTime: waitTime,
        automatic: true
    }

    let webGitInfoCallback = async (webGitInfo) => {
        if (webGitInfo.type != "git") return

        let eventInfo = {
            repoUrl,
            sourceFolderPath,
            branch,
            localVersion: localGitInfo.version,
            webVersion: webGitInfo.version
        }

        if (!rebase && (webGitInfo.version == localGitInfo.version || webGitInfo.version == null)) {
            updater.events.emit(
                getEventSignal('alreadyHighestVersion'),
                eventInfo
            )
        } else {
            updater.events.emit(
                getEventSignal('newVersionDetected'),
                eventInfo
            )
        }
    }

    updater.getWebGitInfo(repoUrl, branch, webGitInfoCallback)
}