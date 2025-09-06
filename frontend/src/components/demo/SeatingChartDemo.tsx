import { useParams } from 'react-router';
import { useGetEventPublic } from '../../queries/useGetEventPublic';
import { LoadingOverlay, Container, Title, Box, Button, Group, Text } from '@mantine/core';
import { SeatingChart } from '../routes/product-widget/SeatingChart';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';

export const SeatingChartDemo = () => {
    const { eventId } = useParams();
    const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
    const { data: event, isLoading } = useGetEventPublic(Number(eventId));

    const handleProceedToCheckout = () => {
        if (selectedSeats.length === 0) {
            notifications.show({
                title: 'No Seats Selected',
                message: 'Please select at least one seat to continue',
                color: 'orange',
            });
            return;
        }

        notifications.show({
            title: 'Demo Mode',
            message: `Would proceed to checkout with ${selectedSeats.length} selected seat(s)`,
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

    return (
        <Container size="lg" py="xl">
            <Title order={1} mb="xl">Seating Chart Demo</Title>
            
            <Box mb="xl">
                <Text size="lg" mb="md">Event: {event.title}</Text>
                <Text c="dimmed" mb="lg">
                    This demo shows the interactive seating chart functionality. Click on seats to select them.
                </Text>
            </Box>

            <SeatingChart
                event={demoEvent}
                onSeatsSelected={setSelectedSeats}
                selectedSeats={selectedSeats}
            />

            <Group justify="center" mt="xl">
                <Button
                    size="lg"
                    onClick={handleProceedToCheckout}
                    disabled={selectedSeats.length === 0}
                >
                    Proceed to Checkout ({selectedSeats.length} seats)
                </Button>
            </Group>
        </Container>
    );
};