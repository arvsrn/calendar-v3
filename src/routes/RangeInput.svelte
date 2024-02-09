<script lang="ts">
    import { clearSelection } from "$lib/util";

    export let min: number = 1;
    export let max: number = 8;
    export let width: number = 60;
    export let value: number = 4;

    const stepWidth = width / max;

    let innerWidth = value * stepWidth;
    let active: boolean = false;

    const onMouseDown = () => {
        clearSelection();
        active = true;
    };
    
    const onMouseUp = () => {
        active = false;
    };

    const onMouseMove = (event: MouseEvent) => {
        if (active) {
            innerWidth += event.movementX;
            innerWidth = Math.min(Math.max(innerWidth, stepWidth * min), stepWidth * max);
        }
    };

    $: value = Math.floor(innerWidth / stepWidth);
</script>

<div 
    style:width="{width}px" 
    class="transition-all duration-75 h-full rounded-md overflow-hidden bg-rgba3 cursor-ew-resize"
    class:active={active}
    role="presentation"

    on:mousedown={onMouseDown}
>
    <div style:width="{Math.floor(innerWidth / stepWidth) * stepWidth}px" class="h-full bg-[rgba(255,255,255,0.20)] pointer-events-none"></div>
</div>

<svelte:window
    on:mouseup={onMouseUp}
    on:mousemove={onMouseMove}
></svelte:window>

<style>
    .active {
        scale: 1.08333333333;
    }

    div {
        @apply transition-all duration-75;
        transition-timing-function: cubic-bezier(.53,.53,.83,1.36);
    }
</style>