<script lang="ts">
    import { onMount } from "svelte";
    import { app } from "$lib/state";

    export let scroll: number;
    let self: HTMLElement;
    let mounted: boolean = false;

    const onScroll = () => {
        if (mounted && self) self.scroll(0, scroll);
    }

    onMount(() => mounted = true);

    $: scroll, onScroll();
</script>

<main class:translucent={$app.creatingNewEvent} class="transition-opacity duration-300 ease-ease w-fit border-r border-rgba2 flex flex-col items-center py-2 h-screen overflow-scroll pl-2 pr-1.5" bind:this={self} style="gap:var(--gap);padding-bottom:calc(var(--gap) + 10px);" style:--gap="{((60 * ($app.zoom / 100))) - 20}px" on:scroll|preventDefault={onScroll}>
    <div class="mb-2 w-full h-[46px] flex flex-col items-center justify-center sticky top-0 flex-none overflow-visible">
        <p>IN</p>
    </div>
    {#each [...Array(24).keys()] as i}
        <p>{(i < 12 ? i : i - 12) || 12}{i < 12 ? 'AM' : 'PM'}</p>
    {/each}
</main>

<style>
    main::-webkit-scrollbar {
        display: none;
    }

    p {
        @apply text-[11px] leading-5 text-gray5 select-none;
        font-family: 'IBM Plex Mono';
    }

    .translucent {
        opacity: 50%;
        pointer-events: none;
    }
</style>