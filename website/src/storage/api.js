import 'isomorphic-fetch';

const {
    API_HOST = '',
} = process.env;

export default function api(path, options) {
    return fetch(`${API_HOST}/api/v1${path}`, options);
}
