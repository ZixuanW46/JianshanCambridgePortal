"use client";

import React, { useMemo, useRef, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";

interface AvailabilityCalendarProps {
    selectedDates: string[]; // YYYY-MM-DD format
    onChange: (dates: string[]) => void;
    readonly?: boolean;
}

export function AvailabilityCalendar({ selectedDates, onChange, readonly = false }: AvailabilityCalendarProps) {
    const calendarWrapperRef = useRef<HTMLDivElement | null>(null);
    const [dragStartDate, setDragStartDate] = useState<string | null>(null);
    const [dragCurrentDate, setDragCurrentDate] = useState<string | null>(null);
    const isDraggingRef = useRef(false);
    const activePointerIdRef = useRef<number | null>(null);

    const normalizeDateKey = (value: string) => {
        const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (!match) return null;
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        const date = new Date(year, month - 1, day);
        if (
            date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day
        ) {
            return null;
        }
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    };

    const parseISODateLocal = (isoDate: string) => {
        const [year, month, day] = isoDate.split("-").map(Number);
        return new Date(year, month - 1, day);
    };

    const formatDateISO = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const selectedDateKeys = useMemo(() => {
        return Array.from(
            new Set(
                selectedDates
                    .map(normalizeDateKey)
                    .filter((date): date is string => Boolean(date))
            )
        );
    }, [selectedDates]);
    const previewDateKeys = dragStartDate && dragCurrentDate
        ? getDateRange(dragStartDate, dragCurrentDate)
        : [];
    const previewDateSet = new Set(previewDateKeys);

    // Convert normalized date strings to Date objects for the Calendar component
    const selectedDays = useMemo(() => {
        return selectedDateKeys.map(parseISODateLocal);
    }, [selectedDateKeys]);

    const commitDates = (dates: string[]) => {
        const normalized = Array.from(
            new Set(
                dates
                    .map(normalizeDateKey)
                    .filter((date): date is string => Boolean(date))
            )
        ).sort();
        onChange(normalized);
    };

    function getDateRange(startISO: string, endISO: string) {
        const [startDate, endDate] = [parseISODateLocal(startISO), parseISODateLocal(endISO)].sort((a, b) => a.getTime() - b.getTime());
        const days: string[] = [];
        const cursor = new Date(startDate);
        while (cursor.getTime() <= endDate.getTime()) {
            days.push(formatDateISO(cursor));
            cursor.setDate(cursor.getDate() + 1);
        }
        return days;
    }

    const toggleDate = (isoDate: string) => {
        if (readonly) return;
        const normalized = normalizeDateKey(isoDate);
        if (!normalized) return;
        if (selectedDateKeys.includes(normalized)) {
            commitDates(selectedDateKeys.filter(d => d !== normalized));
        } else {
            commitDates([...selectedDateKeys, normalized]);
        }
    };

    const applyDraggedSelection = () => {
        const start = dragStartDate;
        const end = dragCurrentDate;
        if (!start || !end) return;

        if (start === end) {
            toggleDate(start);
        } else {
            const range = getDateRange(start, end);
            commitDates([...selectedDateKeys, ...range]);
        }
    };

    const findISODateFromTarget = (target: EventTarget | null) => {
        if (!(target instanceof Element)) return null;
        const dayButton = target.closest("button[data-day-iso]");
        if (!dayButton) return null;
        return dayButton.getAttribute("data-day-iso");
    };

    const findISODateFromPoint = (x: number, y: number) => {
        const element = document.elementFromPoint(x, y);
        return findISODateFromTarget(element);
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (readonly || event.button !== 0) return;
        event.preventDefault();
        const isoDate = findISODateFromTarget(event.target);
        if (!isoDate) return;
        activePointerIdRef.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        isDraggingRef.current = true;
        setDragStartDate(isoDate);
        setDragCurrentDate(isoDate);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (readonly || !isDraggingRef.current) return;
        const isoDate = findISODateFromTarget(event.target) ?? findISODateFromPoint(event.clientX, event.clientY);
        if (!isoDate || !dragStartDate) return;
        setDragCurrentDate(isoDate);
    };

    const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        if (readonly || !isDraggingRef.current) return;
        const pointerId = activePointerIdRef.current;
        if (pointerId !== null && event.currentTarget.hasPointerCapture(pointerId)) {
            event.currentTarget.releasePointerCapture(pointerId);
        }
        applyDraggedSelection();
        isDraggingRef.current = false;
        activePointerIdRef.current = null;
        setDragStartDate(null);
        setDragCurrentDate(null);
    };

    const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
        const pointerId = activePointerIdRef.current;
        if (pointerId !== null && event.currentTarget.hasPointerCapture(pointerId)) {
            event.currentTarget.releasePointerCapture(pointerId);
        }
        isDraggingRef.current = false;
        activePointerIdRef.current = null;
        setDragStartDate(null);
        setDragCurrentDate(null);
    };

    const disableUnavailableDates = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return year !== 2026 || (month !== 6 && month !== 7);
    };

    const handleCalendarSelect = (days: Date[] | undefined) => {
        if (readonly || isDraggingRef.current) return;
        if (!days) {
            commitDates([]);
            return;
        }
        commitDates(days.map(formatDateISO));
    };

    // Generate dates for an entire month
    const getMonthDates = (year: number, month: number) => {
        const dates: string[] = [];
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            dates.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`);
        }
        return dates;
    };

    const julyDates = useMemo(() => getMonthDates(2026, 6), []); // Month is 0-indexed (6 = July)
    const augustDates = useMemo(() => getMonthDates(2026, 7), []);

    const isMonthSelected = (monthDates: string[]) => {
        return monthDates.every(d => selectedDateKeys.includes(d));
    };

    const isAllSelected = isMonthSelected(julyDates) && isMonthSelected(augustDates);
    const isJulySelected = isMonthSelected(julyDates);
    const isAugustSelected = isMonthSelected(augustDates);

    const toggleMonth = (monthDates: string[], isSelected: boolean) => {
        if (readonly) return;
        let newDates = [...selectedDateKeys];
        if (isSelected) {
            // Remove all
            newDates = newDates.filter(d => !monthDates.includes(d));
        } else {
            // Add all
            monthDates.forEach(d => {
                if (!newDates.includes(d)) newDates.push(d);
            });
        }
        commitDates(newDates);
    };

    const toggleAll = (isSelected: boolean) => {
        if (readonly) return;
        if (isSelected) {
            commitDates([]);
        } else {
            const all = Array.from(new Set([...julyDates, ...augustDates]));
            commitDates(all);
        }
    };

    // July 2026 and August 2026 constants
    const july2026 = new Date(2026, 6, 1);

    return (
        <div className="space-y-4">
            {!readonly && (
                <div className="flex flex-col gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-sm font-semibold text-slate-700 mb-1">Quick Select Options</div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                            checked={isJulySelected}
                            onCheckedChange={() => toggleMonth(julyDates, isJulySelected)}
                            disabled={readonly}
                        />
                        <span className="text-sm text-slate-700">I&apos;m available for the entire month of <strong>July</strong></span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                            checked={isAugustSelected}
                            onCheckedChange={() => toggleMonth(augustDates, isAugustSelected)}
                            disabled={readonly}
                        />
                        <span className="text-sm text-slate-700">I&apos;m available for the entire month of <strong>August</strong></span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={() => toggleAll(isAllSelected)}
                            disabled={readonly}
                        />
                        <span className="text-sm text-slate-700">I&apos;m available for <strong>both July and August</strong></span>
                    </label>
                </div>
            )}

            <div
                ref={calendarWrapperRef}
                className="border border-slate-200 rounded-lg p-2 md:p-4 bg-white overflow-hidden flex justify-center"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onPointerCancel={handlePointerCancel}
            >
                {/* Due to Shadcn Calendar using react-day-picker v9, it allows rendering multiple months */}
                <Calendar
                    mode="multiple"
                    selected={selectedDays}
                    onSelect={handleCalendarSelect}
                    modifiers={{
                        drag_preview: (date) => {
                            if (readonly || !isDraggingRef.current) return false;
                            const key = formatDateISO(date);
                            return previewDateSet.has(key) && !selectedDateKeys.includes(key);
                        },
                    }}
                    numberOfMonths={2}
                    defaultMonth={july2026}
                    disableNavigation
                    disabled={disableUnavailableDates}
                    className="pointer-events-auto mx-auto"
                    classNames={{
                        months: "flex flex-col md:flex-row gap-6 md:gap-10",
                    }}
                />
            </div>
            {selectedDateKeys.length > 0 && (
                <p className="text-xs text-slate-500 text-right">
                    Selected {selectedDateKeys.length} days
                </p>
            )}
        </div>
    );
}
