"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var update_1 = require("./update/update");
var eventSignal_1 = require("./update/eventSignal");
var logger_1 = require("./logger");
var readline_1 = tslib_1.__importDefault(require("readline"));
exports.automatic = function (_a) {
    var _b = _a.waitTime, waitTime = _b === void 0 ? 10000 : _b, _c = _a.branch, branch = _c === void 0 ? 'master' : _c, repoUrl = _a.repoUrl, sourceFolderPath = _a.sourceFolderPath, isNeedDefaultProcess = _a.isNeedDefaultProcess, _d = _a.force, force = _d === void 0 ? false : _d, _e = _a.rebase, rebase = _e === void 0 ? true : _e, _f = _a.keep, keep = _f === void 0 ? [] : _f;
    var updater = new update_1.Update();
    if (sourceFolderPath === undefined)
        sourceFolderPath = process.cwd();
    if (isNeedDefaultProcess == true || isNeedDefaultProcess == undefined) {
        updater.events.on(eventSignal_1.getEventSignal('newVersionDetected'), function (eventInfo) {
            updater.getNewestGitHubCommit(eventInfo.repoUrl, function (data) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var message, commitDate, committerName, checkWaitTime, line, timerKnock, grantedCalback, deniedCallback;
                return tslib_1.__generator(this, function (_a) {
                    if (!data)
                        return [2 /*return*/];
                    message = data.message, commitDate = data.date, committerName = data.name;
                    checkWaitTime = null;
                    if (typeof (updater.saveOptions[eventInfo.repoUrl + ":" + eventInfo.branch]) != 'undefined')
                        checkWaitTime = updater.saveOptions[eventInfo.repoUrl + ":" + eventInfo.branch][waitTime];
                    if (checkWaitTime === 0) {
                        updater.downloadWebProjectZip(eventInfo.repoUrl, eventInfo.branch, eventInfo.sourceFolderPath);
                    }
                    if (checkWaitTime == null)
                        checkWaitTime = 5000;
                    logger_1.Logger('New updates of the application have been found at Github.');
                    logger_1.Logger("Repository URL: " + eventInfo.repoUrl + ", Branch: " + eventInfo.branch + "\r\n");
                    logger_1.Logger("Installed Application Version: " + eventInfo.localVersion);
                    logger_1.Logger("Update available version of application: " + eventInfo.webVersion + "\r\n");
                    logger_1.Logger('[Github commit Information]');
                    logger_1.Logger("Message: " + message);
                    logger_1.Logger("Comitter: " + committerName);
                    logger_1.Logger("CommitDate: " + commitDate + "\r\n");
                    logger_1.Logger("If you do not select, it will be launch " + (checkWaitTime / 1000) + " seconds after automatically.");
                    logger_1.Logger("If want to update, please enter 'yes'.");
                    logger_1.Logger('(yes/no):');
                    line = readline_1.default.createInterface({
                        input: process.stdin,
                        output: process.stdout
                    });
                    timerKnock = setTimeout(function () {
                        grantedCalback();
                    }, checkWaitTime);
                    grantedCalback = function () {
                        if (timerKnock)
                            clearTimeout(timerKnock);
                        if (line)
                            line.close();
                        updater.downloadWebProjectZip(eventInfo.repoUrl, eventInfo.branch, eventInfo.sourceFolderPath);
                    };
                    deniedCallback = function () {
                        if (timerKnock)
                            clearTimeout(timerKnock);
                        if (line)
                            line.close();
                        updater.events.emit(eventSignal_1.getEventSignal('startCallback'), eventInfo);
                    };
                    line.on('line', function (input) {
                        switch (input.toLowerCase()) {
                            case 'y':
                            case 'yes':
                                grantedCalback();
                                break;
                            case 'n':
                            case 'no':
                                deniedCallback();
                                break;
                            default:
                                logger_1.Logger(input + " is not correct, please type 'yes' or 'no'.");
                                break;
                        }
                    });
                    return [2 /*return*/];
                });
            }); });
        });
        updater.events.on(eventSignal_1.getEventSignal('projectDownloadStart'), function (eventInfo) {
            if (typeof (updater.saveOptions[eventInfo.repoUrl + ":" + eventInfo.branch]['automatic']) == 'undefined')
                return;
            if (updater.saveOptions[eventInfo.repoUrl + ":" + eventInfo.branch]['automatic'])
                logger_1.Logger("START THE DOWNLOAD PROJECT FILE... (" + eventInfo.repoUrl + ":" + eventInfo.branch + ")");
        });
        updater.events.on(eventSignal_1.getEventSignal('projectDownloadEnd'), function (eventInfo) {
            if (typeof (updater.saveOptions[eventInfo.repoUrl + ":" + eventInfo.branch]['automatic']) == 'undefined')
                return;
            if (updater.saveOptions[eventInfo.repoUrl + ":" + eventInfo.branch]['automatic']) {
                logger_1.Logger("START THE EXTRACT PROJECT ZIP... (" + eventInfo.repoUrl + ":" + eventInfo.branch + ")");
                try {
                    updater.extractProjectZip(eventInfo.repoUrl, eventInfo.branch, eventInfo.sourceFolderPath, rebase, keep);
                }
                catch (e) { }
            }
        });
        updater.events.on(eventSignal_1.getEventSignal('projectExtractComplete'), function (eventInfo) {
            if (typeof (updater.saveOptions[eventInfo.repoUrl + ":" + eventInfo.branch]['automatic']) == 'undefined')
                return;
            if (updater.saveOptions[eventInfo.repoUrl + ":" + eventInfo.branch]['automatic'])
                logger_1.Logger("PROJECT UPDATE COMPLETE! (" + eventInfo.repoUrl + ":" + eventInfo.branch + ")");
            updater.events.emit(eventSignal_1.getEventSignal('startCallback'), eventInfo);
        });
    }
    var localGitInfo = updater.getLocalGitInfo(sourceFolderPath);
    if (localGitInfo.type != "git")
        return;
    if (repoUrl === undefined)
        repoUrl = localGitInfo.url;
    if (repoUrl[repoUrl.length - 1] != '/')
        repoUrl += '/';
    if (branch === undefined)
        branch = 'master';
    updater.saveOptions[repoUrl + ":" + branch] = {
        waitTime: waitTime,
        automatic: true
    };
    var webGitInfoCallback = function (webGitInfo) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var eventInfo;
        return tslib_1.__generator(this, function (_a) {
            if (webGitInfo.type != "git")
                return [2 /*return*/];
            eventInfo = {
                repoUrl: repoUrl,
                sourceFolderPath: sourceFolderPath,
                branch: branch,
                localVersion: localGitInfo.version,
                webVersion: webGitInfo.version
            };
            if (!force && (webGitInfo.version == localGitInfo.version || webGitInfo.version == null)) {
                updater.events.emit(eventSignal_1.getEventSignal('alreadyHighestVersion'), eventInfo);
            }
            else {
                updater.events.emit(eventSignal_1.getEventSignal('newVersionDetected'), eventInfo);
            }
            return [2 /*return*/];
        });
    }); };
    updater.getWebGitInfo(repoUrl, branch, webGitInfoCallback);
};
