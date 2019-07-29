import Event from 'events';
export interface IPathsType {
    subPath: string;
    staticPath: string;
    filePath: string;
    fileName: string;
}
export declare const collectFilePaths: (folderPath: string) => Promise<IPathsType[]>;
export declare class Update {
    events: Event;
    saveOptions: any;
    constructor();
    getLocalGitInfo(sourceFolderPath?: string): {
        type: string;
        url: string;
        version: string;
    };
    getWebGitInfo(repoUrl: string, branch: string | undefined, callback: (data: {
        type: string;
        version: string;
    }) => Promise<void>): Promise<void>;
    getWebPackageJson(repoUrl: string, branch: string | undefined, callback: (packageJson?: any) => Promise<void>): Promise<{}>;
    downloadWebProjectZip(repoUrl: string, branch: string | undefined, sourceFolderPath: string): void;
    extractProjectZip(repoUrl: string, branch: string | undefined, sourceFolderPath: string, rebase?: boolean, keep?: string[]): void;
    getNewestGitHubCommit(repoUrl: string, callback: (data?: {
        message: any;
        name: any;
        date: any;
    }) => Promise<void>): Promise<void>;
    getGitHubCommits(repoUrl: string, callback: (data?: any) => Promise<void>): Promise<{}>;
}
