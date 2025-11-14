import { useState } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Stack,
  Popover,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Divider,
} from '@mui/material';
import { Search, X, Filter, Calendar } from 'lucide-react';

export interface MessageFilters {
  searchQuery: string;
  messageType: 'all' | 'user' | 'assistant';
  dateRange: 'all' | 'today' | 'week' | 'month';
}

interface MessageSearchProps {
  filters: MessageFilters;
  onFiltersChange: (filters: MessageFilters) => void;
  resultCount?: number;
}

export function MessageSearch({ filters, onFiltersChange, resultCount }: MessageSearchProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleFilterOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      searchQuery: event.target.value,
    });
  };

  const handleClearSearch = () => {
    onFiltersChange({
      ...filters,
      searchQuery: '',
    });
  };

  const handleMessageTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      messageType: event.target.value as MessageFilters['messageType'],
    });
  };

  const handleDateRangeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      dateRange: event.target.value as MessageFilters['dateRange'],
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      searchQuery: '',
      messageType: 'all',
      dateRange: 'all',
    });
    handleFilterClose();
  };

  const activeFilterCount = [
    filters.messageType !== 'all',
    filters.dateRange !== 'all',
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0 || filters.searchQuery !== '';

  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction="row" spacing={1} alignItems="center">
        {/* Search Input */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search messages..."
          value={filters.searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} />
              </InputAdornment>
            ),
            endAdornment: filters.searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearSearch} aria-label="Clear search">
                  <X size={16} />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.paper',
            },
          }}
        />

        {/* Filter Button */}
        <IconButton
          onClick={handleFilterOpen}
          color={activeFilterCount > 0 ? 'primary' : 'default'}
          aria-label="Open filters"
          sx={{
            position: 'relative',
            bgcolor: activeFilterCount > 0 ? 'primary.main' : 'background.paper',
            color: activeFilterCount > 0 ? 'primary.contrastText' : 'text.primary',
            '&:hover': {
              bgcolor: activeFilterCount > 0 ? 'primary.dark' : 'action.hover',
            },
          }}
        >
          <Filter size={18} />
          {activeFilterCount > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'error.main',
                border: 1,
                borderColor: 'background.paper',
              }}
            />
          )}
        </IconButton>

        {/* Filter Popover */}
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleFilterClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <Box sx={{ p: 3, minWidth: 300 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ fontWeight: 600, fontSize: '1rem' }}>Filters</Box>
              <IconButton size="small" onClick={handleFilterClose} aria-label="Close filters">
                <X size={16} />
              </IconButton>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Message Type Filter */}
            <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
              <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 600 }}>
                Message Type
              </FormLabel>
              <RadioGroup value={filters.messageType} onChange={handleMessageTypeChange}>
                <FormControlLabel value="all" control={<Radio size="small" />} label="All Messages" />
                <FormControlLabel value="user" control={<Radio size="small" />} label="My Messages" />
                <FormControlLabel value="assistant" control={<Radio size="small" />} label="AI Responses" />
              </RadioGroup>
            </FormControl>

            {/* Date Range Filter */}
            <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
              <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 600 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Calendar size={14} />
                  Date Range
                </Box>
              </FormLabel>
              <RadioGroup value={filters.dateRange} onChange={handleDateRangeChange}>
                <FormControlLabel value="all" control={<Radio size="small" />} label="All Time" />
                <FormControlLabel value="today" control={<Radio size="small" />} label="Today" />
                <FormControlLabel value="week" control={<Radio size="small" />} label="This Week" />
                <FormControlLabel value="month" control={<Radio size="small" />} label="This Month" />
              </RadioGroup>
            </FormControl>

            <Divider sx={{ my: 2 }} />

            {/* Clear Filters Button */}
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
            >
              Clear All Filters
            </Button>
          </Box>
        </Popover>
      </Stack>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
          {filters.searchQuery && (
            <Chip
              size="small"
              label={`Search: "${filters.searchQuery}"`}
              onDelete={handleClearSearch}
              color="primary"
              variant="outlined"
            />
          )}
          {filters.messageType !== 'all' && (
            <Chip
              size="small"
              label={`Type: ${filters.messageType === 'user' ? 'My Messages' : 'AI Responses'}`}
              onDelete={() => onFiltersChange({ ...filters, messageType: 'all' })}
              color="primary"
              variant="outlined"
            />
          )}
          {filters.dateRange !== 'all' && (
            <Chip
              size="small"
              label={`Date: ${filters.dateRange.charAt(0).toUpperCase() + filters.dateRange.slice(1)}`}
              onDelete={() => onFiltersChange({ ...filters, dateRange: 'all' })}
              color="primary"
              variant="outlined"
            />
          )}
          {resultCount !== undefined && (
            <Chip
              size="small"
              label={`${resultCount} result${resultCount !== 1 ? 's' : ''}`}
              color="default"
              variant="filled"
            />
          )}
        </Stack>
      )}
    </Box>
  );
}
