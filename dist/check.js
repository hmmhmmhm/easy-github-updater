"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var update_1 = require("./update/update");
var eventSignal_1 = require("./update/eventSignal");
var logger_1 = require("./logger");
exports.check = function (_a) {
    var _b = _a.branch, branch = _b === void 0 ? 'master' : _b, repoUrl = _a.repoUrl, sourceFolderPath = _a.sourceFolderPath, isNeedDefaultProcess = _a.isNeedDefaultProcess, _c = _a.force, force = _c === void 0 ? false : _c;
    return new Promise(function (resolve) {
        var updater = new update_1.Update();
        if (sourceFolderPath === undefined)
            sourceFolderPath = process.cwd();
        if (isNeedDefaultProcess == true || isNeedDefaultProcess == undefined) {
            updater.events.on(eventSignal_1.getEventSignal('newVersionDetected'), function (eventInfo) {
                updater.getNewestGitHubCommit(eventInfo.repoUrl, function (data) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    var message, commitDate, committerName, encodedMessage;
                    return tslib_1.__generator(this, function (_a) {
                        if (!data) {
                            resolve();
                            return [2 /*return*/];
                        }
                        message = data.message, commitDate = data.date, committerName = data.name;
                        encodedMessage = "";
                        encodedMessage += logger_1.Logger('New updates of the application have been found at Github.', true);
                        encodedMessage += logger_1.Logger("Repository URL: " + eventInfo.repoUrl + ", Branch: " + eventInfo.branch + "\r\n", true);
                        encodedMessage += logger_1.Logger("Installed Application Version: " + eventInfo.localVersion, true);
                        encodedMessage += logger_1.Logger("Update available version of application: " + eventInfo.webVersion + "\r\n", true);
                        encodedMessage += logger_1.Logger('[Github commit Information]', true);
                        encodedMessage += logger_1.Logger("Message: " + message, true);
                        encodedMessage += logger_1.Logger("Comitter: " + committerName, true);
                        encodedMessage += logger_1.Logger("CommitDate: " + commitDate + "\r\n", true);
                        resolve({
                            message: message,
                            commitDate: commitDate,
                            committerName: committerName,
                            data: data,
                            encodedMessage: encodedMessage
                        });
                        return [2 /*return*/];
                    });
                }); });
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
        var webGitInfoCallback = function (webGitInfo) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var eventInfo;
            return tslib_1.__generator(this, function (_a) {
                if (webGitInfo.type != "git") {
                    resolve();
                    return [2 /*return*/];
                }
                eventInfo = {
                    repoUrl: repoUrl,
                    sourceFolderPath: sourceFolderPath,
                    branch: branch,
                    localVersion: localGitInfo.version,
                    webVersion: webGitInfo.version
                };
                if (!force && (webGitInfo.version == localGitInfo.version || webGitInfo.version == null)) {
                    resolve();
                }
                else {
                    updater.events.emit(eventSignal_1.getEventSignal('newVersionDetected'), eventInfo);
                }
                return [2 /*return*/];
            });
        }); };
        updater.getWebGitInfo(repoUrl, branch, webGitInfoCallback);
    });
};
