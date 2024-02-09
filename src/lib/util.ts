export function clickOutside(node: HTMLElement, handler: (e: MouseEvent) => void): { destroy: () => void } {
    const onClick = (event: MouseEvent) =>
        node 
        && !node.contains(event.target as HTMLElement) 
        && !event.defaultPrevented 
        && handler(event);
  
    document.addEventListener('click', onClick, true);
    document.addEventListener('contextmenu', onClick, true);
  
    return {
        destroy() {
            document.removeEventListener('click', onClick, true);
            document.removeEventListener('contextmenu', onClick, true);
        },
    };
};

export const snapToGrid = (x: number): number => Math.ceil(x / 15) * 15;