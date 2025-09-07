import React, {useState} from 'react';
import {useParams} from 'react-router';
import {
    Button,
    Group,
    Stack,
    Text,
    Alert,
    Table,
    ActionIcon,
    Select,
    Paper,
    Title,
    Badge,
    FileInput
} from '@mantine/core';
import {IconMapPin, IconTrash, IconPlus, IconUpload, IconPolygon} from '@tabler/icons-react';
import {t} from '@lingui/macro';
import {PageTitle} from '../../../common/PageTitle';
import {PageBody} from '../../../common/PageBody';
import {ToolBar} from '../../../common/ToolBar';
import {useGetEvent} from '../../../../queries/useGetEvent';
import {useGetProducts} from '../../../../queries/useGetProducts';
import {useGetSeatingZones, useCreateSeatingZone, useDeleteSeatingZone, useUploadVenueMap} from '../../../../queries/useSeatingZones';
import {PolygonDrawer} from '../../../common/PolygonDrawer';
import {showError, showSuccess} from '../../../../utilites/notifications';
import {CreateSeatingZonePayload} from '../../../../api/seating-zone.client';

export const SeatingChart = () => {
    const {eventId} = useParams();
    const [isDrawing, setIsDrawing] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [venueMapFile, setVenueMapFile] = useState<File | null>(null);
    const [venueMapUrlState, setVenueMapUrlState] = useState<string>('');

    const {data: event} = useGetEvent(eventId);
    const {data: productsResponse} = useGetProducts(eventId);
    const {data: zonesResponse} = useGetSeatingZones(eventId);
    const createZoneMutation = useCreateSeatingZone();
    const deleteZoneMutation = useDeleteSeatingZone();
    const uploadVenueMapMutation = useUploadVenueMap();

    const products = productsResponse?.data || [];
    const zones = zonesResponse?.data || [];
    
    // Get venue map URL from event settings
    const venueMapUrl = event?.settings?.venue_map_image_url || venueMapUrlState;

    const handleFileUpload = async (file: File | null) => {
        if (file) {
            setVenueMapFile(file);
            
            try {
                // Upload the file to the server
                await uploadVenueMapMutation.mutateAsync({
                    eventId: Number(eventId),
                    file
                });
                showSuccess(t`Venue map uploaded successfully`);
            } catch (error) {
                showError(t`Failed to upload venue map`);
            }
        }
    };

    const handleZoneCreated = async (coordinates: [number, number][], color: string, zoneName?: string) => {
        if (!selectedProductId) {
            showError(t`Please select a product/ticket type for this zone`);
            return;
        }

        const payload: CreateSeatingZonePayload = {
            product_id: parseInt(selectedProductId),
            coordinates,
            color,
            zone_name: zoneName,
        };

        try {
            await createZoneMutation.mutateAsync({
                eventId: Number(eventId),
                data: payload
            });
            showSuccess(t`Zone created successfully`);
            setIsDrawing(false);
        } catch (error) {
            showError(t`Failed to create zone`);
        }
    };

    const handleZoneDeleted = async (zoneId: number) => {
        try {
            await deleteZoneMutation.mutateAsync({
                eventId: Number(eventId),
                zoneId
            });
            showSuccess(t`Zone deleted successfully`);
        } catch (error) {
            showError(t`Failed to delete zone`);
        }
    };

    const startDrawing = () => {
        if (!venueMapUrl) {
            showError(t`Please upload a venue map first`);
            return;
        }
        if (!selectedProductId) {
            showError(t`Please select a product/ticket type first`);
            return;
        }
        setIsDrawing(true);
    };

    const productOptions = products.map(product => ({
        value: product.id.toString(),
        label: product.title
    }));

    return (
        <PageBody>
            <PageTitle>{t`Seating Chart`}</PageTitle>

            <ToolBar>
                <Group>
                    <FileInput
                        placeholder={t`Upload venue map`}
                        leftSection={<IconUpload size={16} />}
                        accept="image/*"
                        onChange={handleFileUpload}
                    />
                    <Select
                        placeholder={t`Select ticket type`}
                        data={productOptions}
                        value={selectedProductId}
                        onChange={(value) => setSelectedProductId(value || '')}
                        disabled={isDrawing}
                    />
                    <Button
                        leftSection={<IconPolygon size={16} />}
                        onClick={startDrawing}
                        disabled={!venueMapUrl || !selectedProductId || isDrawing}
                        color={isDrawing ? 'red' : 'blue'}
                    >
                        {isDrawing ? t`Drawing Mode Active` : t`Draw Zone`}
                    </Button>
                </Group>
            </ToolBar>

            <Stack gap="lg">
                {!venueMapUrl && (
                    <Alert color="blue">
                        <Text>{t`Upload a venue map image to start creating seating zones. You can draw polygonal zones on the map and assign them to different ticket types.`}</Text>
                    </Alert>
                )}

                {venueMapUrl && (
                    <Paper p="md">
                        <Title order={3} mb="md">{t`Venue Map`}</Title>
                        <PolygonDrawer
                            imageUrl={venueMapUrl}
                            zones={zones}
                            onZoneCreated={handleZoneCreated}
                            onZoneDeleted={handleZoneDeleted}
                            isDrawing={isDrawing}
                            onDrawingChange={setIsDrawing}
                        />
                        {isDrawing && (
                            <Alert color="blue" mt="md">
                                <Text>{t`Click to add points to the zone. Double-click or use the "Finish Zone" button when you have at least 3 points.`}</Text>
                            </Alert>
                        )}
                    </Paper>
                )}

                {zones.length > 0 && (
                    <Paper p="md">
                        <Title order={3} mb="md">{t`Zones`}</Title>
                        <Table>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>{t`Zone Name`}</Table.Th>
                                    <Table.Th>{t`Product/Ticket Type`}</Table.Th>
                                    <Table.Th>{t`Color`}</Table.Th>
                                    <Table.Th>{t`Points`}</Table.Th>
                                    <Table.Th>{t`Actions`}</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {zones.map((zone) => (
                                    <Table.Tr key={zone.id}>
                                        <Table.Td>
                                            {zone.zone_name || t`Unnamed Zone`}
                                        </Table.Td>
                                        <Table.Td>
                                            {zone.product?.title || t`Unknown Product`}
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge
                                                color={zone.color}
                                                style={{backgroundColor: zone.color}}
                                            >
                                                {zone.color}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            {zone.coordinates.length} {t`points`}
                                        </Table.Td>
                                        <Table.Td>
                                            <ActionIcon
                                                color="red"
                                                variant="light"
                                                onClick={() => handleZoneDeleted(zone.id)}
                                                loading={deleteZoneMutation.isPending}
                                            >
                                                <IconTrash size={16} />
                                            </ActionIcon>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Paper>
                )}
            </Stack>
        </PageBody>
    );
};

export default SeatingChart;