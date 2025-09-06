# Interactive Seating Chart Feature

This feature adds interactive seating chart functionality to Hi.Events, allowing event organizers to create visual seat zone maps and customers to select tickets by clicking on zones.

## Features

### Admin/Organizer Features
- Upload venue map images (PNG format)
- Draw polygonal zones on the map using a drag-and-drop interface
- Assign ticket types to each defined zone
- Save zone configurations for reuse
- Visual zone management with color coding

### Customer Features
- Access interactive seating chart via "View Seating" button
- View venue map with color-coded transparent zone overlays
- Click zones to automatically select corresponding ticket type
- Seamless integration with existing checkout flow

## Technical Implementation

### Backend (Laravel/PHP)

#### Database Tables
- `seating_zones` - Stores zone coordinates and associations
- `event_settings` - Extended with seating chart settings

#### API Endpoints
- `GET/POST /api/events/{eventId}/seating-zones` - Zone management (authenticated)
- `PUT/DELETE /api/events/{eventId}/seating-zones/{zoneId}` - Zone updates (authenticated)  
- `GET /api/public/events/{eventId}/seating-zones` - Public zone access

#### Models
- `SeatingZone` - Zone data with Event and Product relationships
- Extended `Event` model with seating zone relationship

### Frontend (React/TypeScript)

#### Components
- `PolygonDrawer` - Admin interface for drawing zones on venue maps
- `InteractiveSeatingChart` - Customer-facing clickable seating chart
- `SeatingChart` - Admin management page for zones

#### Integration
- Added to event management navigation
- Integrated with existing product selection workflow
- Modal-based seating chart viewer for customers

## Usage

### For Event Organizers

1. **Upload Venue Map**
   - Navigate to Event → Seating Chart
   - Upload a PNG venue map image
   - The image serves as the base for zone drawing

2. **Create Zones**
   - Select a ticket/product type
   - Click "Draw Zone" to enter drawing mode
   - Click to place polygon points on the venue map
   - Double-click or use "Finish Zone" when complete
   - Configure zone name and color

3. **Manage Zones**
   - View all zones in the management table
   - Delete zones as needed
   - Zones are automatically associated with selected ticket types

### For Customers

1. **Access Seating Chart**
   - "View Seating" button appears when zones exist
   - Click to open interactive seating chart modal

2. **Select Zones**
   - Hover over zones for visual feedback
   - Click zones to see zone information
   - "Select This Zone" automatically chooses the ticket type
   - Continue with normal quantity selection and checkout

## Technical Details

### Coordinate System
- Zones use relative coordinates (0-1 range)
- Coordinates are stored as JSON arrays: `[[x1,y1], [x2,y2], ...]`
- Minimum 3 points required for valid polygon

### Canvas Rendering
- HTML5 Canvas for interactive drawing and display
- Real-time visual feedback during zone creation
- Color-coded zones with transparency effects

### Data Validation
- Coordinate format validation (arrays of [x,y] pairs)
- Minimum polygon point requirements
- Product association validation
- Color format validation (hex codes)

## File Structure

```
backend/
├── app/
│   ├── Models/SeatingZone.php
│   ├── Http/Actions/SeatingZones/
│   └── Http/Request/SeatingZone/
├── database/migrations/
│   ├── *_create_seating_zones_table.php
│   └── *_add_seating_chart_to_event_settings.php
└── tests/Feature/SeatingZones/

frontend/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── PolygonDrawer/
│   │   │   └── InteractiveSeatingChart/
│   │   └── routes/event/seating-chart/
│   ├── api/seating-zone.client.ts
│   └── queries/useSeatingZones*.ts
```

## Configuration

The feature is automatically available for all events. To use:

1. Create ticket/product types first
2. Upload a venue map in the Seating Chart section
3. Draw zones and assign to ticket types
4. Zones will appear for customers when viewing the event

## Backward Compatibility

- Events without seating zones continue to work normally
- No existing functionality is affected
- Seating chart features only appear when zones exist
- All existing ticket selection methods remain available