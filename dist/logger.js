"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = function (log, noPrint) {
    if (noPrint === void 0) { noPrint = false; }
    var now = new Date();
    var timeFormat = String();
    timeFormat += (String(now.getHours()).length > 1 ? now.getHours() : '0' + now.getHours());
    timeFormat += ':' + (String(now.getMinutes()).length > 1 ? now.getMinutes() : '0' + now.getMinutes());
    timeFormat += ':' + (String(now.getSeconds()).length > 1 ? now.getSeconds() : '0' + now.getSeconds()) + "";
    var defaultFormat = String.fromCharCode(0x1b) + "[34;1m" + "[%time%] " + String.fromCharCode(0x1b) + "[37;1m" + "%log%";
    if (!noPrint)
        console.log(defaultFormat.replace('%time%', timeFormat).replace('%log%', log));
    return defaultFormat.replace('%time%', timeFormat).replace('%log%', log);
};
