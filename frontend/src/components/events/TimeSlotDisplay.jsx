import React, { useMemo, useState, useRef } from 'react';
import { format, parseISO, differenceInMinutes, startOfDay, addMinutes, isSameDay, setHours, setMinutes } from 'date-fns';
import { Box, Tooltip, Text, Flex, VStack } from '@chakra-ui/react';

/**
 * TimeSlotDisplay Component
 * Renders a continuous vertical timeline of preferred time slots.
 * 
 * Features:
 * - Aggregates overlapping slots to calculate participant count
 * - Color-coded based on participant count (Purple gradient)
 * - Continuous flow (merges adjacent slots with same count)
 * - Interactive: Click on slots to view details, click empty space to add new slots
 * - Responsive design
 */
const TimeSlotDisplay = ({
    slots = [],
    date = new Date(),
    onSlotClick,
    onEmptyClick,
    minHour = 9,
    maxHour = 17,
    isFinalized = false
}) => {
    const timelineRef = useRef(null);

    // Drag selection state
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(null);
    const [dragEnd, setDragEnd] = useState(null);
    const [dragStartY, setDragStartY] = useState(null); // Track mouse Y position for click vs drag detection
    const [clickedSlot, setClickedSlot] = useState(null); // Track if we clicked on a slot (for click vs drag)

    // Color scheme based on participant count
    const getSlotColor = (count) => {
        if (count <= 0) return 'transparent';
        if (count <= 2) return '#efbbff'; // 1-2 people (Lightest)
        if (count <= 4) return '#d896ff'; // 3-4 people
        if (count <= 6) return '#be29ec'; // 5-6 people
        if (count <= 9) return '#800080'; // 7-9 people
        return '#660066'; // 10+ people (Darkest)
    };

    const getTextColor = (count) => {
        return count >= 7 ? 'white' : 'black';
    };

    // Process slots to calculate density and merge adjacent blocks
    const processedBlocks = useMemo(() => {
        if (!slots || slots.length === 0) return [];

        // 1. Convert to time blocks with start/end objects
        const timeBlocks = slots.map(slot => ({
            start: new Date(slot.start_time_utc || slot.start_time),
            end: new Date(slot.end_time_utc || slot.end_time),
            userId: slot.user_id,
            userName: slot.user_name || 'Unknown', // Fallback
            id: slot.id
        })).filter(block => isSameDay(block.start, date)); // Filter for current day

        if (timeBlocks.length === 0) return [];

        // 2. Find all unique time points (boundaries)
        const timePoints = new Set();

        timeBlocks.forEach(block => {
            timePoints.add(block.start.getTime());
            timePoints.add(block.end.getTime());
        });

        const sortedPoints = Array.from(timePoints).sort((a, b) => a - b);

        // 3. Calculate density for each interval
        const densitySegments = [];
        for (let i = 0; i < sortedPoints.length - 1; i++) {
            const start = sortedPoints[i];
            const end = sortedPoints[i + 1];

            // Find slots active at this interval
            const activeSlots = timeBlocks.filter(block =>
                block.start.getTime() <= start && block.end.getTime() >= end
            );

            if (activeSlots.length > 0) {
                // Count unique users
                const uniqueUsers = new Set(activeSlots.map(s => s.userId));
                const participants = activeSlots.map(s => s.userName); // Simplified

                densitySegments.push({
                    start: new Date(start),
                    end: new Date(end),
                    count: uniqueUsers.size,
                    participants: Array.from(new Set(participants)), // Unique names
                    slotIds: activeSlots.map(s => s.id)
                });
            }
        }

        // 4. Merge adjacent segments with same count
        const mergedBlocks = [];
        if (densitySegments.length > 0) {
            let current = densitySegments[0];

            for (let i = 1; i < densitySegments.length; i++) {
                const next = densitySegments[i];

                // Check if adjacent and same count
                if (current.end.getTime() === next.start.getTime() && current.count === next.count) {
                    // Merge
                    current.end = next.end;
                    // Merge participants lists if needed, or just keep union
                    current.participants = Array.from(new Set([...current.participants, ...next.participants]));
                    current.slotIds = [...current.slotIds, ...next.slotIds];
                } else {
                    mergedBlocks.push(current);
                    current = next;
                }
            }
            mergedBlocks.push(current);
        }

        return mergedBlocks;
    }, [slots, date]);

    // Helper: Identify continuous groups for selective border rounding
    // A continuous group is a set of adjacent slots with no time gaps between them
    const getContinuousGroups = useMemo(() => {
        if (processedBlocks.length === 0) return [];

        const groups = [];
        let currentGroup = [0]; // Start with first block index

        for (let i = 1; i < processedBlocks.length; i++) {
            const prev = processedBlocks[i - 1];
            const curr = processedBlocks[i];

            // Check if current block is adjacent to previous (no gap)
            if (prev.end.getTime() === curr.start.getTime()) {
                // Continuous - add to current group
                currentGroup.push(i);
            } else {
                // Gap found - finish current group and start new one
                groups.push(currentGroup);
                currentGroup = [i];
            }
        }

        // Push the last group
        if (currentGroup.length > 0) {
            groups.push(currentGroup);
        }

        return groups;
    }, [processedBlocks]);


    // Render helpers
    const totalMinutes = (maxHour - minHour) * 60;

    // Calculate position and height percentages
    const getPosition = (dateObj) => {
        const hours = dateObj.getHours();
        const minutes = dateObj.getMinutes();
        const totalMinutesFromStart = (hours - minHour) * 60 + minutes;
        return Math.max(0, (totalMinutesFromStart / totalMinutes) * 100);
    };

    const getDurationPercent = (start, end) => {
        const diff = differenceInMinutes(end, start);
        return (diff / totalMinutes) * 100;
    };

    // Convert click position to time
    const getTimeFromPosition = (clickY, containerHeight) => {
        const percentage = clickY / containerHeight;
        const minutesFromStart = percentage * totalMinutes;

        // Round to nearest 15 minutes
        const roundedMinutes = Math.round(minutesFromStart / 15) * 15;

        const hours = minHour + Math.floor(roundedMinutes / 60);
        const minutes = roundedMinutes % 60;

        // Clamp to valid hour range
        const clampedHours = Math.max(minHour, Math.min(maxHour, hours));
        const clampedMinutes = clampedHours === maxHour ? 0 : minutes;

        return setMinutes(setHours(date, clampedHours), clampedMinutes);
    };

    // Mouse event handlers for drag selection
    const handleMouseDown = (event) => {
        if (isFinalized) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const clickY = event.clientY - rect.top;

        // Get the clicked time
        const clickedTime = getTimeFromPosition(clickY, rect.height);

        // Check if we clicked on a slot
        const slotElement = event.target.closest('[data-slot-block="true"]');
        if (slotElement) {
            // Find the slot data from processedBlocks
            const blockIndex = parseInt(slotElement.getAttribute('data-block-index'));
            if (blockIndex !== null && !isNaN(blockIndex) && processedBlocks[blockIndex]) {
                setClickedSlot(processedBlocks[blockIndex]);
            }
        }

        // Initialize potential drag (we'll decide later if it's a click or drag)
        setDragStart(clickedTime);
        setDragEnd(clickedTime);
        setDragStartY(event.clientY);
    };

    const handleMouseMove = (event) => {
        if (isFinalized || !dragStart) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const currentY = event.clientY - rect.top;

        // Calculate distance moved from initial mousedown
        const dragDistance = Math.abs(event.clientY - dragStartY);

        // If we've moved more than 10 pixels, it's a drag (not a click)
        if (dragDistance > 10) {
            setIsDragging(true);
            setClickedSlot(null); // Cancel any slot click

            // Get the current time
            const currentTime = getTimeFromPosition(currentY, rect.height);
            setDragEnd(currentTime);
        }
    };

    const handleMouseUp = (event) => {
        if (isFinalized || !dragStart) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const endY = event.clientY - rect.top;

        // Calculate drag distance in pixels
        const dragDistance = Math.abs(event.clientY - dragStartY);

        // Distinguish between click and drag (10px threshold)
        if (dragDistance < 10) {
            // It's a click (not a drag)
            if (clickedSlot && onSlotClick) {
                // Clicked on an existing slot - open details
                onSlotClick(clickedSlot);
            } else if (onEmptyClick) {
                // Clicked on empty space - create 30-minute slot
                const clickedTime = getTimeFromPosition(endY, rect.height);
                const startTime = clickedTime;
                const endTime = addMinutes(clickedTime, 30);

                // Ensure we don't exceed maxHour
                if (endTime.getHours() > maxHour || (endTime.getHours() === maxHour && endTime.getMinutes() > 0)) {
                    // Skip if would exceed bounds
                } else {
                    onEmptyClick({
                        start: startTime,
                        end: endTime
                    });
                }
            }
        } else if (isDragging && onEmptyClick) {
            // It's a drag - create slot with exact dragged duration
            const finalTime = getTimeFromPosition(endY, rect.height);

            // Normalize range (ensure start < end)
            let startTime = dragStart < finalTime ? dragStart : finalTime;
            let endTime = dragStart < finalTime ? finalTime : dragStart;

            // Ensure minimum 15-minute duration
            const duration = differenceInMinutes(endTime, startTime);
            if (duration < 15) {
                endTime = addMinutes(startTime, 15);
            }

            // Ensure we don't exceed maxHour
            if (endTime.getHours() > maxHour || (endTime.getHours() === maxHour && endTime.getMinutes() > 0)) {
                endTime = setMinutes(setHours(date, maxHour), 0);
            }

            // Call callback with selected time range
            onEmptyClick({
                start: startTime,
                end: endTime
            });
        }

        // Reset all drag state
        setIsDragging(false);
        setDragStart(null);
        setDragEnd(null);
        setDragStartY(null);
        setClickedSlot(null);
    };

    const handleMouseLeave = () => {
        // Cancel drag if mouse leaves timeline
        setIsDragging(false);
        setDragStart(null);
        setDragEnd(null);
        setDragStartY(null);
        setClickedSlot(null);
    };


    // Generate hour markers
    const hourMarkers = [];
    for (let i = minHour; i <= maxHour; i++) {
        hourMarkers.push(i);
    }

    return (
        <Box
            className="time-slot-display"
            w="full"
            h="600px" // Fixed height or responsive
            bg="white"
            borderRadius="lg"
            boxShadow="sm"
            position="relative"
            overflowY="auto"
            p={4}
        >
            <Flex position="relative" h="full">
                {/* Time Labels Column */}
                <VStack
                    w="60px"
                    align="flex-end"
                    pr={2}
                    spacing={0}
                    justify="space-between"
                    position="relative"
                    h="full"
                    color="gray.500"
                    fontSize="xs"
                    fontWeight="medium"
                >
                    {hourMarkers.map(hour => (
                        <Box key={hour} position="absolute" top={`${((hour - minHour) / (maxHour - minHour)) * 100}%`} transform="translateY(-50%)">
                            {format(new Date().setHours(hour, 0), 'h:mm a')}
                        </Box>
                    ))}
                </VStack>

                {/* Timeline Column */}
                <Box
                    ref={timelineRef}
                    flex="1"
                    position="relative"
                    h="full"
                    borderLeft="1px solid"
                    borderColor="gray.200"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    cursor={!isFinalized ? (isDragging ? "grabbing" : "pointer") : "default"}
                    _hover={!isFinalized ? { bg: "gray.50" } : {}}
                    userSelect="none" // Prevent text selection while dragging
                >
                    {/* Grid lines */}
                    {hourMarkers.map(hour => (
                        <Box
                            key={`grid-${hour}`}
                            position="absolute"
                            top={`${((hour - minHour) / (maxHour - minHour)) * 100}%`}
                            w="full"
                            h="1px"
                            bg="gray.100"
                            pointerEvents="none"
                        />
                    ))}

                    {/* Render Blocks */}
                    {processedBlocks.map((block, index) => {
                        const top = getPosition(block.start);
                        const height = getDurationPercent(block.start, block.end);
                        const bgColor = getSlotColor(block.count);
                        const textColor = getTextColor(block.count);

                        // Determine border radius based on group position
                        const groupIndex = getContinuousGroups.findIndex(group => group.includes(index));
                        const group = groupIndex !== -1 ? getContinuousGroups[groupIndex] : [index];
                        const isFirstInGroup = group[0] === index;
                        const isLastInGroup = group[group.length - 1] === index;
                        const isSingleBlock = group.length === 1;

                        return (
                            <Tooltip
                                key={index}
                                label={`${format(block.start, 'h:mm a')} - ${format(block.end, 'h:mm a')}: ${block.count} people (${block.participants.join(', ')})`}
                                placement="top"
                            >
                                <Box
                                    data-slot-block="true"
                                    data-block-index={index}
                                    position="absolute"
                                    top={`${top}%`}
                                    height={`${height}%`}
                                    left="0"
                                    right="0"
                                    w="calc(100% - 8px)" // Constrain width to prevent overflow
                                    bg={bgColor}
                                    color={textColor}
                                    borderTopRadius={isSingleBlock || isFirstInGroup ? 'md' : '0'}
                                    borderBottomRadius={isSingleBlock || isLastInGroup ? 'md' : '0'}
                                    boxShadow="sm"
                                    mx={1}
                                    p={1.5}
                                    cursor="pointer"
                                    transition="all 0.2s"
                                    _hover={{ transform: 'scale(1.01)', zIndex: 10, boxShadow: 'md' }}
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    overflow="hidden"
                                    minHeight="32px" // Ensure minimum height for text
                                >
                                    <VStack spacing={0} lineHeight="1.2" w="full">
                                        {/* Time range */}
                                        <Text
                                            fontSize="1.10rem"
                                            fontWeight="600"
                                            whiteSpace="nowrap"
                                            overflow="hidden"
                                            textOverflow="ellipsis"
                                            w="full"
                                            textAlign="center"
                                        >
                                            {format(block.start, 'h:mm a')} - {format(block.end, 'h:mm a')}
                                        </Text>
                                        {/* Participant count */}
                                        <Text
                                            fontSize="1.10rem"
                                            fontWeight="bold"
                                            whiteSpace="nowrap"
                                        >
                                            {block.count} {block.count === 1 ? 'person' : 'people'}
                                        </Text>
                                    </VStack>
                                </Box>
                            </Tooltip>
                        );
                    })}

                    {/* Drag Preview Overlay */}
                    {isDragging && dragStart && dragEnd && (
                        <Box
                            position="absolute"
                            top={`${getPosition(dragStart < dragEnd ? dragStart : dragEnd)}%`}
                            height={`${getDurationPercent(
                                dragStart < dragEnd ? dragStart : dragEnd,
                                dragStart < dragEnd ? dragEnd : dragStart
                            )}%`}
                            left="0"
                            right="0"
                            w="calc(100% - 8px)"
                            bg="rgba(190, 41, 236, 0.3)"
                            border="2px dashed #be29ec"
                            borderRadius="md"
                            mx={1}
                            pointerEvents="none"
                            zIndex={10}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Text fontSize="xs" fontWeight="bold" color="purple.800">
                                {format(dragStart < dragEnd ? dragStart : dragEnd, 'h:mm a')} - {format(dragStart < dragEnd ? dragEnd : dragStart, 'h:mm a')}
                            </Text>
                        </Box>
                    )}

                    {/* Empty state message */}
                    {processedBlocks.length === 0 && (
                        <Box
                            position="absolute"
                            top="50%"
                            left="50%"
                            transform="translate(-50%, -50%)"
                            textAlign="center"
                            color="gray.400"
                            pointerEvents="none"
                        >
                            <Text fontSize="sm">
                                {isFinalized ? 'No preferred times selected' : 'Click to add your preferred time'}
                            </Text>
                        </Box>
                    )}
                </Box>
            </Flex>
        </Box>
    );
};

export default TimeSlotDisplay;
