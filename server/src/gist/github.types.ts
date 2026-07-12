import type {Octokit} from '@octokit/rest';

type OctokitUpdateResponse =
    ReturnType<Octokit['rest']['gists']['update']>;

type OctokitUpdateParams = {
    gist_id: string;
    description?: string;
    files?: {
        [key: string]: {
            content?: string;
            filename?: string | null;
        } | null;
    };
};

export type GithubClient = Omit<Octokit, 'rest'> & {
    rest: Omit<Octokit['rest'], 'gists'> & {
        gists: Omit<Octokit['rest']['gists'], 'update'> & {
            update(
                params: OctokitUpdateParams,
            ): OctokitUpdateResponse;
        };
    };
};
