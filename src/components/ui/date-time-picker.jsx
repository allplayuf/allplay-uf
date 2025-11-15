import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DatePicker({ value, onChange, minDate, maxDate, disabled = false, placeholder = "Välj datum" }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedDate = value ? new Date(value) : undefined;

  const handleSelect = (date) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'));
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={`w-full h-11 sm:h-12 justify-start text-left font-normal bg-[#18221E] border border-[#223029] text-[#F4F7F5] hover:bg-[#223029] hover:text-[#F4F7F5] rounded-[14px] ${
            !value && "text-[#7B8A83]"
          }`}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-[#2BA84A]" />
          {value ? (
            format(new Date(value), 'PPP', { locale: sv })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-[#121715] border border-[#223029] rounded-[16px] calendar-white-text" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={(date) => {
            if (minDate && date < new Date(minDate)) return true;
            if (maxDate && date > new Date(maxDate)) return true;
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

export function TimePicker({ value, onChange, disabled = false, placeholder = "Välj tid", minTime = "07:00", maxTime = "23:00" }) {
  const [isOpen, setIsOpen] = useState(false);

  // Generate time options (every 15 minutes) between 07:00 and 23:00
  const timeOptions = [];
  for (let hour = 7; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // Check if time is within allowed range
      if (minTime && timeString < minTime) continue;
      if (maxTime && timeString > maxTime) continue;
      
      timeOptions.push(timeString);
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={`w-full h-11 sm:h-12 justify-start text-left font-normal bg-[#18221E] border border-[#223029] text-[#F4F7F5] hover:bg-[#223029] hover:text-[#F4F7F5] rounded-[14px] ${
            !value && "text-[#7B8A83]"
          }`}
        >
          <Clock className="mr-2 h-4 w-4 text-[#2BA84A]" />
          {value || <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 bg-[#121715] border border-[#223029] rounded-[16px]" align="start">
        <div className="max-h-[300px] overflow-y-auto p-1">
          {timeOptions.map((time) => (
            <button
              key={time}
              onClick={() => {
                onChange(time);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                value === time
                  ? 'bg-[#2BA84A]/20 text-[#2BA84A] font-semibold'
                  : 'text-[#F4F7F5] hover:bg-[#18221E]'
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function DateTimePicker({ date, time, onDateChange, onTimeChange, minDate, maxDate, minTime = "07:00", maxTime = "23:00", disabled = false }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <DatePicker
            value={date}
            onChange={onDateChange}
            minDate={minDate}
            maxDate={maxDate}
            disabled={disabled}
            placeholder="Välj datum"
          />
        </div>
        <div className="space-y-2">
          <TimePicker
            value={time}
            onChange={onTimeChange}
            minTime={minTime}
            maxTime={maxTime}
            disabled={disabled}
            placeholder="Välj tid"
          />
        </div>
      </div>

      {/* Calendar white text styling */}
      <style jsx global>{`
        .calendar-white-text .rdp {
          --rdp-cell-size: 40px;
          --rdp-accent-color: #2BA84A;
          --rdp-background-color: rgba(43, 168, 74, 0.1);
        }

        .calendar-white-text .rdp-months {
          display: flex;
          justify-content: center;
        }

        .calendar-white-text .rdp-month {
          margin: 1rem;
        }

        .calendar-white-text .rdp-caption {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0.5rem 0;
          margin-bottom: 0.5rem;
        }

        .calendar-white-text .rdp-caption_label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #F4F7F5;
        }

        .calendar-white-text .rdp-nav {
          display: flex;
          gap: 0.5rem;
        }

        .calendar-white-text .rdp-nav_button {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          color: #F4F7F5;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .calendar-white-text .rdp-nav_button:hover {
          background: rgba(43, 168, 74, 0.1);
          color: #2BA84A;
        }

        .calendar-white-text .rdp-head_cell {
          font-size: 0.75rem;
          font-weight: 600;
          text-align: center;
          padding: 0.5rem 0;
          color: #F4F7F5;
          text-transform: uppercase;
        }

        .calendar-white-text .rdp-cell {
          text-align: center;
          padding: 0;
        }

        .calendar-white-text .rdp-day {
          width: var(--rdp-cell-size);
          height: var(--rdp-cell-size);
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #F4F7F5;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .calendar-white-text .rdp-day:hover:not(.rdp-day_selected):not(.rdp-day_disabled) {
          background: rgba(43, 168, 74, 0.1);
          color: #2BA84A;
        }

        .calendar-white-text .rdp-day_selected {
          background: #2BA84A !important;
          color: #FFFFFF !important;
          font-weight: 600;
        }

        .calendar-white-text .rdp-day_today:not(.rdp-day_selected) {
          background: rgba(43, 168, 74, 0.15);
          color: #2BA84A;
          font-weight: 600;
        }

        .calendar-white-text .rdp-day_disabled {
          color: #4B5563;
          cursor: not-allowed;
          opacity: 0.4;
        }

        .calendar-white-text .rdp-day_outside {
          color: #6B7280;
          opacity: 0.5;
        }
      `}</style>
    </>
  );
}