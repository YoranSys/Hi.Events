import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    vus: 1000, // 1000 virtual users (customers)
    duration: '60s', // Run for 60 seconds to simulate sustained load
};

export default function () {
    // Use a configurable event ID - can be overridden via environment variable
    const eventId = __ENV.EVENT_ID || '2';
    const baseUrl = __ENV.BASE_URL || 'https://api.hi.events';
    
    let res = http.get(`${baseUrl}/public/events/${eventId}`, {
        headers: {
            'Accept': 'application/json',
            'User-Agent': 'k6-load-test/1.0',
        },
    });

    check(res, {
        'status is 200': (r) => r.status === 200,
        'response time < 2000ms': (r) => r.timings.duration < 2000,
        'response is JSON': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
        'response has event data': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body && typeof body === 'object';
            } catch (e) {
                return false;
            }
        },
    });

    // Add a small random sleep between 1-3 seconds to simulate realistic user behavior
    sleep(Math.random() * 2 + 1);
}