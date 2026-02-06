import React, { useState } from 'react';
import { Box, Button, HStack, VStack, Text } from '@chakra-ui/react';
import TimeSlotDisplay from './TimeSlotDisplay';
import CalendarView from '../calendar/CalendarView';

/**
 * Integrated Calendar and Timeline View Component
 * 
 * Provides a toggle between traditional calendar view and continuous timeline view.
 * Both views support full interactivity for adding/removing preferred time slots.
 */
const TimeSlotDisplayExample = ({
    preferredSlots,
    eventData,
    calendarEvents = [],
    onSelectSlot,
    onSelectEvent,
    isFinalized = false
}) => {
    const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'timeline'
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Handle click on existing timeline slot
    const handleTimelineSlotClick = (block) => {
        // Convert the aggregated block back to a pseudo-event for onSelectEvent
        if (onSelectEvent) {
            const pseudoEvent = {
                id: `timeline-slot-${block.start.getTime()}`,
                title: `${block.count} ${block.count === 1 ? 'person' : 'people'}`,
                start: block.start,
                end: block.end,
                type: 'preferred-slot',
                resource: {
                    density: block.count,
                    userIds: block.participants, // Note: using participants array directly
                    userNames: block.participants
                }
            };
            onSelectEvent(pseudoEvent);
        }
    };

    // Handle click on empty space in timeline (for adding new slots)
    const handleTimelineEmptyClick = (timeRange) => {
        // This will be called when user clicks on empty space
        // timeRange should have { start, end } Date objects
        if (onSelectSlot && !isFinalized) {
            onSelectSlot({
                start: timeRange.start,
                end: timeRange.end,
                slots: [], // Empty for new selection
                action: 'select'
            });
        }
    };

    return (
        <VStack spacing={4} align="stretch" w="full" h="full">
            {/* View Toggle */}
            <HStack spacing={2} justify="space-between" flexShrink={0}>
                <Text fontSize="lg" fontWeight="bold">Calendar</Text>
                <HStack spacing={2}>
                    <Button
                        size="sm"
                        variant={viewMode === 'calendar' ? 'solid' : 'outline'}
                        colorScheme="purple"
                        onClick={() => setViewMode('calendar')}
                    >
                        Calendar View
                    </Button>
                    <Button
                        size="sm"
                        variant={viewMode === 'timeline' ? 'solid' : 'outline'}
                        colorScheme="purple"
                        onClick={() => setViewMode('timeline')}
                    >
                        Timeline View
                    </Button>
                </HStack>
            </HStack>

            {/* Date Selector (for timeline view only) */}
            {viewMode === 'timeline' && (
                <HStack spacing={2} flexShrink={0}>
                    <Button
                        size="sm"
                        onClick={() => {
                            const prev = new Date(selectedDate);
                            prev.setDate(prev.getDate() - 1);
                            setSelectedDate(prev);
                        }}
                    >
                        Previous Day
                    </Button>
                    <Text fontSize="md" fontWeight="medium">
                        {selectedDate.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                    </Text>
                    <Button
                        size="sm"
                        onClick={() => {
                            const next = new Date(selectedDate);
                            next.setDate(next.getDate() + 1);
                            setSelectedDate(next);
                        }}
                    >
                        Next Day
                    </Button>
                </HStack>
            )}

            {/* Color Legend (for timeline view only) */}
            {viewMode === 'timeline' && (
                <HStack spacing={4} fontSize="xs" color="gray.600" wrap="wrap" flexShrink={0}>
                    <HStack spacing={1}>
                        <Box w="16px" h="16px" bg="#efbbff" borderRadius="sm" />
                        <Text>1-2 people</Text>
                    </HStack>
                    <HStack spacing={1}>
                        <Box w="16px" h="16px" bg="#d896ff" borderRadius="sm" />
                        <Text>3-4 people</Text>
                    </HStack>
                    <HStack spacing={1}>
                        <Box w="16px" h="16px" bg="#be29ec" borderRadius="sm" />
                        <Text>5-6 people</Text>
                    </HStack>
                    <HStack spacing={1}>
                        <Box w="16px" h="16px" bg="#800080" borderRadius="sm" />
                        <Text>7-9 people</Text>
                    </HStack>
                    <HStack spacing={1}>
                        <Box w="16px" h="16px" bg="#660066" borderRadius="sm" />
                        <Text>10+ people</Text>
                    </HStack>
                </HStack>
            )}

            {/* Display Component */}
            <Box flex={1} minH={0} h="full">
                {viewMode === 'timeline' ? (
                    <TimeSlotDisplay
                        slots={preferredSlots}
                        date={selectedDate}
                        onSlotClick={handleTimelineSlotClick}
                        onEmptyClick={handleTimelineEmptyClick}
                        minHour={eventData?.earliest_hour ? parseInt(eventData.earliest_hour.split(':')[0]) : 9}
                        maxHour={eventData?.latest_hour ? parseInt(eventData.latest_hour.split(':')[0]) : 17}
                        isFinalized={isFinalized}
                    />
                ) : (
                    <CalendarView
                        events={calendarEvents}
                        onSelectSlot={!isFinalized ? onSelectSlot : null}
                        onSelectEvent={onSelectEvent}
                        selectable={!isFinalized}
                    />
                )}
            </Box>
        </VStack>
    );
};

export default TimeSlotDisplayExample;
