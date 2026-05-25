import React, { useState } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';

const LOCATIONS = ['All Locations', 'Bangalore', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Remote'];
const LEVELS = ['All Levels', 'SDE-I', 'SDE-II', 'SDE-III', 'L3', 'L4', 'L5', 'L6', 'L7', 'Staff', 'Senior Staff', 'Principal'];
const SOURCES = ['All Sources', 'AmbitionBox', 'Glassdoor', 'Manual', 'LinkedIn'];

function expRangeToValue(range) {
  // Map [min, max] years → [0..4] slider index
  const MIN = range[0], MAX = range[1];
  if (MIN === 0 && MAX >= 20) return [0, 20];
  return [MIN, Math.min(MAX, 20)];
}

export default function ExplorerFilters({ filters, onChange, searchQuery, onSearchChange }) {
  // experience slider: 0–20 years
  const [expRange, setExpRange] = useState([0, 20]);

  const hasActiveFilters = filters.location !== 'All Locations'
    || filters.level !== 'All Levels'
    || filters.source !== 'All Sources'
    || searchQuery
    || expRange[0] > 0
    || expRange[1] < 20;

  const clearAll = () => {
    onChange({ location: 'All Locations', experience: 'all', level: 'All Levels', source: 'All Sources' });
    onSearchChange('');
    setExpRange([0, 20]);
  };

  const handleExpChange = (val) => {
    setExpRange(val);
    const [min, max] = val;
    if (min === 0 && max === 20) {
      onChange({ ...filters, experience: 'all' });
    } else {
      onChange({ ...filters, experience: `${min}-${max}` });
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by role, company… (e.g. Data Scientist, Google)"
          className="pl-10 h-11 text-sm bg-background border-border focus:ring-2 focus:ring-primary/20 transition-shadow"
        />
        <AnimatePresence>
          {searchQuery && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-3 items-end">
        <Select value={filters.location} onValueChange={(v) => onChange({ ...filters, location: v })}>
          <SelectTrigger className="w-40 h-9 text-sm bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Experience Slider */}
        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" /> Experience
            </span>
            <span className="text-xs font-semibold text-primary">
              {expRange[0] === 0 && expRange[1] === 20 ? 'Any' : `${expRange[0]}–${expRange[1] === 20 ? '20+' : expRange[1]} yrs`}
            </span>
          </div>
          <Slider
            min={0}
            max={20}
            step={1}
            value={expRange}
            onValueChange={handleExpChange}
            className="w-full"
          />
        </div>

        <Select value={filters.level} onValueChange={(v) => onChange({ ...filters, level: v })}>
          <SelectTrigger className="w-36 h-9 text-sm bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.source} onValueChange={(v) => onChange({ ...filters, source: v })}>
          <SelectTrigger className="w-36 h-9 text-sm bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <AnimatePresence>
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
            >
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground h-9 gap-1.5 hover:text-foreground">
                <X className="w-3.5 h-3.5" /> Clear all
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
