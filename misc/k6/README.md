# K6 Load Tests for Hi.Events

This directory contains K6 load tests to simulate high traffic scenarios for the Hi.Events platform.

## Test Files

### 1. `1000-customers-event-page-load-test.js`
Simulates 1000 customers simultaneously loading an event page.

**Endpoint tested:** `/public/events/{event_id}`

**Test characteristics:**
- 1000 virtual users
- 60-second duration
- Tests event page loading performance
- Includes response time and data validation checks

### 2. `1000-customers-qr-code-load-test.js`
Simulates 1000 customers loading their QR code command/ticket information.

**Endpoint tested:** `/public/events/{event_id}/attendees/{attendee_short_id}`

**Test characteristics:**
- 1000 virtual users  
- 60-second duration
- Tests attendee/QR code data retrieval performance
- Handles both successful responses and expected 404s for mock data

### 3. `event-hompage-load-test.js` (existing)
Original smaller-scale test for event homepage loading.

## Running the Tests

### Prerequisites
- Install K6: https://k6.io/docs/getting-started/installation/

### Basic Usage

```bash
# Run the event page load test
k6 run misc/k6/1000-customers-event-page-load-test.js

# Run the QR code load test  
k6 run misc/k6/1000-customers-qr-code-load-test.js
```

### Customizing Test Parameters

You can override default values using environment variables:

```bash
# Custom event ID and base URL
k6 run -e EVENT_ID=123 -e BASE_URL=https://your-api.com misc/k6/1000-customers-event-page-load-test.js

# For QR code test, you can also specify attendee ID
k6 run -e EVENT_ID=123 -e ATTENDEE_SHORT_ID=abc12345 misc/k6/1000-customers-qr-code-load-test.js
```

### Scaling Tests

You can adjust the load by modifying the options in the test files or using K6 CLI options:

```bash
# Run with different user count and duration
k6 run --vus 500 --duration 30s misc/k6/1000-customers-event-page-load-test.js
```

## Test Results

The tests will output metrics including:
- Response times (avg, min, max, p95)
- Request rates  
- Error rates
- Custom check pass rates

## Notes

- The QR code test uses mock attendee IDs by default since real attendee data may not be available in test environments
- Response time thresholds are set to 2000ms to account for high load conditions
- Tests include realistic user behavior simulation with random sleep intervals
- Both tests accept 404 responses as valid for attendee endpoints when using mock data