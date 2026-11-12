import {montag} from 'montag';

export default montag`
    __putout_processor_yaml({
        "jobs": {
            "build": {
                "needs": [],
                "runs-on": "ubuntu-latest"
            }
        }
    });
`;
