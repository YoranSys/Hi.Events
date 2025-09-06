import React, { useState } from 'react';
import {
    Box,
    Button,
    Card,
    Group,
    Text,
    Title,
    TextInput,
    Textarea,
    NumberInput,
    Grid,
    Badge,
    LoadingOverlay,
    Modal,
    Stack,
    ColorInput,
    ActionIcon,
    Divider
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconMapPin, IconEdit, IconTrash } from '@tabler/icons-react';
import { useGetVenues } from '../../../queries/useGetVenues';
import { useCreateVenue, useUpdateVenue } from '../../../mutations/useVenueMutations';

interface Zone {
    name: string;
    capacity: number;
    price: number;
    color: string;
}

interface Venue {
    id: number;
    name: string;
    description?: string;
    total_capacity: number;
    layout_config?: {
        type: string;
        zones: Zone[];
    };
}

interface VenueFormData {
    name: string;
    description: string;
    zones: Zone[];
}

export const VenueManagement: React.FC = () => {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
    const [showLayoutEditor, setShowLayoutEditor] = useState<Venue | null>(null);

    const { data: venues, isLoading } = useGetVenues();
    const createVenueMutation = useCreateVenue();
    const updateVenueMutation = useUpdateVenue();

    const form = useForm<VenueFormData>({
        initialValues: {
            name: '',
            description: '',
            zones: [
                { name: 'General Admission', capacity: 100, price: 50, color: '#4CAF50' },
                { name: 'VIP Section', capacity: 25, price: 150, color: '#2196F3' }
            ],
        },
        validate: {
            name: (value) => (value.length < 2 ? 'Name must be at least 2 characters' : null),
            zones: (zones) => {
                if (!zones || zones.length === 0) return 'At least one zone is required';
                for (const zone of zones) {
                    if (!zone.name || zone.name.length < 2) return 'All zones must have valid names';
                    if (zone.capacity < 1) return 'All zones must have capacity > 0';
                    if (zone.price < 0) return 'All zones must have price >= 0';
                }
                return null;
            },
        },
    });

    const layoutForm = useForm<{ zones: Zone[] }>({
        initialValues: { zones: [] }
    });

    const handleCreateVenue = async (values: VenueFormData) => {
        try {
            await createVenueMutation.mutateAsync(values);
            form.reset();
            setShowCreateForm(false);
            
            notifications.show({
                title: 'Success',
                message: 'Venue created successfully',
                color: 'green',
            });
        } catch (error: any) {
            notifications.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to create venue',
                color: 'red',
            });
        }
    };

    const handleUpdateLayout = async (values: { zones: Zone[] }) => {
        if (!showLayoutEditor) return;

        try {
            await updateVenueMutation.mutateAsync({
                venueId: showLayoutEditor.id,
                data: { zones: values.zones }
            });
            
            setShowLayoutEditor(null);
            layoutForm.reset();
            
            notifications.show({
                title: 'Success',
                message: 'Venue layout updated successfully',
                color: 'green',
            });
        } catch (error: any) {
            notifications.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to update layout',
                color: 'red',
            });
        }
    };

    const openLayoutEditor = (venue: Venue) => {
        const existingZones = venue.layout_config?.zones || [
            { name: 'General Admission', capacity: 100, price: 50, color: '#4CAF50' }
        ];
        
        layoutForm.setValues({ zones: existingZones });
        setShowLayoutEditor(venue);
    };

    const addZone = (form: any) => {
        const zones = form.values.zones || [];
        form.setFieldValue('zones', [
            ...zones,
            { name: `Zone ${zones.length + 1}`, capacity: 50, price: 25, color: '#9C27B0' }
        ]);
    };

    const removeZone = (form: any, index: number) => {
        const zones = form.values.zones || [];
        form.setFieldValue('zones', zones.filter((_, i) => i !== index));
    };

    const renderZoneEditor = (zones: Zone[], form: any, fieldPrefix = '') => (
        <Stack gap="sm">
            {zones.map((zone, index) => (
                <Card key={index} withBorder p="sm">
                    <Group justify="space-between" mb="xs">
                        <Text fw={500}>Zone {index + 1}</Text>
                        {zones.length > 1 && (
                            <ActionIcon
                                color="red"
                                variant="light"
                                onClick={() => removeZone(form, index)}
                            >
                                <IconTrash size="1rem" />
                            </ActionIcon>
                        )}
                    </Group>
                    
                    <Grid>
                        <Grid.Col span={6}>
                            <TextInput
                                label="Zone Name"
                                placeholder="Enter zone name"
                                {...form.getInputProps(`${fieldPrefix}zones.${index}.name`)}
                            />
                        </Grid.Col>
                        <Grid.Col span={3}>
                            <NumberInput
                                label="Capacity"
                                placeholder="0"
                                min={1}
                                {...form.getInputProps(`${fieldPrefix}zones.${index}.capacity`)}
                            />
                        </Grid.Col>
                        <Grid.Col span={3}>
                            <NumberInput
                                label="Price ($)"
                                placeholder="0"
                                min={0}
                                precision={2}
                                {...form.getInputProps(`${fieldPrefix}zones.${index}.price`)}
                            />
                        </Grid.Col>
                        <Grid.Col span={12}>
                            <ColorInput
                                label="Zone Color"
                                placeholder="Pick color"
                                {...form.getInputProps(`${fieldPrefix}zones.${index}.color`)}
                            />
                        </Grid.Col>
                    </Grid>
                </Card>
            ))}
            
            <Button 
                variant="light" 
                leftSection={<IconPlus size="1rem" />}
                onClick={() => addZone(form)}
            >
                Add Zone
            </Button>
        </Stack>
    );

    if (isLoading) {
        return (
            <Box style={{ position: 'relative', minHeight: 400 }}>
                <LoadingOverlay visible />
            </Box>
        );
    }

    const venueList = venues?.data || [];

    return (
        <Box p="md">
            <Group justify="space-between" mb="lg">
                <Title order={2}>Venue Management</Title>
                <Button
                    leftSection={<IconPlus size="1rem" />}
                    onClick={() => setShowCreateForm(!showCreateForm)}
                >
                    Create Venue
                </Button>
            </Group>

            {/* Create Venue Form */}
            <Modal
                opened={showCreateForm}
                onClose={() => setShowCreateForm(false)}
                title="Create New Venue"
                size="lg"
            >
                <form onSubmit={form.onSubmit(handleCreateVenue)}>
                    <Stack gap="md">
                        <Grid>
                            <Grid.Col span={12}>
                                <TextInput
                                    label="Venue Name"
                                    placeholder="Enter venue name"
                                    required
                                    {...form.getInputProps('name')}
                                />
                            </Grid.Col>
                            <Grid.Col span={12}>
                                <Textarea
                                    label="Description"
                                    placeholder="Enter venue description"
                                    {...form.getInputProps('description')}
                                />
                            </Grid.Col>
                        </Grid>
                        
                        <Divider label="Zone Configuration" labelPosition="center" />
                        
                        {renderZoneEditor(form.values.zones, form)}
                        
                        <Group justify="flex-end" mt="md">
                            <Button
                                variant="subtle"
                                onClick={() => setShowCreateForm(false)}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                loading={createVenueMutation.isPending}
                            >
                                Create Venue
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            {/* Layout Editor Modal */}
            <Modal
                opened={!!showLayoutEditor}
                onClose={() => setShowLayoutEditor(null)}
                title={`Edit Layout - ${showLayoutEditor?.name}`}
                size="lg"
            >
                <form onSubmit={layoutForm.onSubmit(handleUpdateLayout)}>
                    <Stack gap="md">
                        {renderZoneEditor(layoutForm.values.zones, layoutForm)}
                        
                        <Group justify="flex-end" mt="md">
                            <Button
                                variant="subtle"
                                onClick={() => setShowLayoutEditor(null)}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                loading={updateVenueMutation.isPending}
                            >
                                Update Layout
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            {/* Venues List */}
            <Grid>
                {venueList.length === 0 ? (
                    <Grid.Col span={12}>
                        <Card withBorder>
                            <Text ta="center" c="dimmed" py="xl">
                                No venues created yet. Create your first venue to get started with zone-based seating.
                            </Text>
                        </Card>
                    </Grid.Col>
                ) : (
                    venueList.map((venue) => (
                        <Grid.Col key={venue.id} span={6}>
                            <Card withBorder h="100%">
                                <Group justify="space-between" mb="xs">
                                    <Text fw={500} size="lg">{venue.name}</Text>
                                    <IconMapPin size="1.2rem" color="gray" />
                                </Group>
                                
                                {venue.description && (
                                    <Text size="sm" c="dimmed" mb="sm">
                                        {venue.description}
                                    </Text>
                                )}
                                
                                <Group mb="md">
                                    <Badge variant="light">
                                        Capacity: {venue.total_capacity}
                                    </Badge>
                                    <Badge variant="light" color="blue">
                                        {venue.layout_config?.zones?.length || 0} Zones
                                    </Badge>
                                </Group>

                                {venue.layout_config?.zones && (
                                    <Box mb="md">
                                        <Text size="sm" fw={500} mb="xs">Zones:</Text>
                                        <Group gap="xs">
                                            {venue.layout_config.zones.map((zone, index) => (
                                                <Badge 
                                                    key={index} 
                                                    variant="light"
                                                    style={{ backgroundColor: zone.color + '20', color: zone.color }}
                                                >
                                                    {zone.name} ({zone.capacity})
                                                </Badge>
                                            ))}
                                        </Group>
                                    </Box>
                                )}
                                
                                <Group justify="flex-end">
                                    <Button 
                                        variant="light" 
                                        size="sm"
                                        leftSection={<IconEdit size="1rem" />}
                                        onClick={() => openLayoutEditor(venue)}
                                    >
                                        Edit Layout
                                    </Button>
                                </Group>
                            </Card>
                        </Grid.Col>
                    ))
                )}
            </Grid>
        </Box>
    );
};