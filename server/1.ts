export @Injectable()
class GithubService {
    constructor(@Inject('OCTOKIT') private readonly octokit: Octokit) {}
}
