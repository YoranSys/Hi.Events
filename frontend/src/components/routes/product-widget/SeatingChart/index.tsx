import React, { useState, useEffect } from 'react';
import { Box, Button, Group, Text, Badge, Alert, LoadingOverlay, NumberInput, Card, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconMapPin } from '@tabler/icons-react';
import { Event } from '../../../../types';
import { getSessionIdentifier } from '../../../../utilites/sessionIdentifier';
import { useGetEventSeats } from '../../../../queries/useGetEventSeats';
import { useReserveZones } from '../../../../mutations/useReserveSeats';

interface Zone {
    id: string;
    name: string;
    capacity: number;
    available_capacity: number;
    price: number;
    color: string;
    reserved_count: number;
    held_count: number;
}

interface Venue {
    id: number;
    name: string;
    layout_config?: any;
}

interface SeatingChartData {
    zones: Zone[];
    venue: Venue | null;
    seating_enabled: boolean;
}

interface ZoneSelection {
    zone_id: string;
    quantity: number;
}

interface SeatingChartProps {
    event: Event;
    onSeatsSelected: (selections: ZoneSelection[]) => void;
    selectedSeats: ZoneSelection[];
}

export const SeatingChart: React.FC<SeatingChartProps> = ({
    event,
    onSeatsSelected,
    selectedSeats
}) => {
    const [zoneSelections, setZoneSelections] = useState<ZoneSelection[]>(selectedSeats);
    const [reservationExpiry, setReservationExpiry] = useState<Date | null>(null);

    const { data: seatingData, isLoading: loading, error } = useGetEventSeats(event.id);
    const reserveZonesMutation = useReserveZones();

    useEffect(() => {
        setZoneSelections(selectedSeats);
    }, [selectedSeats]);

    const reserveZones = async () => {
        if (zoneSelections.length === 0) return;

        try {
            const result = await reserveZonesMutation.mutateAsync({
                eventId: event.id,
                data: {
                    zone_selections: zoneSelections,
                    session_identifier: getSessionIdentifier()
                }
            });

            setReservationExpiry(new Date(result.expires_at));
            notifications.show({
                title: 'Zones Reserved',
                message: `${result.total_tickets} ticket(s) reserved for 15 minutes`,
                color: 'green',
                icon: <IconCheck size="1rem" />
            });
        } catch (error: any) {
            notifications.show({
                title: 'Reservation Failed',
                message: error.response?.data?.message || 'Failed to reserve zones',
                color: 'red',
                icon: <IconX size="1rem" />
            });
        }
    };

    const handleQuantityChange = (zoneId: string, quantity: number) => {
        const existingSelections = zoneSelections.filter(s => s.zone_id !== zoneId);
        const newSelections = quantity > 0 
            ? [...existingSelections, { zone_id: zoneId, quantity }]
            : existingSelections;

        setZoneSelections(newSelections);
        onSeatsSelected(newSelections);
    };

    const getTotalTickets = () => {
        return zoneSelections.reduce((sum, selection) => sum + selection.quantity, 0);
    };

    const getTotalPrice = () => {
        if (!seatingData?.zones) return 0;
        return zoneSelections.reduce((sum, selection) => {
            const zone = seatingData.zones.find(z => z.id === selection.zone_id);
            return sum + ((zone?.price || 0) * selection.quantity);
        }, 0);
    };

    if (loading) {
        return (
            <Box style={{ position: 'relative', minHeight: 400 }}>
                <LoadingOverlay visible />
            </Box>
        );
    }

    if (!seatingData?.seating_enabled || !seatingData.venue) {
        return null; // Fall back to regular product selection
    }

    const { zones, venue } = seatingData;

    return (
        <Box>
            <Group mb="md">
                <IconMapPin size="1.2rem" />
                <Text size="lg" fw={600}>
                    Select Zones - {venue.name}
                </Text>
            </Group>

            {reservationExpiry && (
                <Alert mb="md" color="blue">
                    Your zone selection expires at {reservationExpiry.toLocaleTimeString()}
                </Alert>
            )}

            <Stack gap="md" mb="lg">
                {zones.map((zone) => {
                    const currentSelection = zoneSelections.find(s => s.zone_id === zone.id);
                    const selectedQuantity = currentSelection?.quantity || 0;
                    const isAvailable = zone.available_capacity > 0;

                    return (
                        <Card 
                            key={zone.id} 
                            withBorder 
                            style={{ 
                                borderColor: isAvailable ? zone.color : '#ccc',
                                opacity: isAvailable ? 1 : 0.7
                            }}
                        >
                            <Group justify="space-between" align="flex-start">
                                <Box style={{ flex: 1 }}>
                                    <Group mb="xs">
                                        <Box
                                            w={16}
                                            h={16}
                                            style={{
                                                backgroundColor: isAvailable ? zone.color : '#ccc',
                                                borderRadius: 4,
                                                border: '1px solid #ddd'
                                            }}
                                        />
                                        <Text fw={500} size="lg">{zone.name}</Text>
                                        <Badge variant="light" color={isAvailable ? 'green' : 'red'}>
                                            {zone.available_capacity} / {zone.capacity} available
                                        </Badge>
                                    </Group>
                                    
                                    <Text size="sm" c="dimmed" mb="xs">
                                        Price: ${zone.price.toFixed(2)} per ticket
                                    </Text>
                                    
                                    {selectedQuantity > 0 && (
                                        <Text size="sm" fw={500} c="blue">
                                            Selected: {selectedQuantity} tickets (${(zone.price * selectedQuantity).toFixed(2)})
                                        </Text>
                                    )}
                                </Box>

                                <Box style={{ minWidth: 120 }}>
                                    <NumberInput
                                        label="Quantity"
                                        placeholder="0"
                                        min={0}
                                        max={zone.available_capacity}
                                        value={selectedQuantity}
                                        onChange={(value) => handleQuantityChange(zone.id, Number(value) || 0)}
                                        disabled={!isAvailable}
                                        size="sm"
                                    />
                                </Box>
                            </Group>
                        </Card>
                    );
                })}
            </Stack>

            <Group justify="space-between" align="center" p="md" style={{ backgroundColor: '#f8f9fa', borderRadius: 8 }}>
                <Box>
                    <Text size="sm" c="dimmed">Total Selection</Text>
                    <Text fw={600}>
                        {getTotalTickets()} ticket(s) - ${getTotalPrice().toFixed(2)}
                    </Text>
                </Box>
                
                {getTotalTickets() > 0 && (
                    <Button 
                        onClick={reserveZones}
                        loading={reserveZonesMutation.isPending}
                    >
                        Reserve Selected Zones
                    </Button>
                )}
            </Group>

            {zoneSelections.length > 0 && (
                <Box mt="md">
                    <Text size="sm" fw={500} mb="xs">Selected Zones:</Text>
                    <Group>
                        {zoneSelections.map(selection => {
                            const zone = zones.find(z => z.id === selection.zone_id);
                            return zone ? (
                                <Badge key={selection.zone_id} variant="light" size="lg">
                                    {zone.name}: {selection.quantity} tickets
                                </Badge>
                            ) : null;
                        })}
                    </Group>
                </Box>
            )}
        </Box>
    );
};