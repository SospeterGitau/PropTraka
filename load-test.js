import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 20 }, // Wrap up to 20 users
        { duration: '1m', target: 20 },  // Stay at 20 users
        { duration: '10s', target: 0 },  // Scale down
    ],
};

const BASE_URL = 'http://localhost:3000'; // Change to deployment URL

export default function () {
    const res = http.get(BASE_URL);
    check(res, { 'status was 200': (r) => r.status == 200 });
    sleep(1);
}
