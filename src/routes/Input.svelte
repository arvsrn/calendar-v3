<script lang="ts">
    export let placeholder: string;
    export let value: string = '';
</script>

<div contenteditable {placeholder} class="w-full h-fit px-2.5 py-1.5 text-xs leading-5 border border-rgba2 rounded-md text-white outline-none">
    {value}
</div>

<style>
    [placeholder]:empty::before {
        content: attr(placeholder);
        color: #A0A0A0; 
    }

    [placeholder]:empty:focus::before {
        content: "";
    }
</style>