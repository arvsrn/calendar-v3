import { writable, type Writable } from "svelte/store";

export type Month = 'January' | 'February' | 'March' | 'April' | 'May' | 'June' | 'July' | 'August' | 'September' | 'October' | 'November' | 'December';

interface State {
    currentYear: number;
    currentMonth: Month;
    eventSelected: [number, number] | null;

    zoom: number; // percentage
    days: number;
    showingSettings: boolean;
    creatingNewEvent: boolean,

    sidebar: SidebarState;
}

export enum DraggingEvent {
    BOTTOM,
    TOP,
    WHOLE,
}

export enum SidebarState {
    TASKS,
    CHAT,
    EMAIL,
}

export interface CalendarEvent {
    startTime: number;
    endTime: number;
    title: string;
    description: string;
    color: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'pink' | 'gray';
}

export let app: Writable<State> = writable({
    currentYear: 2024,
    currentMonth: 'February',
    eventSelected: null,
    zoom: 100,
    days: 4,
    showingSettings: false,
    creatingNewEvent: false,
    sidebar: SidebarState.TASKS,
});

export const monthNames: Array<Month> = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const monthIndices = {
    January: 0,
    February: 1,
    March: 2,
    April: 3, 
    May: 4,
    June: 5, 
    July: 6, 
    August: 7, 
    September: 8,
    October: 9,
    November: 10,
    December: 11,
};
export const monthDays: number[] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];