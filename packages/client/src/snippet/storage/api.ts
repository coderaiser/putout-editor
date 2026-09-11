const {API_HOST = ''} = process.env;

export default function api(path: string, options?: RequestInit) {
    return fetch(`${API_HOST}/api/v1${path}`, options);
}
