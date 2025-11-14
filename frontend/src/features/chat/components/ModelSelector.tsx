import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Box,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { Zap, Sparkles, Brain } from 'lucide-react';

export interface AIModel {
  id: string;
  name: string;
  description: string;
  tier: 'free' | 'plus' | 'pro';
  tokensPerMinute: number;
}

const models: AIModel[] = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast and efficient',
    tier: 'free',
    tokensPerMinute: 10000,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Balanced performance',
    tier: 'plus',
    tokensPerMinute: 40000,
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Most capable',
    tier: 'pro',
    tokensPerMinute: 100000,
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    description: 'Google AI - Fast',
    tier: 'free',
    tokensPerMinute: 15000,
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'Google AI - Advanced',
    tier: 'plus',
    tokensPerMinute: 50000,
  },
];

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  userTier?: 'free' | 'plus' | 'pro';
}

const tierIcons = {
  free: Zap,
  plus: Sparkles,
  pro: Brain,
};

const tierColors = {
  free: 'default',
  plus: 'primary',
  pro: 'secondary',
} as const;

export function ModelSelector({
  value,
  onChange,
  userTier = 'free',
}: ModelSelectorProps) {
  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value);
  };

  const availableModels = models.filter((model) => {
    if (userTier === 'pro') return true;
    if (userTier === 'plus') return model.tier !== 'pro';
    return model.tier === 'free';
  });

  return (
    <FormControl fullWidth size="small">
      <InputLabel id="model-select-label">AI Model</InputLabel>
      <Select
        value={value}
        label="AI Model"
        labelId="model-select-label"
        onChange={handleChange}
        inputProps={{
          'aria-label': 'Select AI model',
          'aria-describedby': 'model-select-description',
        }}
        renderValue={(selected) => {
          const model = models.find((m) => m.id === selected);
          if (!model) return selected;

          const Icon = tierIcons[model.tier];
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Icon size={16} aria-hidden="true" />
              {model.name}
            </Box>
          );
        }}
      >
        {availableModels.map((model) => {
          const Icon = tierIcons[model.tier];
          return (
            <MenuItem
              key={model.id}
              value={model.id}
              aria-label={`${model.name}: ${model.description}, ${model.tier} tier`}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Icon size={16} aria-hidden="true" />
                  <Box>
                    <Box sx={{ fontWeight: 500 }}>{model.name}</Box>
                    <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                      {model.description}
                    </Box>
                  </Box>
                </Box>
                <Chip
                  label={model.tier.toUpperCase()}
                  size="small"
                  color={tierColors[model.tier]}
                  sx={{ height: 20, fontSize: '0.625rem' }}
                />
              </Box>
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
}
