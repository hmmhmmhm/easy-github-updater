import Event from 'events';
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
    downloadWebProjectZip(repoUrl: string, branch: string | undefined, sourceFolderPath: string): Promise<{}>;
    extractProjectZip(repoUrl: string, branch: string | undefined, sourceFolderPath: string): void;
    getNewestGitHubCommit(callback: (data?: {
        message: any;
        name: any;
        date: any;
    }) => Promise<void>): Promise<void>;
    getGitHubCommits(callback: (data?: any) => Promise<void>): Promise<{}>;
}
