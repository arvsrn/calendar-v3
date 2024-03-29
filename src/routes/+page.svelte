<script lang="ts">
    import { onMount } from "svelte";
    import { app, monthNames, dayNames, type CalendarEvent, DraggingEvent } from "$lib/state";
    import Sidebar from "./Sidebar.svelte";
    import Timezones from "./Timezones.svelte";
    import { Calendar, DropdownMenu } from "bits-ui";
    import { slide } from "svelte/transition";
    import { clickOutside, snapToGrid, clearSelection } from "$lib/util";
    import RangeInput from "./RangeInput.svelte"
    
    export let scroll = 0;

    let viewport: HTMLElement;
    let mounted: boolean;
    let columnWidth: number = 139;

    const snapThreshold = 300;
    const day = 8_64_00_000; // one day in milliseconds

    let lastScrollLeft = 0;
    let lastScrollTime = Date.now();

    let viewportHeld: boolean = false;
    
    let creatingEventIn: string | null = null;
    let creatingEventDragging: boolean = false;
    let creatingEventHandlePosition: number = 0;
    let creatingEventStartPosition: number = 0;
    let creatingEventEndPosition: number = 0;
    let creatingEventHandleShow: boolean = true;

    let editEventIn: string | null;
    let editEventDragging: string | null;
    let editEventDraggingHandle: DraggingEvent;

    let lastEventMouseDown: number = 0;

    let days: Array<CalendarEvent[]> = [];
    
    for (let i = 0; i < 10; i++) {
        days.push([
           {
                startTime: 60,
                endTime: 135,
                title: 'Lunch',
                description: 'Consume food',
                color: 'yellow'
            }
        ]);
    }

    let start = Date.now();

    const setColumnWidth = () => {
        if (mounted)
            columnWidth = viewport.clientWidth / $app.days;
    };

    onMount(() => {
        mounted = true;
        setColumnWidth();
        viewport.scroll(columnWidth, 0)
    });

    class Viewport {
        static onScroll(event: Event) {
            // infinite scrolling
            if (viewport.scrollLeft === 0) {
                start -= day; // one day in ms
                viewport.scroll(columnWidth, viewport.scrollTop);
            } else if (viewport.scrollLeft === viewport.scrollWidth - viewport.clientWidth) {
                start += day; // one day in ms
                viewport.scroll(columnWidth, viewport.scrollTop);
            }

            setTimeout(() => {
                // check if user scrolled in the last `snapThreshold` milliseconds, snap if false
                if (((Date.now() - lastScrollTime) < snapThreshold) && !viewportHeld) {
                    viewport.scroll({
                        left: ((viewport.scrollLeft % columnWidth) < (columnWidth/2)) // decide whether to snap on the left or right
                            ? (viewport.scrollLeft - (viewport.scrollLeft % columnWidth)) + 1
                            : (viewport.scrollLeft + columnWidth - (viewport.scrollLeft % columnWidth)) + 1,
                        top: viewport.scrollTop,
                        behavior: 'smooth',
                    });
                }
            }, snapThreshold);

            lastScrollLeft = viewport.scrollLeft;
            lastScrollTime = Date.now();

            const currentDate = new Date(start);
            $app.currentMonth = monthNames[currentDate.getMonth()];
            $app.currentYear = currentDate.getFullYear();
            
            scroll = viewport.scrollTop;
        }

        static onMouseDown() {
            clearSelection();
            viewportHeld = true;
        }

        static onMouseUp() {
            viewportHeld = false;

            lastScrollLeft = viewport.scrollLeft;
            lastScrollTime = Date.now();

            setTimeout(() => {
                // check if user scrolled in the last `snapThreshold` milliseconds, snap if false
                if (((Date.now() - lastScrollTime) <= (snapThreshold + 50)) && !viewportHeld) {
                    viewport.scroll({
                        left: ((viewport.scrollLeft % columnWidth) < (columnWidth/2)) // decide whether to snap on the left or right
                            ? (viewport.scrollLeft - (viewport.scrollLeft % columnWidth)) + 1
                            : (viewport.scrollLeft + columnWidth - (viewport.scrollLeft % columnWidth)) + 1,
                        top: viewport.scrollTop,
                        behavior: 'smooth',
                    });
                }
            }, snapThreshold);
        }

        static onMouseMove(event: MouseEvent) {
            if (viewportHeld && !$app.creatingNewEvent && !editEventDragging) {
                viewport.scroll(viewport.scrollLeft-event.movementX, viewport.scrollTop);
            }
        }

        static onColumnMouseEnter(event: MouseEvent) {
            const element = event.target as HTMLElement;
            setTimeout(() => creatingEventIn = element.dataset.id || null, 10);
        }

        static onColumnMouseLeave() {
            creatingEventIn = null;
        }

        static onColumnMouseMove(event: MouseEvent) {
            const element = event.target as HTMLElement;

            if (element.dataset.id === creatingEventIn)
                creatingEventHandlePosition = event.offsetY;
            
            if (creatingEventDragging)
                creatingEventEndPosition = creatingEventHandlePosition;
            
            if (editEventDragging && editEventIn) {
                const column = parseInt(editEventIn);
                const event_ = parseInt(editEventDragging);
                
                switch (editEventDraggingHandle) {
                    case DraggingEvent.BOTTOM:
                        days[column][event_].endTime += event.movementY;
                        break;
                        
                    case DraggingEvent.TOP:
                        days[column][event_].startTime += event.movementY;
                        break;
                        
                    case DraggingEvent.WHOLE:
                        days[column][event_].startTime += event.movementY;
                        days[column][event_].endTime += event.movementY;
                        break;
                }
            }
        }

        static onEventMouseDown(event: MouseEvent, columnId: number, eventId: number) {
            editEventDragging = eventId.toString();
            editEventIn = columnId.toString();

            const newStartTime = Math.min(days[columnId][eventId].startTime, days[columnId][eventId].endTime);
            const newEndTime = Math.max(days[columnId][eventId].startTime, days[columnId][eventId].endTime);

            days[columnId][eventId].startTime = newStartTime;
            days[columnId][eventId].endTime = newEndTime;
        }

        static setDragging(type: DraggingEvent) {
            editEventDraggingHandle = type;
        }

        static onColumnMouseDown() {
            if ($app.creatingNewEvent) {
                creatingEventDragging = true;
                creatingEventStartPosition = creatingEventHandlePosition;
                creatingEventEndPosition = creatingEventHandlePosition;
                creatingEventHandleShow = false;
            }
        }

        static onColumnMouseUp() {
            creatingEventDragging = false;
            creatingEventHandleShow = true;
            
            if (creatingEventIn && $app.creatingNewEvent) {
                days[parseInt(creatingEventIn)] = [...days[parseInt(creatingEventIn)], {
                    startTime: creatingEventStartPosition,
                    endTime: creatingEventEndPosition,
                    title: 'New Event',
                    description: '',
                    color: 'gray'
                }];
            }

            $app.creatingNewEvent = false;

            editEventDragging = null;
            editEventIn = null;
        }
    }

    const shortcuts = (event: KeyboardEvent) => {
        if (event.key === 'N' || event.key === 'n') {
            $app.creatingNewEvent = true;
        } else if (event.key === "Escape") {
            $app.creatingNewEvent = false;
            creatingEventDragging = false;
            creatingEventHandleShow = false;
        }
    }

    $: $app.days, setColumnWidth();
</script>

<main class="w-screen h-screen flex flex-row bg-gray2">
    <Sidebar></Sidebar>

    <Timezones bind:scroll={scroll}></Timezones>

    <div class="w-full h-full flex flex-col overflow-hidden">
        <nav class="w-full h-[52px] flex-none flex flex-row pl-6 pr-4 gap-2 items-center">
            <p class="text-sm text-white select-none font-medium">February <span class="text-gray5">2024</span></p>

            <DropdownMenu.Root>
                <DropdownMenu.Trigger class="px-2 leading-5 text-[11px] text-gray5 font-medium bg-rgba3 rounded-md select-none hover:bg-[rgba(255,255,255,0.3)]">
                    W5
                </DropdownMenu.Trigger>
                <DropdownMenu.Content class="z-[100]">
                    <Calendar.Root
                        class="mt-1 rounded-[15px] border border-rgba3 bg-background p-4 bg-gray2"
                        let:months
                        let:weekdays
                        weekdayFormat="short"
                        fixedWeeks={true}
                    >
                        <Calendar.Header class="flex items-center justify-between text-white">
                            <Calendar.PrevButton class="inline-flex size-7 items-center justify-center rounded-md bg-transparent hover:bg-rgba3 active:scale-98 active:transition-all">
                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 11L5.5 7.5L9 4" stroke="currentColor"/>
                                </svg>
                            </Calendar.PrevButton>
                            
                            <Calendar.Heading class="text-[13px] font-medium" />

                            <Calendar.NextButton class="inline-flex size-7 items-center justify-center rounded-md bg-transparent hover:bg-rgba3 active:scale-98 active:transition-all">
                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 4L9.5 7.5L6 11" stroke="currentColor"/>
                                </svg>
                            </Calendar.NextButton>
                        </Calendar.Header>

                        <div class="flex flex-col space-y-4 pt-2 sm:flex-row sm:space-x-4 sm:space-y-0">
                            {#each months as month, i (i)}
                                <Calendar.Grid class="w-full border-collapse select-none space-y-1">
                                    <Calendar.GridHead>

                                    <Calendar.GridRow class="mb-1 flex w-full justify-between">
                                        {#each weekdays as day}
                                            <Calendar.HeadCell class="w-7 rounded-md text-[11px] !font-normal font-mono text-gray5">
                                                <div>{day.slice(0, 2)}</div>
                                            </Calendar.HeadCell>
                                        {/each}
                                    </Calendar.GridRow>

                                    </Calendar.GridHead>

                                    <Calendar.GridBody>
                                        {#each month.weeks as weekDates}
                                            <Calendar.GridRow class="flex w-full">
                                            {#each weekDates as date}
                                                <Calendar.Cell {date} class="relative size-7 !p-0 text-center text-xs" >
                                                    <Calendar.Day {date} month={month.value} class="relative inline-flex size-7 items-center justify-center whitespace-nowrap rounded-md border border-transparent bg-transparent p-0 text-xs font-normal text-white hover:bg-rgba2 data-[disabled]:pointer-events-none data-[outside-month]:pointer-events-none data-[outside-month]:text-gray5 data-[selected]:bg-rgba3 data-[selected]:font-medium data-[disabled]:text-foreground/30 data-[selected]:text-background data-[unavailable]:text-muted-foreground data-[unavailable]:line-through">
                                                        <div class="absolute top-[5px] hidden size-1 rounded-full bg-foreground group-data-[today]:block group-data-[selected]:bg-background"/>
                                                        {date.day}
                                                    </Calendar.Day>
                                                </Calendar.Cell>
                                            {/each}
                                            </Calendar.GridRow>
                                        {/each}
                                    </Calendar.GridBody>
                                </Calendar.Grid>
                            {/each}
                        </div>
                    </Calendar.Root>
                </DropdownMenu.Content>
            </DropdownMenu.Root>

            <div class="flex flex-row">
                <button class="w-5 h-5 flex flex-col items-center justify-center rounded-md hover:bg-rgba3">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.5 10.2929C9.5 10.7383 8.96143 10.9614 8.64645 10.6464L6.35355 8.35355C6.15829 8.15829 6.15829 7.84171 6.35355 7.64645L8.64645 5.35355C8.96143 5.03857 9.5 5.26165 9.5 5.70711V10.2929Z" fill="#A0A0A0" stroke="#A0A0A0"/>
                    </svg>                    
                </button>
                <button class="w-5 h-5 flex flex-col items-center justify-center rounded-md hover:bg-rgba3">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6.5 5.70711C6.5 5.26165 7.03857 5.03857 7.35355 5.35355L9.64645 7.64645C9.84171 7.84171 9.84171 8.15829 9.64645 8.35355L7.35355 10.6464C7.03857 10.9614 6.5 10.7383 6.5 10.2929V5.70711Z" fill="#A0A0A0" stroke="#A0A0A0"/>
                    </svg>                                    
                </button>
            </div>

            <div class="flex flex-row ml-auto gap-2">
                <div class="h-6">
                    <RangeInput bind:value={$app.days} />
                </div>
                <button on:click={() => $app.creatingNewEvent = !$app.creatingNewEvent} class="h-6 w-fit px-2 pr-[5px] rounded-md bg-[#0C8CE9] text-white text-xs font-medium hover:bg-[#5EB3EF] hover:border-transparent select-none flex flex-row items-center justify-center gap-1.5">
                    {#if $app.creatingNewEvent}
                        Cancel
                        <svg width="24" height="14" viewBox="0 0 24 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="24" height="14" rx="2" fill="black" fill-opacity="0.2"/>
                            <path d="M5.87469 11.1172C5.27312 11.1172 4.75359 10.9922 4.31609 10.7422C3.8812 10.4896 3.54656 10.1328 3.31219 9.67187C3.07781 9.20833 2.96062 8.66276 2.96062 8.03516C2.96062 7.41797 3.07781 6.8763 3.31219 6.41016C3.54917 5.94141 3.8799 5.57682 4.30437 5.31641C4.72885 5.05339 5.22755 4.92188 5.80047 4.92188C6.17026 4.92188 6.51922 4.98177 6.84734 5.10156C7.17807 5.21875 7.46974 5.40104 7.72234 5.64844C7.97755 5.89583 8.17807 6.21094 8.32391 6.59375C8.46974 6.97396 8.54266 7.42708 8.54266 7.95312V8.38672H3.62469V7.43359H7.18719C7.18458 7.16276 7.12599 6.92187 7.01141 6.71094C6.89682 6.4974 6.73667 6.32943 6.53094 6.20703C6.32781 6.08464 6.09083 6.02344 5.82 6.02344C5.53094 6.02344 5.27703 6.09375 5.05828 6.23437C4.83953 6.3724 4.66896 6.55469 4.54656 6.78125C4.42677 7.00521 4.36557 7.2513 4.36297 7.51953V8.35156C4.36297 8.70052 4.42677 9 4.55437 9.25C4.68198 9.4974 4.86036 9.6875 5.08953 9.82031C5.3187 9.95052 5.58693 10.0156 5.89422 10.0156C6.09995 10.0156 6.28615 9.98698 6.45281 9.92969C6.61948 9.86979 6.76401 9.78255 6.88641 9.66797C7.0088 9.55339 7.10125 9.41146 7.16375 9.24219L8.48406 9.39062C8.40073 9.73958 8.24187 10.0443 8.0075 10.3047C7.77573 10.5625 7.47885 10.763 7.11687 10.9062C6.7549 11.0469 6.34083 11.1172 5.87469 11.1172ZM14.5361 6.58594L13.2471 6.72656C13.2106 6.59635 13.1468 6.47396 13.0557 6.35938C12.9671 6.24479 12.8473 6.15234 12.6963 6.08203C12.5452 6.01172 12.3604 5.97656 12.1416 5.97656C11.8473 5.97656 11.5999 6.04036 11.3994 6.16797C11.2015 6.29557 11.1038 6.46094 11.1064 6.66406C11.1038 6.83854 11.1676 6.98047 11.2979 7.08984C11.4307 7.19922 11.6494 7.28906 11.9541 7.35938L12.9775 7.57812C13.5452 7.70052 13.9671 7.89453 14.2432 8.16016C14.5218 8.42578 14.6624 8.77344 14.665 9.20312C14.6624 9.58073 14.5518 9.91406 14.333 10.2031C14.1169 10.4896 13.8161 10.7135 13.4307 10.875C13.0452 11.0365 12.6025 11.1172 12.1025 11.1172C11.3682 11.1172 10.777 10.9635 10.3291 10.6562C9.88118 10.3464 9.61426 9.91536 9.52832 9.36328L10.9072 9.23047C10.9697 9.5013 11.1025 9.70573 11.3057 9.84375C11.5088 9.98177 11.7731 10.0508 12.0986 10.0508C12.4346 10.0508 12.7041 9.98177 12.9072 9.84375C13.113 9.70573 13.2158 9.53516 13.2158 9.33203C13.2158 9.16016 13.1494 9.01823 13.0166 8.90625C12.8864 8.79427 12.6833 8.70833 12.4072 8.64844L11.3838 8.43359C10.8083 8.3138 10.3825 8.11198 10.1064 7.82812C9.8304 7.54167 9.69368 7.17969 9.69629 6.74219C9.69368 6.3724 9.79394 6.05208 9.99707 5.78125C10.2028 5.50781 10.488 5.29687 10.8525 5.14844C11.2197 4.9974 11.6429 4.92188 12.1221 4.92188C12.8252 4.92188 13.3786 5.07161 13.7822 5.37109C14.1885 5.67057 14.4398 6.07552 14.5361 6.58594ZM18.5032 11.1172C17.9043 11.1172 17.39 10.9857 16.9603 10.7227C16.5332 10.4596 16.2038 10.0964 15.972 9.63281C15.7428 9.16667 15.6282 8.63021 15.6282 8.02344C15.6282 7.41406 15.7454 6.8763 15.9798 6.41016C16.2142 5.94141 16.5449 5.57682 16.972 5.31641C17.4017 5.05339 17.9095 4.92188 18.4954 4.92188C18.9824 4.92188 19.4134 5.01172 19.7884 5.19141C20.166 5.36849 20.4668 5.61979 20.6907 5.94531C20.9147 6.26823 21.0423 6.64583 21.0736 7.07812H19.722C19.6673 6.78906 19.5371 6.54818 19.3314 6.35547C19.1282 6.16016 18.8561 6.0625 18.515 6.0625C18.2259 6.0625 17.972 6.14062 17.7532 6.29687C17.5345 6.45052 17.3639 6.67187 17.2415 6.96094C17.1217 7.25 17.0618 7.59635 17.0618 8C17.0618 8.40885 17.1217 8.76042 17.2415 9.05469C17.3613 9.34635 17.5293 9.57161 17.7454 9.73047C17.9642 9.88672 18.2207 9.96484 18.515 9.96484C18.7233 9.96484 18.9095 9.92578 19.0736 9.84766C19.2402 9.76693 19.3795 9.65104 19.4915 9.5C19.6035 9.34896 19.6803 9.16536 19.722 8.94922H21.0736C21.0397 9.3737 20.9147 9.75 20.6986 10.0781C20.4824 10.4036 20.1881 10.6589 19.8157 10.8437C19.4433 11.026 19.0058 11.1172 18.5032 11.1172Z" fill="white" fill-opacity="0.8"/>
                        </svg>                        
                    {:else}
                        New Event
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="14" height="14" rx="2" fill="black" fill-opacity="0.2"/>
                            <path d="M10.2866 3V11H8.99756L5.22803 5.55078H5.16162V11H3.7124V3H5.00928L8.7749 8.45312H8.84522V3H10.2866Z" fill="white" fill-opacity="0.8"/>
                        </svg>
                    {/if}
                </button>
                <button class="h-6 w-fit px-2 rounded-md border border-rgba2 text-gray5 text-xs font-medium hover:bg-rgba2 hover:border-transparent select-none">Share</button>
            </div>
        </nav>

        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div bind:this={viewport} class="w-full h-full flex flex-row overflow-scroll scrollbar-hidden relative" on:mousedown={Viewport.onMouseDown} on:scroll|preventDefault={Viewport.onScroll}>
            {#each [...Array($app.days+2).keys()] as d} 
                {@const currentDate = new Date(start + (d * day))}

                <div class="h-screen flex-none" style:width="{columnWidth}px">
                    <div class="w-full sticky top-0 z-20">
                        <div class="h-9 w-full flex items-center justify-center text-[11px] text-gray5 bg-gray2 select-none">
                            {dayNames[currentDate.getDay()]} {currentDate.getUTCDate()}
                        </div>
                        <div class="h-6 w-full border-b border-t border-r border-rgba2 bg-gray2" class:weekend={[0, 6].includes(currentDate.getDay())}></div>
                    </div>

                    <div class="w-full relative border-r border-rgba2 bg-gray2" style:height="{60 * 1.0 * 24}px" class:weekend={[0, 6].includes(currentDate.getDay())} data-id={d} class:creating-new-event={creatingEventIn === d.toString()} on:mouseenter={Viewport.onColumnMouseEnter} on:mousemove={Viewport.onColumnMouseMove} on:mouseleave={Viewport.onColumnMouseLeave} on:mousedown={Viewport.onColumnMouseDown} on:mouseup={Viewport.onColumnMouseUp}>
                        {#each days[d] as event, i} 
                            {@const startTime = snapToGrid(Math.min(event.startTime, event.endTime))}
                            {@const endTime = snapToGrid(Math.max(event.startTime, event.endTime))}
                        
                            <div 
                                class:translucent={$app.creatingNewEvent} 
                                class:selected={$app.eventSelected?.[0] === d && $app.eventSelected[1] === i}
                                class="{event.color} calendar-event overflow-hidden cursor-grab transition-opacity duration-300 ease-ease absolute w-[calc(100%-4px)] left-1 rounded flex flex-row gap-1.5 p-[3px] select-none" 
                                style:top="{startTime}px"
                                style:height="{endTime - startTime}px"
                                data-id={i}
                                use:clickOutside={e => {
                                    // @ts-ignore
                                    if (!!$app.eventSelected && (!(document.getElementById('sidebar')?.contains(e.target) || document.getElementById('sidebar') === e.target || document.getElementById('sidebar-clickable')?.contains(e.target) || document.getElementById('sidebar-clickable') === e.target))) {
                                        $app.eventSelected = null;
                                    }
                                }}
                                on:mousedown|self={e => {
                                    Viewport.onEventMouseDown(e, d, i);
                                    Viewport.setDragging(DraggingEvent.WHOLE);
                                    lastEventMouseDown = Date.now();
                                }}
                                on:mouseup={() => {
                                    if (Date.now() - lastEventMouseDown < 350) 
                                        setTimeout(() => $app.eventSelected = [d, i], 10);
                                }}
                            >
                                <div data-color class="pointer-events-none h-full rounded-sm w-[4px]"></div>
                                
                                <div class="pointer-events-none flex flex-col py-0.5">
                                    <p data-title class="text-xs leading-4 ">{event.title}</p>
                                    <p data-description class="text-xs leading-4 ">{event.description}</p>
                                    <p data-timestamp class="text-[11px] leading-4 ">
                                        {
                                            Math.floor(startTime/60) <= 12 ? 
                                                Math.floor(startTime/60) 
                                                : Math.floor(startTime/60) - 12
                                        }{Math.floor(((startTime/60)%1)*60) !== 0 ? `:${Math.floor(((startTime/60)%1)*60) < 10 ? '0' + Math.floor(((startTime/60)%1)*60) : Math.floor(((startTime/60)%1)*60)}` : ''}{
                                            (Math.floor(endTime/60) < 12 ? 'AM' : 'PM') ===
                                            (Math.floor(startTime/60) < 12 ? 'AM' : 'PM') ? '' : (Math.floor(startTime/60) < 12 ? 'AM' : 'PM')
                                        }—{
                                            Math.floor(endTime/60) <= 12 ? 
                                                Math.floor(endTime/60) 
                                                : Math.floor(endTime/60) - 12
                                        }{Math.floor(((endTime/60)%1)*60) !== 0 ? `:${Math.floor(((endTime/60)%1)*60) < 10 ? '0' + Math.floor(((endTime/60)%1)*60) : Math.floor(((endTime/60)%1)*60)}` : ''}{
                                            Math.floor(endTime/60) < 12 ? 'AM' : 'PM'
                                        }
                                    </p>
                                </div>

                                <div class="w-full absolute bottom-0 h-2 cursor-ns-resize z-50 left-0" on:mousedown={e => {
                                    Viewport.onEventMouseDown(e, d, i);
                                    Viewport.setDragging(DraggingEvent.BOTTOM);
                                }}></div>

                                <div class="w-full absolute top-0 h-2 cursor-ns-resize z-50 left-0" on:mousedown={e => {
                                    Viewport.onEventMouseDown(e, d, i);
                                    Viewport.setDragging(DraggingEvent.TOP);
                                }}></div>
                            </div>
                        {/each}
                        
                        {#if $app.creatingNewEvent && creatingEventIn === d.toString() && creatingEventHandleShow}
                            <div class="absolute w-[calc(100%-4px)] left-1 rounded h-[3px] bg-[rgba(255,255,255,0.5)] z-50" style:top="{creatingEventHandlePosition}px"></div>
                        {/if}

                        {#if creatingEventDragging && creatingEventIn === d.toString()} 
                            {@const startTime = snapToGrid(Math.min(creatingEventEndPosition, creatingEventStartPosition))}
                            {@const endTime = snapToGrid(Math.max(creatingEventEndPosition, creatingEventStartPosition))}

                            <div style:top="{startTime}px" style:height="{endTime - startTime}px" class:align-vertical={(endTime - startTime) <= 30} class="gray calendar-event overflow-hidden absolute w-[calc(100%-4px)] left-1 bg-[#2F4655] rounded flex flex-row gap-1.5 p-[3px] select-none pointer-events-none">
                                <div data-color class="h-full rounded-sm w-[4px]"></div>
                                <div class="flex flex-col py-0.5">
                                    {#if (endTime - startTime) > 30}
                                        <p data-title class="text-xs leading-4" transition:slide={{ duration: 300 }}>New Event</p>
                                    {/if}
                                    
                                    <p data-timestamp class="text-[11px] leading-4 ">
                                        {
                                            Math.floor(startTime/60) <= 12 ? 
                                                Math.floor(startTime/60) 
                                                : Math.floor(startTime/60) - 12
                                        }{Math.floor(((startTime/60)%1)*60) !== 0 ? `:${Math.floor(((startTime/60)%1)*60) < 10 ? '0' + Math.floor(((startTime/60)%1)*60) : Math.floor(((startTime/60)%1)*60)}` : ''}{
                                            (Math.floor(endTime/60) < 12 ? 'AM' : 'PM') ===
                                            (Math.floor(startTime/60) < 12 ? 'AM' : 'PM') ? '' : (Math.floor(startTime/60) < 12 ? 'AM' : 'PM')
                                        }—{
                                            Math.floor(endTime/60) <= 12 ? 
                                                Math.floor(endTime/60) 
                                                : Math.floor(endTime/60) - 12
                                        }{Math.floor(((endTime/60)%1)*60) !== 0 ? `:${Math.floor(((endTime/60)%1)*60) < 10 ? '0' + Math.floor(((endTime/60)%1)*60) : Math.floor(((endTime/60)%1)*60)}` : ''}{
                                            Math.floor(endTime/60) < 12 ? 'AM' : 'PM'
                                        }
                                    </p>
                                </div>
                            </div>
                        {/if}

                        {#each [...Array(23).keys()] as i} 
                            <div class="h-[1px] w-full bg-rgba1 absolute z-10" style:top="{60 * 1.0 * (i + 1)}px"></div>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    </div>
</main>

<svelte:window on:mousemove={Viewport.onMouseMove} on:mouseup={Viewport.onMouseUp} on:keydown={shortcuts} on:resize={setColumnWidth} />

<style>
    .scrollbar-hidden::-webkit-scrollbar {
        display: none;
    }

    .weekend {
        @apply bg-gray1;
    }

    .tab-selected {
        @apply text-white border-b-2 border-white;
    }

    .translucent {
        opacity: 50%;
        pointer-events: none;
    }

    .align-vertical {
        align-items: center;
    }

    .blue {
        --color: #4CA8DF;
    }

    .orange {
        --color: #FF7D32;
    }

    .green {
        --color: #42D692;
    }
    
    .red {
        --color: #FF3838;
    }

    .yellow {
        --color: #FFB932;
    }

    .gray {
        --color: #FFFFFF;
    }

    .pink {
        --color: #F043FF;
    }
    
    .calendar-event {
        border: 1px solid transparent;
        background: color-mix(in srgb, var(--color) 20%, #202020);
    }

    .calendar-event.selected {
        border: 1px solid var(--color);
    }

    .calendar-event > [data-color] {
        background: var(--color);
    }

    .calendar-event > div > [data-title],
    .calendar-event > div > [data-description],
    .calendar-event > div > [data-timestamp] {
        color: color-mix(in srgb, white 20%, var(--color));
    }

    .calendar-event > div > [data-description],
    .calendar-event > div > [data-timestamp] {
        opacity: 60%
    }

    * {
        @apply transition-colors duration-75 ease-ease;
    }
</style>