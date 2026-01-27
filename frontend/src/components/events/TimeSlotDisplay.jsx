import React, { useMemo, useState, useRef, useCallback, memo } from 'react';
import { format, differenceInMinutes, addMinutes, isSameDay, setHours, setMinutes } from 'date-fns';
import { Box, Tooltip, Text, Flex, VStack } from '@chakra-ui/react';

// Memoized grid line component
const GridLine = memo(({ hour, minHour, maxHour }) => (
    <Box
        position="absolute"
        top={`${((hour - minHour) / (maxHour - minHour)) * 100}%`}
        w="full"
        h="1px"
        bg="gray.100"
        pointerEvents="none"
    />
));
GridLine.displayName = 'GridLine';

// Memoized time label component
const TimeLabel = memo(({ hour, minHour, maxHour }) => (
    <Box
        position="absolute"
        top={`${((hour - minHour) / (maxHour - minHour)) * 100}%`}
        transform="translateY(-50%)"
    >
        {format(new Date().setHours(hour, 0), 'h:mm a')}
    </Box>
));
TimeLabel.displayName = 'TimeLabel';

// Memoized slot block component
const SlotBlock = memo(({
    block,
    index,
    top,
    height,
    bgColor,
    textColor,
    isFirstInGroup,
    isLastInGroup,
    isSingleBlock
}) => (
    <Tooltip
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
            w="calc(100% - 8px)"
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
            minHeight="32px"
        >
            <VStack spacing={0} lineHeight="1.2" w="full">
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
));
SlotBlock.displayName = 'SlotBlock';

/**
 * TimeSlotDisplay Component
 * Renders a continuous vertical timeline of preferred time slots.
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
    const [dragStartY, setDragStartY] = useState(null);
    const [clickedSlot, setClickedSlot] = useState(null);

    // Memoize hour markers array
    const hourMarkers = useMemo(() => {
        const markers = [];
        for (let i = minHour; i <= maxHour; i++) {
            markers.push(i);
        }
        return markers;
    }, [minHour, maxHour]);

    // Color scheme based on participant count
    const getSlotColor = useCallback((count) => {
        if (count <= 0) return 'transparent';
        if (count <= 2) return '#efbbff';
        if (count <= 4) return '#d896ff';
        if (count <= 6) return '#be29ec';
        if (count <= 9) return '#800080';
        return '#660066';
    }, []);

    const getTextColor = useCallback((count) => {
        return count >= 7 ? 'white' : 'black';
    }, []);

    // Process slots to calculate density and merge adjacent blocks
    const processedBlocks = useMemo(() => {
        if (!slots || slots.length === 0) return [];

        const timeBlocks = slots.map(slot => ({
            start: new Date(slot.start_time_utc || slot.start_time),
            end: new Date(slot.end_time_utc || slot.end_time),
            userId: slot.user_id,
            userName: slot.user_name || 'Unknown',
            id: slot.id
        })).filter(block => isSameDay(block.start, date));

        if (timeBlocks.length === 0) return [];

        const timePoints = new Set();
        timeBlocks.forEach(block => {
            timePoints.add(block.start.getTime());
            timePoints.add(block.end.getTime());
        });

        const sortedPoints = Array.from(timePoints).sort((a, b) => a - b);

        const densitySegments = [];
        for (let i = 0; i < sortedPoints.length - 1; i++) {
            const start = sortedPoints[i];
            const end = sortedPoints[i + 1];

            const activeSlots = timeBlocks.filter(block =>
                block.start.getTime() <= start && block.end.getTime() >= end
            );

            if (activeSlots.length > 0) {
                const uniqueUsers = new Set(activeSlots.map(s => s.userId));
                const participants = activeSlots.map(s => s.userName);

                densitySegments.push({
                    start: new Date(start),
                    end: new Date(end),
                    count: uniqueUsers.size,
                    participants: Array.from(new Set(participants)),
                    slotIds: activeSlots.map(s => s.id)
                });
            }
        }

        const mergedBlocks = [];
        if (densitySegments.length > 0) {
            let current = densitySegments[0];

            for (let i = 1; i < densitySegments.length; i++) {
                const next = densitySegments[i];

                if (current.end.getTime() === next.start.getTime() && current.count === next.count) {
                    current.end = next.end;
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

    // Identify continuous groups for selective border rounding
    const getContinuousGroups = useMemo(() => {
        if (processedBlocks.length === 0) return [];

        const groups = [];
        let currentGroup = [0];

        for (let i = 1; i < processedBlocks.length; i++) {
            const prev = processedBlocks[i - 1];
            const curr = processedBlocks[i];

            if (prev.end.getTime() === curr.start.getTime()) {
                currentGroup.push(i);
            } else {
                groups.push(currentGroup);
                currentGroup = [i];
            }
        }

        if (currentGroup.length > 0) {
            groups.push(currentGroup);
        }

        return groups;
    }, [processedBlocks]);

    // Memoize calculation helpers
    const totalMinutes = useMemo(() => (maxHour - minHour) * 60, [maxHour, minHour]);

    const getPosition = useCallback((dateObj) => {
        const hours = dateObj.getHours();
        const minutes = dateObj.getMinutes();
        const totalMinutesFromStart = (hours - minHour) * 60 + minutes;
        return Math.max(0, (totalMinutesFromStart / totalMinutes) * 100);
    }, [minHour, totalMinutes]);

    const getDurationPercent = useCallback((start, end) => {
        const diff = differenceInMinutes(end, start);
        return (diff / totalMinutes) * 100;
    }, [totalMinutes]);

    const getTimeFromPosition = useCallback((clickY, containerHeight) => {
        const percentage = clickY / containerHeight;
        const minutesFromStart = percentage * totalMinutes;
        const roundedMinutes = Math.round(minutesFromStart / 15) * 15;
        const hours = minHour + Math.floor(roundedMinutes / 60);
        const minutes = roundedMinutes % 60;
        const clampedHours = Math.max(minHour, Math.min(maxHour, hours));
        const clampedMinutes = clampedHours === maxHour ? 0 : minutes;
        return setMinutes(setHours(date, clampedHours), clampedMinutes);
    }, [date, maxHour, minHour, totalMinutes]);

    // Mouse event handlers
    const handleMouseDown = useCallback((event) => {
        if (isFinalized) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const clickY = event.clientY - rect.top;
        const clickedTime = getTimeFromPosition(clickY, rect.height);

        const slotElement = event.target.closest('[data-slot-block="true"]');
        if (slotElement) {
            const blockIndex = parseInt(slotElement.getAttribute('data-block-index'));
            if (blockIndex !== null && !isNaN(blockIndex) && processedBlocks[blockIndex]) {
                setClickedSlot(processedBlocks[blockIndex]);
            }
        }

        setDragStart(clickedTime);
        setDragEnd(clickedTime);
        setDragStartY(event.clientY);
    }, [isFinalized, getTimeFromPosition, processedBlocks]);

    const handleMouseMove = useCallback((event) => {
        if (isFinalized || !dragStart) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const currentY = event.clientY - rect.top;
        const dragDistance = Math.abs(event.clientY - dragStartY);

        if (dragDistance > 10) {
            setIsDragging(true);
            setClickedSlot(null);
            const currentTime = getTimeFromPosition(currentY, rect.height);
            setDragEnd(currentTime);
        }
    }, [isFinalized, dragStart, dragStartY, getTimeFromPosition]);

    const handleMouseUp = useCallback((event) => {
        if (isFinalized || !dragStart) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const endY = event.clientY - rect.top;
        const dragDistance = Math.abs(event.clientY - dragStartY);

        if (dragDistance < 10) {
            if (clickedSlot && onSlotClick) {
                onSlotClick(clickedSlot);
            } else if (onEmptyClick) {
                const clickedTime = getTimeFromPosition(endY, rect.height);
                const startTime = clickedTime;
                const endTime = addMinutes(clickedTime, 30);

                if (!(endTime.getHours() > maxHour || (endTime.getHours() === maxHour && endTime.getMinutes() > 0))) {
                    onEmptyClick({ start: startTime, end: endTime });
                }
            }
        } else if (isDragging && onEmptyClick) {
            const finalTime = getTimeFromPosition(endY, rect.height);
            let startTime = dragStart < finalTime ? dragStart : finalTime;
            let endTime = dragStart < finalTime ? finalTime : dragStart;

            const duration = differenceInMinutes(endTime, startTime);
            if (duration < 15) {
                endTime = addMinutes(startTime, 15);
            }

            if (endTime.getHours() > maxHour || (endTime.getHours() === maxHour && endTime.getMinutes() > 0)) {
                endTime = setMinutes(setHours(date, maxHour), 0);
            }

            onEmptyClick({ start: startTime, end: endTime });
        }

        setIsDragging(false);
        setDragStart(null);
        setDragEnd(null);
        setDragStartY(null);
        setClickedSlot(null);
    }, [isFinalized, dragStart, dragStartY, clickedSlot, onSlotClick, onEmptyClick, getTimeFromPosition, isDragging, maxHour, date]);

    const handleMouseLeave = useCallback(() => {
        setIsDragging(false);
        setDragStart(null);
        setDragEnd(null);
        setDragStartY(null);
        setClickedSlot(null);
    }, []);

    return (
        <Box
            className="time-slot-display"
            w="full"
            h="600px"
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
                        <TimeLabel key={hour} hour={hour} minHour={minHour} maxHour={maxHour} />
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
                    userSelect="none"
                >
                    {/* Grid lines */}
                    {hourMarkers.map(hour => (
                        <GridLine key={`grid-${hour}`} hour={hour} minHour={minHour} maxHour={maxHour} />
                    ))}

                    {/* Render Blocks */}
                    {processedBlocks.map((block, index) => {
                        const top = getPosition(block.start);
                        const height = getDurationPercent(block.start, block.end);
                        const bgColor = getSlotColor(block.count);
                        const textColor = getTextColor(block.count);

                        const groupIndex = getContinuousGroups.findIndex(group => group.includes(index));
                        const group = groupIndex !== -1 ? getContinuousGroups[groupIndex] : [index];
                        const isFirstInGroup = group[0] === index;
                        const isLastInGroup = group[group.length - 1] === index;
                        const isSingleBlock = group.length === 1;

                        return (
                            <SlotBlock
                                key={index}
                                block={block}
                                index={index}
                                top={top}
                                height={height}
                                bgColor={bgColor}
                                textColor={textColor}
                                isFirstInGroup={isFirstInGroup}
                                isLastInGroup={isLastInGroup}
                                isSingleBlock={isSingleBlock}
                            />
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
