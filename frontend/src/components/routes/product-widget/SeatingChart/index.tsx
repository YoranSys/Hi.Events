import React, { useState, useEffect } from 'react';
import { Box, Button, Group, Text, Badge, Alert, LoadingOverlay } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { Event } from '../../../../types';
import { getSessionIdentifier } from '../../../../utilites/sessionIdentifier';
import { useGetEventSeats } from '../../../../queries/useGetEventSeats';
import { useReserveSeats } from '../../../../mutations/useReserveSeats';

interface Seat {
    id: number;
    seat_identifier: string;
    section?: string;
    row?: string;
    seat_number?: string;
    x_position: number;
    y_position: number;
    price: number;
    seat_type: string;
    is_available: boolean;
    status: string;
}

interface Venue {
    id: number;
    name: string;
    layout_config?: any;
}

interface SeatingChartData {
    seats: Seat[];
    venue: Venue | null;
    seating_enabled: boolean;
}

interface SeatingChartProps {
    event: Event;
    onSeatsSelected: (seatIds: number[]) => void;
    selectedSeats: number[];
}

const SEAT_COLORS = {
    available: '#4CAF50',
    selected: '#2196F3',
    held: '#FF9800',
    reserved: '#f44336',
    sold: '#757575'
};

export const SeatingChart: React.FC<SeatingChartProps> = ({
    event,
    onSeatsSelected,
    selectedSeats
}) => {
    const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>(selectedSeats);
    const [reservationExpiry, setReservationExpiry] = useState<Date | null>(null);

    const { data: seatingData, isLoading: loading, error } = useGetEventSeats(event.id);
    const reserveSeatsMutation = useReserveSeats();

    useEffect(() => {
        setSelectedSeatIds(selectedSeats);
    }, [selectedSeats]);

    const reserveSeats = async () => {
        if (selectedSeatIds.length === 0) return;

        try {
            const result = await reserveSeatsMutation.mutateAsync({
                eventId: event.id,
                data: {
                    seat_ids: selectedSeatIds,
                    session_identifier: getSessionIdentifier()
                }
            });

            setReservationExpiry(new Date(result.expires_at));
            notifications.show({
                title: 'Seats Reserved',
                message: `${selectedSeatIds.length} seat(s) reserved for 15 minutes`,
                color: 'green',
                icon: <IconCheck size="1rem" />
            });
        } catch (error: any) {
            notifications.show({
                title: 'Reservation Failed',
                message: error.response?.data?.message || 'Failed to reserve seats',
                color: 'red',
                icon: <IconX size="1rem" />
            });
        }
    };

    const handleSeatClick = (seat: Seat) => {
        if (!seat.is_available) return;

        const isSelected = selectedSeatIds.includes(seat.id);
        const newSelectedSeats = isSelected
            ? selectedSeatIds.filter(id => id !== seat.id)
            : [...selectedSeatIds, seat.id];

        setSelectedSeatIds(newSelectedSeats);
        onSeatsSelected(newSelectedSeats);
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

    const { seats, venue } = seatingData;

    // Simple SVG seating layout
    const svgWidth = 600;
    const svgHeight = 400;

    return (
        <Box>
            <Text size="lg" fw={600} mb="md">
                Select Your Seats - {venue.name}
            </Text>

            {reservationExpiry && (
                <Alert mb="md" color="blue">
                    Your seat selection expires at {reservationExpiry.toLocaleTimeString()}
                </Alert>
            )}

            <Box mb="md">
                <Group>
                    {Object.entries(SEAT_COLORS).map(([status, color]) => (
                        <Group key={status} gap={5}>
                            <Box
                                w={16}
                                h={16}
                                style={{
                                    backgroundColor: color,
                                    borderRadius: 2,
                                    border: '1px solid #ccc'
                                }}
                            />
                            <Text size="sm" c="dimmed" tt="capitalize">{status}</Text>
                        </Group>
                    ))}
                </Group>
            </Box>

            <Box
                style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 8,
                    overflow: 'hidden',
                    marginBottom: 16
                }}
            >
                <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                    {/* Stage indicator */}
                    <rect
                        x={svgWidth * 0.2}
                        y={20}
                        width={svgWidth * 0.6}
                        height={40}
                        fill="#f0f0f0"
                        stroke="#ccc"
                        rx={5}
                    />
                    <text
                        x={svgWidth / 2}
                        y={45}
                        textAnchor="middle"
                        fontSize="14"
                        fill="#666"
                    >
                        STAGE
                    </text>

                    {/* Render seats */}
                    {seats.map((seat) => {
                        const isSelected = selectedSeatIds.includes(seat.id);
                        let seatColor = SEAT_COLORS.available;
                        
                        if (!seat.is_available) {
                            seatColor = seat.status === 'held' ? SEAT_COLORS.held : SEAT_COLORS.sold;
                        } else if (isSelected) {
                            seatColor = SEAT_COLORS.selected;
                        }

                        // Scale positions to fit SVG
                        const x = (seat.x_position || Math.random()) * svgWidth;
                        const y = (seat.y_position || 100 + Math.random() * 200) + 80;

                        return (
                            <g key={seat.id}>
                                <circle
                                    cx={x}
                                    cy={y}
                                    r={8}
                                    fill={seatColor}
                                    stroke="#333"
                                    strokeWidth={1}
                                    style={{
                                        cursor: seat.is_available ? 'pointer' : 'not-allowed',
                                        opacity: seat.is_available ? 1 : 0.6
                                    }}
                                    onClick={() => handleSeatClick(seat)}
                                />
                                <text
                                    x={x}
                                    y={y + 3}
                                    textAnchor="middle"
                                    fontSize="8"
                                    fill="white"
                                    style={{ pointerEvents: 'none' }}
                                >
                                    {seat.seat_number || seat.id}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </Box>

            <Group justify="space-between">
                <Text size="sm" c="dimmed">
                    {selectedSeatIds.length} seat(s) selected
                </Text>
                
                {selectedSeatIds.length > 0 && (
                    <Button onClick={reserveSeats}>
                        Reserve Selected Seats
                    </Button>
                )}
            </Group>

            {selectedSeatIds.length > 0 && (
                <Box mt="md">
                    <Text size="sm" fw={500} mb="xs">Selected Seats:</Text>
                    <Group>
                        {selectedSeatIds.map(seatId => {
                            const seat = seats.find(s => s.id === seatId);
                            return seat ? (
                                <Badge key={seatId} variant="light">
                                    {seat.section ? `${seat.section}-` : ''}
                                    {seat.row ? `${seat.row}-` : ''}
                                    {seat.seat_number || seat.seat_identifier}
                                    {seat.price > 0 && ` - $${seat.price.toFixed(2)}`}
                                </Badge>
                            ) : null;
                        })}
                    </Group>
                </Box>
            )}
        </Box>
    );
};