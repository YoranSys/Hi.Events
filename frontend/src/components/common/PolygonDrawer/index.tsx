import React, {useRef, useState, useEffect, useCallback} from 'react';
import {Button, Group, ColorInput, TextInput, Modal, Stack} from '@mantine/core';
import {IconPolygon, IconTrash, IconCheck, IconX} from '@tabler/icons-react';
import {t} from '@lingui/macro';

interface Point {
    x: number;
    y: number;
}

interface PolygonDrawerProps {
    imageUrl: string;
    zones: Array<{
        id: number;
        coordinates: [number, number][];
        color: string;
        zone_name?: string;
    }>;
    onZoneCreated: (coordinates: [number, number][], color: string, zoneName?: string) => void;
    onZoneDeleted: (zoneId: number) => void;
    isDrawing: boolean;
    onDrawingChange: (drawing: boolean) => void;
}

export const PolygonDrawer: React.FC<PolygonDrawerProps> = ({
    imageUrl,
    zones,
    onZoneCreated,
    onZoneDeleted,
    isDrawing,
    onDrawingChange,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const [currentPolygon, setCurrentPolygon] = useState<Point[]>([]);
    const [hoveredZone, setHoveredZone] = useState<number | null>(null);
    const [showZoneModal, setShowZoneModal] = useState(false);
    const [zoneColor, setZoneColor] = useState('#3498db');
    const [zoneName, setZoneName] = useState('');

    // Convert canvas coordinates to relative coordinates (0-1)
    const toRelativeCoords = useCallback((x: number, y: number): [number, number] => {
        const canvas = canvasRef.current;
        if (!canvas) return [0, 0];
        
        const rect = canvas.getBoundingClientRect();
        const relativeX = (x - rect.left) / rect.width;
        const relativeY = (y - rect.top) / rect.height;
        return [relativeX, relativeY];
    }, []);

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

        // Draw existing zones
        zones.forEach((zone, index) => {
            ctx.beginPath();
            ctx.fillStyle = zone.color + '40'; // Semi-transparent
            ctx.strokeStyle = zone.color;
            ctx.lineWidth = hoveredZone === zone.id ? 3 : 2;

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
            if (zone.zone_name) {
                const center = zone.coordinates.reduce(
                    (acc, coord) => {
                        const point = toCanvasCoords(coord[0], coord[1]);
                        return {x: acc.x + point.x, y: acc.y + point.y};
                    },
                    {x: 0, y: 0}
                );
                center.x /= zone.coordinates.length;
                center.y /= zone.coordinates.length;

                ctx.fillStyle = '#000000';
                ctx.font = '14px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(zone.zone_name, center.x, center.y);
            }
        });

        // Draw current polygon being drawn
        if (currentPolygon.length > 0) {
            ctx.beginPath();
            ctx.fillStyle = zoneColor + '40';
            ctx.strokeStyle = zoneColor;
            ctx.lineWidth = 2;

            currentPolygon.forEach((point, i) => {
                if (i === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            });

            if (currentPolygon.length > 2) {
                ctx.closePath();
                ctx.fill();
            }
            ctx.stroke();

            // Draw points
            currentPolygon.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
                ctx.fillStyle = zoneColor;
                ctx.fill();
            });
        }
    }, [zones, currentPolygon, hoveredZone, zoneColor, toCanvasCoords]);

    useEffect(() => {
        draw();
    }, [draw]);

    const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        setCurrentPolygon(prev => [...prev, {x, y}]);
    }, [isDrawing]);

    const handleCanvasDoubleClick = useCallback(() => {
        if (currentPolygon.length >= 3) {
            setShowZoneModal(true);
        }
    }, [currentPolygon]);

    const finishZone = useCallback(() => {
        if (currentPolygon.length >= 3) {
            const coordinates: [number, number][] = currentPolygon.map(point => 
                toRelativeCoords(point.x, point.y)
            );
            onZoneCreated(coordinates, zoneColor, zoneName);
            setCurrentPolygon([]);
            setZoneName('');
            onDrawingChange(false);
            setShowZoneModal(false);
        }
    }, [currentPolygon, zoneColor, zoneName, onZoneCreated, onDrawingChange, toRelativeCoords]);

    const cancelDrawing = useCallback(() => {
        setCurrentPolygon([]);
        setZoneName('');
        onDrawingChange(false);
        setShowZoneModal(false);
    }, [onDrawingChange]);

    const handleImageLoad = useCallback(() => {
        const canvas = canvasRef.current;
        const image = imageRef.current;
        if (!canvas || !image) return;

        // Set canvas size to be larger for better precision
        const maxWidth = 1200;
        const maxHeight = 800;
        
        let { width, height } = image;
        
        // Scale to fit within max dimensions while maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height;
            if (width > height) {
                width = maxWidth;
                height = width / aspectRatio;
            } else {
                height = maxHeight;
                width = height * aspectRatio;
            }
        }
        
        // Ensure minimum size for better precision
        const minWidth = 800;
        const minHeight = 600;
        if (width < minWidth) {
            width = minWidth;
            height = width / (image.width / image.height);
        }
        if (height < minHeight) {
            height = minHeight;
            width = height * (image.width / image.height);
        }
        
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        
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
                onClick={handleCanvasClick}
                onDoubleClick={handleCanvasDoubleClick}
                style={{
                    width: '100%',
                    height: 'auto',
                    minHeight: '600px',
                    maxWidth: '1200px',
                    cursor: isDrawing ? 'crosshair' : 'default',
                    border: '1px solid #ddd'
                }}
            />

            {isDrawing && currentPolygon.length > 0 && (
                <div style={{
                    position: 'absolute',
                    bottom: 10,
                    left: 10,
                    background: 'white',
                    padding: '10px',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                    <Group>
                        <span>{t`Points: ${currentPolygon.length}`}</span>
                        {currentPolygon.length >= 3 && (
                            <Button size="xs" onClick={() => setShowZoneModal(true)}>
                                {t`Finish Zone`}
                            </Button>
                        )}
                        <Button size="xs" variant="light" onClick={cancelDrawing}>
                            {t`Cancel`}
                        </Button>
                    </Group>
                </div>
            )}

            <Modal
                opened={showZoneModal}
                onClose={() => setShowZoneModal(false)}
                title={t`Configure Zone`}
                size="sm"
            >
                <Stack>
                    <TextInput
                        label={t`Zone Name`}
                        placeholder={t`Enter zone name (optional)`}
                        value={zoneName}
                        onChange={(e) => setZoneName(e.currentTarget.value)}
                    />
                    <ColorInput
                        label={t`Zone Color`}
                        value={zoneColor}
                        onChange={setZoneColor}
                    />
                    <Group justify="flex-end">
                        <Button variant="light" onClick={() => setShowZoneModal(false)}>
                            {t`Cancel`}
                        </Button>
                        <Button onClick={finishZone} leftSection={<IconCheck size={16} />}>
                            {t`Create Zone`}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </div>
    );
};