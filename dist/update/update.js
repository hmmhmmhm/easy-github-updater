"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var events_1 = tslib_1.__importDefault(require("events"));
var path_1 = tslib_1.__importDefault(require("path"));
var url_1 = tslib_1.__importDefault(require("url"));
var http_1 = tslib_1.__importDefault(require("http"));
var https_1 = tslib_1.__importDefault(require("https"));
var fs_1 = tslib_1.__importDefault(require("fs"));
var eventSignal_1 = require("./eventSignal");
var adm_zip_1 = tslib_1.__importDefault(require("adm-zip"));
var Update = /** @class */ (function () {
    function Update() {
        this.events = new events_1.default();
        this.saveOptions = {};
    }
    Update.prototype.getLocalGitInfo = function (sourceFolderPath) {
        if (sourceFolderPath === undefined)
            sourceFolderPath = path_1.default.join(process.argv[1], '../');
        var packageJsonPath = path_1.default.join(sourceFolderPath, '/package.json');
        var type = '', url = '', version = '';
        try {
            var packageJson = require(packageJsonPath);
            if (typeof (packageJson.repository) != "undefined" &&
                typeof (packageJson.repository.type) != "undefined" &&
                typeof (packageJson.repository.url) != "undefined") {
                type = packageJson.repository.type;
                url = packageJson.repository.url;
            }
            if (typeof (packageJson.version) != "undefined")
                version = packageJson.version;
            if (url != null) {
                if (url.split('git+').length > 1)
                    url = url.split('git+')[1];
                if (url.split('.git').length > 1)
                    url = url.split('.git')[0];
            }
        }
        catch (e) { }
        return {
            type: type.toLowerCase(),
            url: url,
            version: version
        };
    };
    Update.prototype.getWebGitInfo = function (repoUrl, branch, callback) {
        if (branch === void 0) { branch = 'master'; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getWebPackageJson(repoUrl, branch, function (packageJson) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var type, version;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        type = '', version = '';
                                        if (typeof (packageJson.repository) != "undefined" &&
                                            typeof (packageJson.repository.type) != "undefined") {
                                            type = packageJson.repository.type;
                                        }
                                        if (typeof (packageJson.version) != "undefined")
                                            version = packageJson.version;
                                        return [4 /*yield*/, callback({
                                                type: type.toLowerCase(),
                                                version: version
                                            })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Update.prototype.getWebPackageJson = function (repoUrl, branch, callback) {
        if (branch === void 0) { branch = 'master'; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var packageJsonUrl, parsedPackageJsonUrl, protocol, packageJson;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                if (repoUrl[repoUrl.length - 1] != '/')
                    repoUrl += '/';
                packageJsonUrl = url_1.default.resolve(repoUrl, branch + "/package.json");
                parsedPackageJsonUrl = url_1.default.parse(packageJsonUrl);
                protocol = null;
                switch (parsedPackageJsonUrl.protocol) {
                    case 'http:':
                        protocol = http_1.default;
                        break;
                    case 'https:':
                        protocol = https_1.default;
                        break;
                }
                parsedPackageJsonUrl.host = 'raw.githubusercontent.com';
                packageJson = '';
                return [2 /*return*/, new Promise(function (resolve) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var _this = this;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!!protocol) return [3 /*break*/, 2];
                                    return [4 /*yield*/, callback(undefined)];
                                case 1:
                                    _a.sent();
                                    resolve();
                                    return [2 /*return*/];
                                case 2:
                                    protocol.get(url_1.default.format(parsedPackageJsonUrl), function (response) {
                                        response.on('data', function (chunk) {
                                            packageJson += chunk;
                                        });
                                        response.on('end', function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                            return tslib_1.__generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4 /*yield*/, callback(JSON.parse(packageJson))];
                                                    case 1:
                                                        _a.sent();
                                                        resolve();
                                                        return [2 /*return*/];
                                                }
                                            });
                                        }); });
                                    });
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    Update.prototype.downloadWebProjectZip = function (repoUrl, branch, sourceFolderPath) {
        if (branch === void 0) { branch = 'master'; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var projectZipUrl, parsedProjectZipUrl, protocol;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                if (repoUrl[repoUrl.length - 1] != '/')
                    repoUrl += '/';
                projectZipUrl = url_1.default.resolve(repoUrl, "zip/" + branch);
                parsedProjectZipUrl = url_1.default.parse(projectZipUrl);
                protocol = null;
                if (fs_1.default.existsSync(path_1.default.join(sourceFolderPath, "_" + branch + ".zip")))
                    fs_1.default.unlinkSync(path_1.default.join(sourceFolderPath, "_" + branch + ".zip"));
                switch (parsedProjectZipUrl.protocol) {
                    case 'http:':
                        protocol = http_1.default;
                        break;
                    case 'https:':
                        protocol = https_1.default;
                        break;
                }
                return [2 /*return*/, new Promise(function (resolve) {
                        parsedProjectZipUrl.host = 'codeload.github.com';
                        if (protocol !== null) {
                            protocol.get(url_1.default.format(parsedProjectZipUrl), function (response) {
                                var eventInfo = {
                                    repoUrl: repoUrl,
                                    sourceFolderPath: sourceFolderPath,
                                    branch: branch
                                };
                                _this.events.emit(eventSignal_1.getEventSignal('projectDownloadStart'), eventInfo);
                                var file = fs_1.default.createWriteStream(path_1.default.join(sourceFolderPath, "_" + branch + ".zip"));
                                var contentLength = 0;
                                var currentLength = 0;
                                if (response.headers['content-length'])
                                    contentLength =
                                        parseInt(response.headers['content-length'], 10);
                                response.pipe(file);
                                response.on('data', function (chunk) {
                                    currentLength += chunk.length;
                                    var percentage = (100.0 * (currentLength / contentLength)).toFixed(2);
                                    _this.events.emit(eventSignal_1.getEventSignal('projectDownloadProgress'), percentage, eventInfo);
                                });
                                response.on('end', function () {
                                    file.end();
                                });
                                file.on('finish', function () {
                                    _this.events.emit(eventSignal_1.getEventSignal('projectDownloadEnd'), eventInfo);
                                    resolve();
                                });
                                response.on('error', function () {
                                    resolve();
                                });
                            });
                        }
                    })];
            });
        });
    };
    Update.prototype.extractProjectZip = function (repoUrl, branch, sourceFolderPath) {
        if (branch === void 0) { branch = 'master'; }
        var zip = new adm_zip_1.default(path_1.default.join(sourceFolderPath, "_" + branch + ".zip"));
        var zipEntries = zip.getEntries(); // an array of ZipEntry records
        zip.extractEntryTo(zipEntries[0], sourceFolderPath, false, true);
        fs_1.default.unlinkSync(path_1.default.join(sourceFolderPath, "_" + branch + ".zip"));
        var eventInfo = {
            repoUrl: repoUrl,
            sourceFolderPath: sourceFolderPath,
            branch: branch
        };
        this.events.emit(eventSignal_1.getEventSignal('projectExtractComplete'), eventInfo);
    };
    Update.prototype.getNewestGitHubCommit = function (repoUrl, callback) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getGitHubCommits(repoUrl, function (body) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!(!body || typeof body[0] == 'undefined' || typeof body[0]['commit'] == 'undefined')) return [3 /*break*/, 2];
                                        return [4 /*yield*/, callback()];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                    case 2: return [4 /*yield*/, callback({
                                            message: body[0].commit.message,
                                            name: body[0].commit.committer.name,
                                            date: body[0].commit.committer.date
                                        })];
                                    case 3:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Update.prototype.getGitHubCommits = function (repoUrl, callback) {
        var _this = this;
        var options = {
            hostname: 'api.github.com',
            port: 443,
            path: ("/repos/" + repoUrl.split("github.com/")[1].split(".git")[0] + "/commits").replace('//', '/'),
            method: 'GET',
            headers: { 'user-agent': 'easy-github-updater' }
        };
        return new Promise(function (resolve) {
            var body = '';
            var request = https_1.default.request(options, function (response) {
                response.on('data', function (chunk) {
                    body += chunk;
                });
                response.on("end", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    return tslib_1.__generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                body = JSON.parse(body);
                                return [4 /*yield*/, callback(body)];
                            case 1:
                                _a.sent();
                                resolve();
                                return [2 /*return*/];
                        }
                    });
                }); });
                response.on('error', function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    return tslib_1.__generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, callback(undefined)];
                            case 1:
                                _a.sent();
                                resolve();
                                return [2 /*return*/];
                        }
                    });
                }); });
            });
            request.end();
        });
    };
    return Update;
}());
exports.Update = Update;
