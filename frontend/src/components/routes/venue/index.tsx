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
    LoadingOverlay
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconMapPin } from '@tabler/icons-react';

interface Venue {
    id: number;
    name: string;
    description?: string;
    total_capacity: number;
    layout_config?: any;
}

interface VenueFormData {
    name: string;
    description: string;
    total_capacity: number;
}

export const VenueManagement: React.FC = () => {
    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const form = useForm<VenueFormData>({
        initialValues: {
            name: '',
            description: '',
            total_capacity: 100,
        },
        validate: {
            name: (value) => (value.length < 2 ? 'Name must be at least 2 characters' : null),
            total_capacity: (value) => (value < 1 ? 'Capacity must be at least 1' : null),
        },
    });

    const handleCreateVenue = async (values: VenueFormData) => {
        setLoading(true);
        try {
            // This would connect to the backend API
            // const response = await seatingClient.createVenue(values);
            
            // Mock venue creation for now
            const newVenue: Venue = {
                id: Date.now(),
                name: values.name,
                description: values.description,
                total_capacity: values.total_capacity,
            };
            
            setVenues(prev => [...prev, newVenue]);
            form.reset();
            setShowCreateForm(false);
            
            notifications.show({
                title: 'Success',
                message: 'Venue created successfully',
                color: 'green',
            });
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to create venue',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

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

            {showCreateForm && (
                <Card withBorder mb="lg" style={{ position: 'relative' }}>
                    <LoadingOverlay visible={loading} />
                    <Title order={3} mb="md">Create New Venue</Title>
                    
                    <form onSubmit={form.onSubmit(handleCreateVenue)}>
                        <Grid>
                            <Grid.Col span={6}>
                                <TextInput
                                    label="Venue Name"
                                    placeholder="Enter venue name"
                                    required
                                    {...form.getInputProps('name')}
                                />
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <NumberInput
                                    label="Total Capacity"
                                    placeholder="Enter total capacity"
                                    min={1}
                                    required
                                    {...form.getInputProps('total_capacity')}
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
                        
                        <Group justify="flex-end" mt="md">
                            <Button
                                variant="subtle"
                                onClick={() => setShowCreateForm(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit">Create Venue</Button>
                        </Group>
                    </form>
                </Card>
            )}

            <Grid>
                {venues.length === 0 ? (
                    <Grid.Col span={12}>
                        <Card withBorder>
                            <Text ta="center" c="dimmed" py="xl">
                                No venues created yet. Create your first venue to get started with seating charts.
                            </Text>
                        </Card>
                    </Grid.Col>
                ) : (
                    venues.map((venue) => (
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
                                </Group>
                                
                                <Group justify="flex-end">
                                    <Button variant="light" size="sm">
                                        Edit Layout
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        Edit Details
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