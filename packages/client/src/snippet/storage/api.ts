export default function api(path: string, options?: RequestInit) {
    const {API_HOST = ''} = process.env;
    
    return fetch(`${API_HOST}/api/v1${path}`, options);
}
