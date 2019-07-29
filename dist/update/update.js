"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var events_1 = tslib_1.__importDefault(require("events"));
var nested_static_1 = tslib_1.__importDefault(require("nested-static"));
var path_1 = tslib_1.__importDefault(require("path"));
var url_1 = tslib_1.__importDefault(require("url"));
var https_1 = tslib_1.__importDefault(require("https"));
var fs_extra_1 = tslib_1.__importStar(require("fs-extra"));
var eventSignal_1 = require("./eventSignal");
var adm_zip_1 = tslib_1.__importDefault(require("adm-zip"));
var wildcard_1 = tslib_1.__importDefault(require("wildcard"));
exports.collectFilePaths = function (folderPath) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var _this = this;
    return tslib_1.__generator(this, function (_a) {
        // Search all of the child folders
        return [2 /*return*/, new Promise(function (resolve) {
                nested_static_1.default(folderPath, function (folders) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    var data, _i, folders_1, folder, files, _a, files_1, file, filePath, stats;
                    return tslib_1.__generator(this, function (_b) {
                        data = [];
                        for (_i = 0, folders_1 = folders; _i < folders_1.length; _i++) {
                            folder = folders_1[_i];
                            files = fs_extra_1.default.readdirSync(folder.staticPath);
                            // Search all of the files
                            for (_a = 0, files_1 = files; _a < files_1.length; _a++) {
                                file = files_1[_a];
                                filePath = folder.staticPath + '/' + file;
                                stats = fs_extra_1.default.statSync(filePath);
                                if (stats.isDirectory())
                                    continue;
                                data.push({
                                    subPath: folder.subPath,
                                    staticPath: folder.staticPath,
                                    filePath: filePath,
                                    fileName: file
                                });
                            }
                        }
                        resolve(data);
                        return [2 /*return*/];
                    });
                }); });
            })];
    });
}); };
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
            var packageJsonUrl, packageJson;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                if (repoUrl[repoUrl.length - 1] != '/')
                    repoUrl += '/';
                packageJsonUrl = url_1.default.resolve(repoUrl, branch + "/package.json");
                packageJsonUrl = packageJsonUrl.replace('github.com/', 'raw.githubusercontent.com/');
                packageJson = '';
                return [2 /*return*/, new Promise(function (resolve) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var request;
                        var _this = this;
                        return tslib_1.__generator(this, function (_a) {
                            request = https_1.default.request(packageJsonUrl, function (response) {
                                response.on('data', function (chunk) {
                                    packageJson += chunk;
                                });
                                response.on("end", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
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
                                response.on('error', function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                    return tslib_1.__generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, callback()];
                                            case 1:
                                                _a.sent();
                                                resolve();
                                                return [2 /*return*/];
                                        }
                                    });
                                }); });
                            });
                            request.end();
                            return [2 /*return*/];
                        });
                    }); })];
            });
        });
    };
    Update.prototype.downloadWebProjectZip = function (repoUrl, branch, sourceFolderPath) {
        var _this = this;
        if (branch === void 0) { branch = 'master'; }
        if (repoUrl[repoUrl.length - 1] != '/')
            repoUrl += '/';
        var projectZipUrl = url_1.default.resolve(repoUrl, "zip/" + branch);
        projectZipUrl = projectZipUrl.replace('github.com/', 'codeload.github.com/');
        if (fs_extra_1.default.existsSync(path_1.default.join(sourceFolderPath, "_" + branch + ".zip")))
            fs_extra_1.default.unlinkSync(path_1.default.join(sourceFolderPath, "_" + branch + ".zip"));
        var request = https_1.default.request(projectZipUrl, function (response) {
            var eventInfo = {
                repoUrl: repoUrl,
                sourceFolderPath: sourceFolderPath,
                branch: branch
            };
            _this.events.emit(eventSignal_1.getEventSignal('projectDownloadStart'), eventInfo);
            var file = fs_extra_1.default.createWriteStream(path_1.default.join(sourceFolderPath, "_" + branch + ".zip"));
            var contentLength = 0;
            var currentLength = 0;
            if (response.headers['content-length'])
                contentLength =
                    parseInt(response.headers['content-length'], 10);
            var pipe = response.pipe(file);
            response.on('data', function (chunk) {
                currentLength += chunk.length;
                var percentage = (100.0 * (currentLength / contentLength)).toFixed(2);
                _this.events.emit(eventSignal_1.getEventSignal('projectDownloadProgress'), percentage, eventInfo);
            });
            response.on('end', function () {
                _this.events.emit(eventSignal_1.getEventSignal('projectDownloadEnd'), eventInfo);
            });
        });
        request.end();
    };
    Update.prototype.extractProjectZip = function (repoUrl, branch, sourceFolderPath, rebase, keep) {
        var _this = this;
        if (branch === void 0) { branch = 'master'; }
        if (rebase === void 0) { rebase = true; }
        if (keep === void 0) { keep = []; }
        // COLLECT BEFORE FILE LISTS
        var fieldName = "_updatedata_" + branch;
        setTimeout(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var zip, zipEntries, subFile, before, after, diff, _i, after_1, afterItem, isLegacyFile, _a, before_1, beforeItem, _b, diff_1, diffItem, isKeepItem, _c, keep_1, keepItem, e_1, e_2, eventInfo;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 10, , 16]);
                        zip = new adm_zip_1.default(path_1.default.join(sourceFolderPath, "_" + branch + ".zip"));
                        zipEntries = zip.getEntries() // an array of ZipEntry records
                        ;
                        zip.extractAllTo(sourceFolderPath + "/" + fieldName, /*overwrite*/ true);
                        subFile = fs_extra_1.readdirSync(sourceFolderPath + "/" + fieldName);
                        return [4 /*yield*/, exports.collectFilePaths(sourceFolderPath + "/" + fieldName + "/" + subFile[0])];
                    case 1:
                        before = _d.sent();
                        return [4 /*yield*/, fs_extra_1.default.copySync(sourceFolderPath + "/" + fieldName + "/" + subFile[0], sourceFolderPath)];
                    case 2:
                        _d.sent();
                        return [4 /*yield*/, fs_extra_1.default.unlinkSync(path_1.default.join(sourceFolderPath, "_" + branch + ".zip"))];
                    case 3:
                        _d.sent();
                        return [4 /*yield*/, fs_extra_1.default.remove(sourceFolderPath + "/" + fieldName)
                            // COLLECT AFTER FILE LISTS
                        ];
                    case 4:
                        _d.sent();
                        return [4 /*yield*/, exports.collectFilePaths(sourceFolderPath)];
                    case 5:
                        after = _d.sent();
                        diff = [];
                        for (_i = 0, after_1 = after; _i < after_1.length; _i++) {
                            afterItem = after_1[_i];
                            isLegacyFile = true;
                            for (_a = 0, before_1 = before; _a < before_1.length; _a++) {
                                beforeItem = before_1[_a];
                                if (beforeItem.subPath == afterItem.subPath
                                    && beforeItem.fileName == afterItem.fileName) {
                                    isLegacyFile = false;
                                    break;
                                }
                            }
                            if (isLegacyFile)
                                diff.push(afterItem);
                        }
                        _b = 0, diff_1 = diff;
                        _d.label = 6;
                    case 6:
                        if (!(_b < diff_1.length)) return [3 /*break*/, 9];
                        diffItem = diff_1[_b];
                        if (!rebase) return [3 /*break*/, 8];
                        isKeepItem = false;
                        if (Array.isArray(keep)) {
                            for (_c = 0, keep_1 = keep; _c < keep_1.length; _c++) {
                                keepItem = keep_1[_c];
                                if (wildcard_1.default(keepItem, "" + diffItem.subPath + diffItem.fileName)) {
                                    isKeepItem = true;
                                    break;
                                }
                            }
                        }
                        if (!!isKeepItem) return [3 /*break*/, 8];
                        return [4 /*yield*/, fs_extra_1.default.unlinkSync(diffItem.staticPath + "/" + diffItem.fileName)];
                    case 7:
                        _d.sent();
                        _d.label = 8;
                    case 8:
                        _b++;
                        return [3 /*break*/, 6];
                    case 9: return [3 /*break*/, 16];
                    case 10:
                        e_1 = _d.sent();
                        _d.label = 11;
                    case 11:
                        _d.trys.push([11, 14, , 15]);
                        return [4 /*yield*/, fs_extra_1.default.unlinkSync(path_1.default.join(sourceFolderPath, "_" + branch + ".zip"))];
                    case 12:
                        _d.sent();
                        return [4 /*yield*/, fs_extra_1.default.remove(sourceFolderPath + "/" + fieldName)];
                    case 13:
                        _d.sent();
                        return [3 /*break*/, 15];
                    case 14:
                        e_2 = _d.sent();
                        return [3 /*break*/, 15];
                    case 15: return [3 /*break*/, 16];
                    case 16:
                        eventInfo = {
                            repoUrl: repoUrl,
                            sourceFolderPath: sourceFolderPath,
                            branch: branch
                        };
                        this.events.emit(eventSignal_1.getEventSignal('projectExtractComplete'), eventInfo);
                        return [2 /*return*/];
                }
            });
        }); }, 1000);
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
