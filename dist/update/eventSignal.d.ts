export declare type EventSignalType = `startCallback` | `newVersionDetected` | `alreadyHighestVersion` | `projectDownloadStart` | `projectDownloadProgress` | `projectDownloadEnd` | `projectExtractComplete`;
/**
 * `Type ''`
 * @param value
 */
export declare const getEventSignal: (value: EventSignalType) => EventSignalType;
