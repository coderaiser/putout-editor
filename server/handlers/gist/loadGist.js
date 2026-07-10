import {Octokit} from '@octokit/rest';
import {AUTH_TOKEN} from '../../constants.js';

export default function loadGist(req, res, next) {
    const octokit = new Octokit({
        auth: AUTH_TOKEN,
    });
    
    const latest = req.params.revisionid === 'latest';
    
    octokit.rest.gists.get({
        gist_id: req.params.snippetid,
        ...(!latest && {sha: req.params.revisionid}),
    })
        .then((response) => res.json(response.data))
        .catch(next);
}
