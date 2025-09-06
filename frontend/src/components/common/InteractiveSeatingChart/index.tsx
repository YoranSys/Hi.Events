import React, {useRef, useState, useEffect, useCallback} from 'react';
import {Button, Modal, Stack, Text, Group, Badge, Paper} from '@mantine/core';
import {IconMapPin, IconTicket, IconX} from '@tabler/icons-react';
import {t} from '@lingui/macro';
import {SeatingZone} from '../../api/seating-zone.client';

interface Point {
    x: number;
    y: number;
}

interface InteractiveSeatingChartProps {
    imageUrl: string;
    zones: SeatingZone[];
    onZoneSelected: (productId: number, zoneName?: string) => void;
    selectedProductId?: number;
}

export const InteractiveSeatingChart: React.FC<InteractiveSeatingChartProps> = ({
    imageUrl,
    zones,
    onZoneSelected,
    selectedProductId,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const [hoveredZone, setHoveredZone] = useState<number | null>(null);
    const [selectedZone, setSelectedZone] = useState<SeatingZone | null>(null);
    const [showZoneInfo, setShowZoneInfo] = useState(false);

    // Convert relative coordinates to canvas coordinates
    const toCanvasCoords = useCallback((relX: number, relY: number): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return {x: 0, y: 0};
        
        const rect = canvas.getBoundingClientRect();
        return {
            x: relX * rect.width,
            y: relY * rect.height
        };
    }, []);

    // Check if a point is inside a polygon
    const isPointInPolygon = useCallback((point: Point, polygon: [number, number][]): boolean => {
        const canvas = canvasRef.current;
        if (!canvas) return false;
        
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const pi = toCanvasCoords(polygon[i][0], polygon[i][1]);
            const pj = toCanvasCoords(polygon[j][0], polygon[j][1]);
            
            if (((pi.y > point.y) !== (pj.y > point.y)) &&
                (point.x < (pj.x - pi.x) * (point.y - pi.y) / (pj.y - pi.y) + pi.x)) {
                inside = !inside;
            }
        }
        return inside;
    }, [toCanvasCoords]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const image = imageRef.current;
        if (!canvas || !image) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw image
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Draw zones
        zones.forEach((zone) => {
            const isSelected = selectedProductId === zone.product?.id;
            const isHovered = hoveredZone === zone.id;
            
            ctx.beginPath();
            
            // Zone appearance based on state
            if (isSelected) {
                ctx.fillStyle = zone.color + '80'; // More opaque when selected
                ctx.strokeStyle = zone.color;
                ctx.lineWidth = 3;
            } else if (isHovered) {
                ctx.fillStyle = zone.color + '60'; // Medium opacity when hovered
                ctx.strokeStyle = zone.color;
                ctx.lineWidth = 3;
            } else {
                ctx.fillStyle = zone.color + '40'; // Semi-transparent normally
                ctx.strokeStyle = zone.color;
                ctx.lineWidth = 2;
            }

            zone.coordinates.forEach((coord, i) => {
                const point = toCanvasCoords(coord[0], coord[1]);
                if (i === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            });

            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Draw zone label
            const center = zone.coordinates.reduce(
                (acc, coord) => {
                    const point = toCanvasCoords(coord[0], coord[1]);
                    return {x: acc.x + point.x, y: acc.y + point.y};
                },
                {x: 0, y: 0}
            );
            center.x /= zone.coordinates.length;
            center.y /= zone.coordinates.length;

            // Draw background for text
            const text = zone.zone_name || zone.product?.title || t`Zone`;
            ctx.font = isSelected || isHovered ? '16px bold sans-serif' : '14px sans-serif';
            ctx.textAlign = 'center';
            const textMetrics = ctx.measureText(text);
            const textHeight = 16;

            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(
                center.x - textMetrics.width / 2 - 4,
                center.y - textHeight / 2 - 2,
                textMetrics.width + 8,
                textHeight + 4
            );

            // Draw text
            ctx.fillStyle = '#000000';
            ctx.fillText(text, center.x, center.y + 4);
        });
    }, [zones, hoveredZone, selectedProductId, toCanvasCoords]);

    useEffect(() => {
        draw();
    }, [draw]);

    const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const mousePoint = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };

        let foundZone: number | null = null;
        for (const zone of zones) {
            if (isPointInPolygon(mousePoint, zone.coordinates)) {
                foundZone = zone.id;
                break;
            }
        }

        setHoveredZone(foundZone);
        
        // Change cursor
        canvas.style.cursor = foundZone ? 'pointer' : 'default';
    }, [zones, isPointInPolygon]);

    const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const mousePoint = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };

        for (const zone of zones) {
            if (isPointInPolygon(mousePoint, zone.coordinates)) {
                setSelectedZone(zone);
                setShowZoneInfo(true);
                break;
            }
        }
    }, [zones, isPointInPolygon]);

    const handleZoneSelect = () => {
        if (selectedZone?.product) {
            onZoneSelected(selectedZone.product.id, selectedZone.zone_name);
            setShowZoneInfo(false);
        }
    };

    const handleImageLoad = useCallback(() => {
        const canvas = canvasRef.current;
        const image = imageRef.current;
        if (!canvas || !image) return;

        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        draw();
    }, [draw]);

    return (
        <div style={{position: 'relative'}}>
            <img 
                ref={imageRef}
                src={imageUrl}
                onLoad={handleImageLoad}
                style={{display: 'none'}}
                alt=""
            />
            <canvas
                ref={canvasRef}
                onMouseMove={handleCanvasMouseMove}
                onClick={handleCanvasClick}
                style={{
                    maxWidth: '100%',
                    height: 'auto',
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                }}
            />

            <Modal
                opened={showZoneInfo}
                onClose={() => setShowZoneInfo(false)}
                title={
                    <Group>
                        <IconMapPin size={20} />
                        <Text fw={600}>{selectedZone?.zone_name || t`Zone Information`}</Text>
                    </Group>
                }
                size="sm"
            >
                {selectedZone && (
                    <Stack>
                        <Paper p="md" withBorder>
                            <Stack gap="sm">
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">{t`Ticket Type`}</Text>
                                    <Badge color="blue">
                                        {selectedZone.product?.title}
                                    </Badge>
                                </Group>
                                
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">{t`Zone`}</Text>
                                    <Badge 
                                        color={selectedZone.color}
                                        style={{backgroundColor: selectedZone.color}}
                                    >
                                        {selectedZone.zone_name || t`Unnamed Zone`}
                                    </Badge>
                                </Group>
                            </Stack>
                        </Paper>

                        <Group justify="flex-end">
                            <Button variant="light" onClick={() => setShowZoneInfo(false)}>
                                {t`Close`}
                            </Button>
                            <Button 
                                leftSection={<IconTicket size={16} />}
                                onClick={handleZoneSelect}
                            >
                                {t`Select This Zone`}
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>

            {zones.length > 0 && (
                <Paper 
                    p="sm" 
                    mt="md" 
                    style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(8px)'
                    }}
                >
                    <Text size="sm" c="dimmed" ta="center">
                        {t`Click on any colored zone to select tickets for that area`}
                    </Text>
                </Paper>
            )}
        </div>
    );
};