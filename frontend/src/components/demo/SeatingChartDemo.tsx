import { useParams } from 'react-router';
import { useGetEventPublic } from '../../queries/useGetEventPublic';
import { LoadingOverlay, Container, Title, Box, Button, Group, Text } from '@mantine/core';
import { SeatingChart } from '../routes/product-widget/SeatingChart';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';

interface ZoneSelection {
    zone_id: string;
    quantity: number;
}

export const SeatingChartDemo = () => {
    const { eventId } = useParams();
    const [selectedZones, setSelectedZones] = useState<ZoneSelection[]>([]);
    const { data: event, isLoading } = useGetEventPublic(Number(eventId));

    const handleProceedToCheckout = () => {
        if (selectedZones.length === 0) {
            notifications.show({
                title: 'No Zones Selected',
                message: 'Please select at least one zone to continue',
                color: 'orange',
            });
            return;
        }

        const totalTickets = selectedZones.reduce((sum, zone) => sum + zone.quantity, 0);

        notifications.show({
            title: 'Demo Mode',
            message: `Would proceed to checkout with ${totalTickets} ticket(s) from ${selectedZones.length} zone(s)`,
            color: 'blue',
        });
    };

    if (isLoading) {
        return (
            <Container size="lg" py="xl">
                <LoadingOverlay visible />
            </Container>
        );
    }

    if (!event) {
        return (
            <Container size="lg" py="xl">
                <Title order={2}>Event not found</Title>
            </Container>
        );
    }

    // For demo purposes, enable seating chart even if not set in the event
    const demoEvent = { ...event, enable_seating_chart: true };

    const totalTickets = selectedZones.reduce((sum, zone) => sum + zone.quantity, 0);

    return (
        <Container size="lg" py="xl">
            <Title order={1} mb="xl">Zone-Based Seating Demo</Title>
            
            <Box mb="xl">
                <Text size="lg" mb="md">Event: {event.title}</Text>
                <Text c="dimmed" mb="lg">
                    This demo shows the simplified zone-based seating functionality. Select zones and quantities to reserve tickets.
                </Text>
            </Box>

            <SeatingChart
                event={demoEvent}
                onSeatsSelected={setSelectedZones}
                selectedSeats={selectedZones}
            />

            <Group justify="center" mt="xl">
                <Button
                    size="lg"
                    onClick={handleProceedToCheckout}
                    disabled={totalTickets === 0}
                >
                    Proceed to Checkout ({totalTickets} tickets)
                </Button>
            </Group>
        </Container>
    );
};