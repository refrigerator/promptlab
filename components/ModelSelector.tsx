'use client';

import * as React from 'react';
import { LLMModel } from '@/lib/types';
import { Check, ChevronsUpDown, Zap } from 'lucide-react';
import { Lightning as PhosphorLightning, Brain, Sparkle, Cpu, Robot, GoogleLogo, MicrosoftTeamsLogo, AmazonLogo, TwitterLogo } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ModelSelectorProps {
  models: LLMModel[];
  selectedModels: LLMModel[];
  onAddModel: (model: LLMModel) => void;
}

// Extract provider from model name
const getProviderFromName = (name: string): string => {
  // Common provider patterns
  const providerPatterns = [
    { pattern: /^(OpenAI|GPT)/i, provider: 'OpenAI' },
    { pattern: /^(Anthropic|Claude)/i, provider: 'Anthropic' },
    { pattern: /^(Google|Gemini)/i, provider: 'Google' },
    { pattern: /^(Meta|LLaMA)/i, provider: 'Meta' },
    { pattern: /^(AI21|Jamba)/i, provider: 'AI21' },
    { pattern: /^(Cohere|Command)/i, provider: 'Cohere' },
    { pattern: /^(Mistral)/i, provider: 'Mistral' },
    { pattern: /^(DeepSeek)/i, provider: 'DeepSeek' },
    { pattern: /^(Qwen)/i, provider: 'Qwen' },
    { pattern: /^(Agentica)/i, provider: 'Agentica' },
    { pattern: /^(AionLabs)/i, provider: 'AionLabs' },
    { pattern: /^(AlfredPros)/i, provider: 'AlfredPros' },
    { pattern: /^(AllenAI|Olmo|Molmo)/i, provider: 'AllenAI' },
    { pattern: /^(Microsoft)/i, provider: 'Microsoft' },
    { pattern: /^(Amazon|Titan)/i, provider: 'Amazon' },
    { pattern: /^(Hugging Face|HF)/i, provider: 'Hugging Face' },
    { pattern: /^(Stability|Stable)/i, provider: 'Stability AI' },
    { pattern: /^(EleutherAI|GPT-J|GPT-NeoX)/i, provider: 'EleutherAI' },
    { pattern: /^(BigScience|BLOOM)/i, provider: 'BigScience' },
    { pattern: /^(Together|RedPajama)/i, provider: 'Together AI' },
    { pattern: /^(X|Twitter|Grok)/i, provider: 'X' },
  ];
  
  for (const { pattern, provider } of providerPatterns) {
    if (pattern.test(name)) {
      return provider;
    }
  }
  
  // Fallback: try to extract from colon-separated format
  const parts = name.split(':');
  if (parts.length > 1) {
    return parts[0].trim();
  }
  
  return 'Other';
};

// Get provider icon
const getProviderIcon = (provider: string) => {
  const lowerProvider = provider.toLowerCase();
  if (lowerProvider.includes('openai') || lowerProvider.includes('gpt')) return <PhosphorLightning className="w-4 h-4" />;
  if (lowerProvider.includes('anthropic') || lowerProvider.includes('claude')) return <Brain className="w-4 h-4" />;
  if (lowerProvider.includes('google') || lowerProvider.includes('gemini')) return <GoogleLogo className="w-4 h-4" />;
  if (lowerProvider.includes('meta') || lowerProvider.includes('llama')) return <Cpu className="w-4 h-4" />;
  if (lowerProvider.includes('ai21') || lowerProvider.includes('jamba')) return <Robot className="w-4 h-4" />;
  if (lowerProvider.includes('cohere')) return <PhosphorLightning className="w-4 h-4" />;
  if (lowerProvider.includes('mistral')) return <Sparkle className="w-4 h-4" />;
  if (lowerProvider.includes('deepseek')) return <Cpu className="w-4 h-4" />;
  if (lowerProvider.includes('qwen')) return <Robot className="w-4 h-4" />;
  if (lowerProvider.includes('agentica')) return <Brain className="w-4 h-4" />;
  if (lowerProvider.includes('aionlabs')) return <PhosphorLightning className="w-4 h-4" />;
  if (lowerProvider.includes('microsoft')) return <MicrosoftTeamsLogo className="w-4 h-4" />;
  if (lowerProvider.includes('amazon') || lowerProvider.includes('titan')) return <AmazonLogo className="w-4 h-4" />;
  if (lowerProvider.includes('hugging face') || lowerProvider.includes('hf')) return <Robot className="w-4 h-4" />;
  if (lowerProvider.includes('alfredpros')) return <Cpu className="w-4 h-4" />;
  if (lowerProvider.includes('allenai') || lowerProvider.includes('olmo') || lowerProvider.includes('molmo')) return <Brain className="w-4 h-4" />;
  if (lowerProvider.includes('stability') || lowerProvider.includes('stable')) return <Sparkle className="w-4 h-4" />;
  if (lowerProvider.includes('eleutherai') || lowerProvider.includes('gpt-j') || lowerProvider.includes('gpt-neox')) return <PhosphorLightning className="w-4 h-4" />;
  if (lowerProvider.includes('bigscience') || lowerProvider.includes('bloom')) return <Robot className="w-4 h-4" />;
  if (lowerProvider.includes('together') || lowerProvider.includes('redpajama')) return <Cpu className="w-4 h-4" />;
  if (lowerProvider.includes('x') || lowerProvider.includes('twitter') || lowerProvider.includes('grok')) return <TwitterLogo className="w-4 h-4" />;
  return <PhosphorLightning className="w-4 h-4" />;
};

// Group models by provider
const groupModelsByProvider = (models: LLMModel[]) => {
  const groups = new Map<string, LLMModel[]>();
  
  models.forEach(model => {
    const provider = getProviderFromName(model.name);
    if (!groups.has(provider)) {
      groups.set(provider, []);
    }
    groups.get(provider)!.push(model);
  });
  
  // Priority providers that should appear at the top
  const priorityProviders = ['OpenAI', 'Anthropic', 'Google', 'X'];
  
  const entries = Array.from(groups.entries());
  const priorityEntries = entries.filter(([provider]) => 
    priorityProviders.includes(provider)
  ).sort(([a], [b]) => {
    const aIndex = priorityProviders.indexOf(a);
    const bIndex = priorityProviders.indexOf(b);
    return aIndex - bIndex;
  });
  
  const otherEntries = entries.filter(([provider]) => 
    !priorityProviders.includes(provider)
  ).sort(([a], [b]) => a.localeCompare(b));
  
  return [...priorityEntries, ...otherEntries];
};

export default function ModelSelector({ models, selectedModels, onAddModel }: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false);
  
  const selectedModelIds = new Set(selectedModels.map(m => m.id));
  const availableModels = models.filter(model => !selectedModelIds.has(model.id));
  const groupedModels = groupModelsByProvider(availableModels);
  
  const handleModelSelect = (model: LLMModel) => {
    onAddModel(model);
    setOpen(false);
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>Add Model</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search models..." className="h-9" />
          <CommandList>
            <CommandEmpty>No models found.</CommandEmpty>
            {groupedModels.map(([provider, providerModels]) => (
              <CommandGroup key={provider} heading={provider}>
                {providerModels.map((model) => (
                  <CommandItem
                    key={model.id}
                    value={model.name}
                    onSelect={() => handleModelSelect(model)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getProviderIcon(provider)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{model.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {model.context_length ? `${model.context_length.toLocaleString()} context` : 'Unknown context'}
                        </div>
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedModelIds.has(model.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
