import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    vus: 1000, // 1000 virtual users (customers)
    duration: '60s', // Run for 60 seconds to simulate sustained load
};

export default function () {
    // Use configurable event ID and attendee short ID - can be overridden via environment variables
    const eventId = __ENV.EVENT_ID || '2';
    const baseUrl = __ENV.BASE_URL || 'https://api.hi.events';
    
    // Generate a realistic attendee short ID or use provided one
    // In a real scenario, these would be actual attendee IDs from the database
    const attendeeShortId = __ENV.ATTENDEE_SHORT_ID || generateMockAttendeeId();
    
    let res = http.get(`${baseUrl}/public/events/${eventId}/attendees/${attendeeShortId}`, {
        headers: {
            'Accept': 'application/json',
            'User-Agent': 'k6-qr-load-test/1.0',
        },
    });

    check(res, {
        'status is 200 or 404': (r) => r.status === 200 || r.status === 404, // 404 is acceptable for mock IDs
        'response time < 2000ms': (r) => r.timings.duration < 2000,
        'successful responses are JSON': (r) => {
            if (r.status !== 200) return true; // Skip JSON check for non-200 responses
            return r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json');
        },
        'successful responses have attendee data': (r) => {
            if (r.status !== 200) return true; // Skip check for non-200 responses
            try {
                const body = JSON.parse(r.body);
                return body && typeof body === 'object';
            } catch (e) {
                return false;
            }
        },
    });

    // Add a small random sleep between 0.5-2 seconds to simulate QR code scanning behavior
    sleep(Math.random() * 1.5 + 0.5);
}

// Generate a mock attendee short ID for testing purposes
// In production, real attendee IDs should be used
function generateMockAttendeeId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}