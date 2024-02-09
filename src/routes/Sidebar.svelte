<script lang="ts">
    import { SidebarState, app } from "$lib/state"; 
    import Input from "./Input.svelte";

    interface Task {
        title: string;
        description: string;
        done: boolean;
    }

    let tab: number = 0;

    let tasks: Task[] = [
        {
            title: 'Write a Flash Fiction Piece',
            description: 'Craft a short story of 300 words or less, exploring a unique premise or unexpect...',
            done: false,
        },
        {
            title: 'Design a Mini Indoor Garden',
            description: 'Transform a small indoor space, such as a windowsill or corner shelf, into a vibrant...',
            done: false,
        },
        {
            title: 'Create a "Day in the Life" Photo Journal',
            description: 'Capture moments from your day through a series of photographs, documenting...',
            done: true,
        }
    ];

    let percentage = 0.33;

    $: tasks, percentage = Math.round((tasks.filter(x => x.done).length / tasks.length) * 100);
</script>

<div id="sidebar" class:translucent={$app.creatingNewEvent} class="transition-opacity duration-300 ease-ease w-[328px] h-full border-r border-gray3 flex flex-row flex-none overflow-hidden">
    <div class:editing={$app.eventSelected} class:not-editing={!$app.eventSelected} class="flex flex-col flex-none w-full">
        <div class="w-full h-16 px-6 flex flex-row gap-3 items-center border-b border-gray3">
            <!-- logo -->
            <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="3.5" cy="3.5" r="3" stroke="#A0A0A0"/>
                <circle cx="3.5" cy="9.5" r="3" stroke="#A0A0A0"/>
                <circle cx="9.5" cy="3.5" r="3" stroke="#A0A0A0"/>
                <circle cx="9.5" cy="9.5" r="3" stroke="#A0A0A0"/>
            </svg>
            <svg width="4" height="12" viewBox="0 0 4 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.5 1L1 11" stroke="white" stroke-opacity="0.3"/>
            </svg>                
            
            <div class="flex flex-row gap-1.5 items-center hover:bg-gray3 px-1.5 -ml-1.5 py-1.5 rounded-lg cursor-pointer">
                <!-- team picture -->
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="10" cy="10" r="10" fill="#0C8CE9"/>
                </svg>                
    
                <p class="text-[13px] text-white select-none">Truelines</p>
    
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.5 6.5L8 4L10.5 6.5" stroke="#A0A0A0"/>
                    <path d="M10.5 9.5L8 12L5.5 9.5" stroke="#A0A0A0"/>
                </svg>                
            </div>
        </div>
        <div class="w-full h-12 border-b border-[rgba(255,255,255,0.07)] px-4 flex flex-row select-none">
            <button class="text-gray5 text-xs h-full box-content hover:text-white px-2" class:tab-selected={$app.sidebar === 0} on:click={() => $app.sidebar = SidebarState.TASKS}>Tasks</button>
            <button class="text-gray5 text-xs h-full box-content hover:text-white px-2" class:tab-selected={$app.sidebar === 1} on:click={() => $app.sidebar = SidebarState.CHAT}>Chat</button>
            <button class="text-gray5 text-xs h-full box-content hover:text-white px-2" class:tab-selected={$app.sidebar === 2} on:click={() => $app.sidebar = SidebarState.EMAIL}>Email</button>
        </div>
        {#if $app.sidebar === SidebarState.TASKS}
            <div class="w-full h-fit px-4 py-3 flex flex-col">
                {#each tasks as task, i}
                    <!--svelte-ignore a11y-no-static-element-interactions a11y-click-events-have-key-events-->
                    <div class="w-full h-fit p-2 flex flex-row gap-2 select-none hover:bg-rgba2 rounded-md cursor-pointer" on:click={() => task.done = !task.done}>
                        <div class="flex items-center justify-center w-3.5 h-3.5 rounded bg-rgba2 border border-rgba2 my-[3px]" class:done={task.done}>
                            {#if task.done}
                                <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clip-path="url(#clip0_292_2393)">
                                        <path d="M0.5 3L3 5.5V5.5C3.99624 3.83967 5.19233 2.30777 6.56149 0.938611L7 0.500102" stroke="white"/>
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_292_2393">
                                        <rect width="8" height="6" fill="white"/>
                                        </clipPath>
                                    </defs>
                                </svg>               
                            {/if}
                        </div>
                        <div class="w-full flex flex-col">
                            <p class="text-white leading-5 text-xs" class:translucent={task.done}>{task.title}</p>
                            <p class="text-gray5 leading-5 text-xs" class:translucent={task.done}>{task.description}</p>
                        </div>
                    </div>
                {/each}

                <div class="w-full h-fit p-2 pl-[30px] flex flex-col">
                    <div class="w-[258px] h-1 rounded bg-rgba3 relative overflow-hidden">
                        <div class="h-full bg-[#ABEFCC] rounded" style:transition="width 75ms var(--ease)" style:width="{percentage}%"></div>
                    </div>
                    <p class="text-[10px] leading-5 text-white select-none">{percentage}% complete</p>
                </div>
            </div>
        {/if}
    </div>
    
    <div class:editing={$app.eventSelected} class:not-editing={!$app.eventSelected} class="flex flex-col flex-none w-full">
        <div class="w-full h-16 px-6 flex flex-row gap-3 items-center border-b border-gray3">
            <!-- logo -->
            <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="3.5" cy="3.5" r="3" stroke="#A0A0A0"/>
                <circle cx="3.5" cy="9.5" r="3" stroke="#A0A0A0"/>
                <circle cx="9.5" cy="3.5" r="3" stroke="#A0A0A0"/>
                <circle cx="9.5" cy="9.5" r="3" stroke="#A0A0A0"/>
            </svg>
            <svg width="4" height="12" viewBox="0 0 4 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.5 1L1 11" stroke="white" stroke-opacity="0.3"/>
            </svg>                
            
            <p class="text-[13px] text-white select-none">Editing event</p>
            <button class="ml-auto h-6 w-fit px-2 rounded-md border border-rgba2 text-gray5 text-xs hover:bg-rgba2 hover:border-transparent select-none" on:click={() => $app.eventSelected = null}>Back</button>
        </div>
        <div class="w-full h-fit px-6 py-4 flex flex-col gap-2">
            <Input placeholder="Title" value="New Event" />
            <Input placeholder="Description" />
            <Input placeholder="Location" />
        </div>
        <div class="w-full h-12 border-y border-[rgba(255,255,255,0.07)] px-4 flex flex-row select-none">
            <button class="text-gray5 text-xs h-full box-content hover:text-white px-2" class:tab-selected={tab === 0} on:click={() => tab = 0}>Tasks</button>
            <button class="text-gray5 text-xs h-full box-content hover:text-white px-2" class:tab-selected={tab === 1} on:click={() => tab = 1}>Comments</button>
        </div>
        <div class="w-full h-fit px-4 py-3 flex flex-col">
            {#each tasks as task, i}
                <!--svelte-ignore a11y-no-static-element-interactions a11y-click-events-have-key-events-->
                <div class="w-full h-fit p-2 flex flex-row gap-2 select-none hover:bg-rgba2 rounded-md cursor-pointer" on:click={() => task.done = !task.done}>
                    <div class="flex items-center justify-center w-3.5 h-3.5 rounded bg-rgba2 border border-rgba2 my-[3px]" class:done={task.done}>
                        {#if task.done}
                            <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g clip-path="url(#clip0_292_2393)">
                                    <path d="M0.5 3L3 5.5V5.5C3.99624 3.83967 5.19233 2.30777 6.56149 0.938611L7 0.500102" stroke="white"/>
                                </g>
                                <defs>
                                    <clipPath id="clip0_292_2393">
                                    <rect width="8" height="6" fill="white"/>
                                    </clipPath>
                                </defs>
                            </svg>               
                        {/if}
                    </div>
                    <div class="w-full flex flex-col">
                        <p class="text-white leading-5 text-xs" class:translucent={task.done}>{task.title}</p>
                        <p class="text-gray5 leading-5 text-xs" class:translucent={task.done}>{task.description}</p>
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>

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

    .done {
        @apply bg-rgba3 border-transparent; 
    }

    .translucent {
        opacity: 50%;
        pointer-events: none;
    }

    * {
        @apply transition-colors duration-75 ease-ease;
    }

    @keyframes editing {
        from {
            transform: translateX(0%);
        }
        
        to {
            transform: translateX(-100%);
        }
    }

    .editing {
        animation: editing 0.3s var(--ease);
        animation-fill-mode: forwards;
    }

    @keyframes not-editing {
        from {
            transform: translateX(-100%);
        }
        
        to {
            transform: translateX(0%);
        }
    }

    .not-editing {
        animation: not-editing 0.3s var(--ease);
        animation-fill-mode: forwards;
    }
</style>