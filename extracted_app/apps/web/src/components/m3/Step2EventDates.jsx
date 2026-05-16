import React, { useState, useEffect } from 'react';
import AppButton from '@/components/m3/AppButton';
import { Trash2, Plus, Calendar } from 'lucide-react';
import { getNextDate, calculateEventDayName } from '@/lib/quotationUtils';

const Step2EventDates = ({ data, updateData, onNext, onBack }) => {
  const [newDate, setNewDate] = useState('');
  const [newEventName, setNewEventName] = useState('');
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (!data.eventDays || data.eventDays.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      updateData({
        eventDays: [{ name: 'Day 01', date: today }]
      });
    }
  }, []);

  const handleAddDate = () => {
    let dateToAdd = newDate;
    if (!dateToAdd) {
      const lastDate = data.eventDays.length > 0 ? data.eventDays[data.eventDays.length - 1].date : null;
      dateToAdd = getNextDate(lastDate);
    }

    const nameToAdd = newEventName.trim() || calculateEventDayName(data.eventDays.length);

    const newEventDays = [
      ...data.eventDays,
      { name: nameToAdd, date: dateToAdd }
    ];
    
    updateData({ eventDays: newEventDays });
    setNewDate('');
    setNewEventName('');
    setShowError(false);
  };

  const handleRemoveDate = (index) => {
    const newEventDays = data.eventDays.filter((_, i) => i !== index);
    updateData({ eventDays: newEventDays });
  };

  const handleUpdateDayName = (index, newName) => {
    const newEventDays = [...data.eventDays];
    newEventDays[index].name = newName;
    updateData({ eventDays: newEventDays });
  };

  const handleUpdateDayDate = (index, newDateVal) => {
    const newEventDays = [...data.eventDays];
    newEventDays[index].date = newDateVal;
    updateData({ eventDays: newEventDays });
  };

  const handleNext = () => {
    if (!data.eventDays || data.eventDays.length === 0) {
      setShowError(true);
      return;
    }
    
    // Validate that all added dates have a name and date
    const hasInvalidDates = data.eventDays.some(day => !day.name.trim() || !day.date);
    if (hasInvalidDates) {
      setShowError(true);
      return;
    }

    onNext();
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="mb-2">
        <h3 className="text-xl font-extrabold text-foreground tracking-tight">Step 2: Event Dates</h3>
        <p className="text-sm text-muted-foreground mt-1">Add all the dates and functions for this event.</p>
      </div>
      
      <div className={`space-y-4 p-4 rounded-2xl border ${showError ? 'border-destructive bg-destructive/5' : 'border-border bg-muted/10'}`}>
        {data.eventDays?.map((day, index) => (
          <div key={index} className="flex flex-col gap-3 bg-background p-4 rounded-xl border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <input
                value={day.name}
                onChange={(e) => handleUpdateDayName(index, e.target.value)}
                className="flex-1 text-base font-bold text-foreground outline-none bg-transparent border-b border-transparent focus:border-primary pb-1 placeholder:text-muted-foreground/50 transition-colors"
                placeholder="Event Name (e.g. Haldi)"
              />
              <button 
                onClick={() => handleRemoveDate(index)} 
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors ml-3 shrink-0"
                title="Remove Date"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="date"
                value={day.date}
                onChange={(e) => handleUpdateDayDate(index, e.target.value)}
                className="w-full h-11 border border-input rounded-lg pl-10 pr-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-background"
              />
            </div>
          </div>
        ))}
        
        {showError && (!data.eventDays || data.eventDays.length === 0) && (
          <p className="text-sm text-destructive font-medium px-2">Please add at least one event date to proceed.</p>
        )}
        {showError && data.eventDays?.some(day => !day.name.trim() || !day.date) && (
          <p className="text-sm text-destructive font-medium px-2">Please ensure all event dates have a name and a valid date.</p>
        )}
      </div>

      <div className="mt-2 p-5 bg-muted/30 rounded-2xl border border-border space-y-4">
        <h4 className="text-sm font-bold text-foreground mb-2">Add Another Date</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Event Name</label>
            <input
              type="text"
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
              placeholder="e.g. Reception"
              className="w-full h-11 border border-input rounded-xl px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-background shadow-sm transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Event Date</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="flex-1 h-11 border border-input rounded-xl px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-background shadow-sm transition-colors"
              />
              <AppButton 
                variant="filled" 
                onClick={handleAddDate}
                className="rounded-xl px-4 h-11 shadow-sm"
              >
                <Plus className="w-4 h-4" />
              </AppButton>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mt-6 pt-6 border-t border-border">
        <AppButton variant="tonal" className="w-full md:w-1/3 h-12 text-sm font-bold rounded-xl" onClick={onBack}>
          Back
        </AppButton>
        <AppButton variant="filled" className="w-full md:w-2/3 h-12 text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all" onClick={handleNext}>
          Next Step
        </AppButton>
      </div>
    </div>
  );
};

export default Step2EventDates;