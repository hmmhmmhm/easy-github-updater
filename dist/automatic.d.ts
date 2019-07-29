export declare const automatic: ({ waitTime, branch, repoUrl, sourceFolderPath, isNeedDefaultProcess, force, rebase, keep }: {
    waitTime: number;
    branch: string;
    repoUrl?: string | undefined;
    sourceFolderPath: string;
    isNeedDefaultProcess?: boolean | undefined;
    force: boolean;
    rebase: boolean;
    keep: string[];
}) => void;
