export type EventSignalType
    = `startCallback`
    | `newVersionDetected`
    | `alreadyHighestVersion`
    | `projectDownloadStart`
    | `projectDownloadProgress`
    | `projectDownloadEnd`
    | `projectExtractComplete`

/**
 * `Type ''`
 * @param value 
 */
export const getEventSignal = (value: EventSignalType) => value