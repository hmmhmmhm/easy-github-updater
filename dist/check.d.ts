export interface ICheckResult {
    message: string;
    commitDate: string;
    committerName: string;
    data: {
        message: string;
        name: string;
        date: string;
    };
    encodedMessage: string;
}
export declare const check: ({ branch, repoUrl, sourceFolderPath, isNeedDefaultProcess, force }: {
    branch: string;
    repoUrl?: string | undefined;
    sourceFolderPath: string;
    isNeedDefaultProcess?: boolean | undefined;
    force: boolean;
}) => Promise<ICheckResult | undefined>;
