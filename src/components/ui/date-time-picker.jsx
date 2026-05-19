import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

// Parse a YYYY-MM-DD string as LOCAL midnight (avoids UTC-offset bugs in Sweden/UTC+2)
function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Format a Date object to YYYY-MM-DD without UTC conversion
function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function DatePicker({ value, onChange, minDate, maxDate, disabled = false, placeholder = "Välj datum" }) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse as local time so the calendar selection matches what the user sees
  const selectedDate = value ? parseLocalDate(value) : undefined;

  const handleSelect = (date) => {
    if (date) {
      onChange(toDateString(date));
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={`w-full h-11 sm:h-12 justify-start text-left font-normal bg-[#18221E] border border-[#223029] text-[#F4F7F5] hover:bg-[#223029] hover:text-[#F4F7F5] rounded-[14px] transition-all ${
            !value ? 'text-[#7B8A83]' : ''
          }`}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-[#2BA84A] flex-shrink-0" />
          {value ? (
            format(parseLocalDate(value), 'PPP', { locale: sv })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-[#121715] border border-[#223029] rounded-[16px] shadow-xl z-[9999]"
        align="start"
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={(date) => {
            // Compare local dates — avoids UTC-midnight offset issues
            const min = parseLocalDate(minDate);
            const max = parseLocalDate(maxDate);
            if (min && date < min) return true;
            if (max && date > max) return true;
            return false;
          }}
          initialFocus
          locale={sv}
          className="rounded-[16px]"
        />
      </PopoverContent>
    </Popover>
  );
}

export function TimePicker({
  value,
  onChange,
  disabled = false,
  placeholder = "Välj tid",
  minTime = "07:00",
  maxTime = "23:00",
  bookedSlots = [],
  availableSlots = [],
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Build 15-minute intervals within allowed range
  const timeOptions = [];
  for (let hour = 7; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const t = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      if (t < minTime || t > maxTime) continue;
      timeOptions.push(t);
    }
  }

  const isTimeBooked = (t) => bookedSlots.some(s => s.start_time <= t && s.end_time > t);
  const isTimeAvailable = (t) => availableSlots.some(s => s.start_time <= t && s.end_time > t);
  const getBookedBy = (t) => bookedSlots.find(s => s.start_time <= t && s.end_time > t)?.booked_by || '';

  const hasAvailableSlots = availableSlots.length > 0;
  const valueBooked = value && isTimeBooked(value);

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        if (!disabled) setIsOpen(open);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={`w-full h-11 sm:h-12 justify-start text-left font-normal rounded-[14px] border transition-all
            ${valueBooked
              ? 'bg-[#DC2626]/8 border-[#DC2626]/40 text-[#FCA5A5]'
              : 'bg-[#18221E] border-[#223029] text-[#F4F7F5] hover:bg-[#223029] hover:border-[#2BA84A]/50'
            }
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#18221E] disabled:hover:border-[#223029]
          `}
        >
          <Clock className={`mr-2 h-4 w-4 flex-shrink-0 ${valueBooked ? 'text-[#DC2626]' : 'text-[#2BA84A]'}`} />
          {value ? (
            <span>{value}</span>
          ) : (
            <span className="text-[#7B8A83]">{disabled ? 'Välj datum först' : placeholder}</span>
          )}
          {valueBooked && (
            <span className="ml-auto text-[10px] font-semibold text-[#FCA5A5]">⚠ Upptat</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[200px] p-0 bg-[#121715] border border-[#223029] rounded-[16px] shadow-xl z-[9999]"
        align="start"
      >
        {hasAvailableSlots && (
          <div className="px-3 py-1.5 border-b border-[#223029]">
            <span className="text-[9px] font-bold text-[#86EFAC] uppercase tracking-wider">
              ● Grön = ledig tid
            </span>
          </div>
        )}
        <div className="max-h-[280px] overflow-y-auto p-1.5 space-y-0.5">
          {timeOptions.map((t) => {
            const booked = isTimeBooked(t);
            const available = isTimeAvailable(t);
            const selected = value === t;
            const bookedBy = getBookedBy(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  if (!booked) {
                    onChange(t);
                    setIsOpen(false);
                  }
                }}
                disabled={booked}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors flex items-center justify-between gap-2
                  ${booked
                    ? 'text-[#FCA5A5]/40 cursor-not-allowed'
                    : selected
                      ? 'bg-[#2BA84A] text-white font-semibold'
                      : available
                        ? 'text-[#86EFAC] bg-[#2BA84A]/10 hover:bg-[#2BA84A]/18 font-medium'
                        : 'text-[#F4F7F5] hover:bg-[#18221E]'
                  }
                `}
              >
                <span className={booked ? 'line-through opacity-50' : ''}>{t}</span>
                {booked && (
                  <span className="text-[9px] text-[#FCA5A5]/60 truncate max-w-[80px]">
                    {bookedBy || 'Upptat'}
                  </span>
                )}
                {!booked && available && !selected && (
                  <span className="text-[9px] text-[#2BA84A]/60">●</span>
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function DateTimePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
  minDate,
  maxDate,
  minTime = "07:00",
  maxTime = "23:00",
  disabled = false,
  bookedSlots = [],
  availableSlots = [],
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <DatePicker
        value={date}
        onChange={onDateChange}
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        placeholder="Välj datum"
      />
      <TimePicker
        value={time}
        onChange={onTimeChange}
        minTime={minTime}
        maxTime={maxTime}
        disabled={disabled || !date}
        placeholder="Välj tid"
        bookedSlots={bookedSlots}
        availableSlots={availableSlots}
      />
    </div>
  );
}
