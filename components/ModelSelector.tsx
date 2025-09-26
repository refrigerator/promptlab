'use client';

import { useState, useRef, useEffect } from 'react';
import { LLMModel } from '@/lib/types';
import { ChevronDown, Search } from 'lucide-react';
import { Lightning, Brain, Sparkle, Cpu, Robot, GoogleLogo, MicrosoftTeamsLogo, AmazonLogo, TwitterLogo } from '@phosphor-icons/react';

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
  if (lowerProvider.includes('openai') || lowerProvider.includes('gpt')) return <Lightning className="w-4 h-4" />;
  if (lowerProvider.includes('anthropic') || lowerProvider.includes('claude')) return <Brain className="w-4 h-4" />;
  if (lowerProvider.includes('google') || lowerProvider.includes('gemini')) return <GoogleLogo className="w-4 h-4" />;
  if (lowerProvider.includes('meta') || lowerProvider.includes('llama')) return <Cpu className="w-4 h-4" />;
  if (lowerProvider.includes('ai21') || lowerProvider.includes('jamba')) return <Robot className="w-4 h-4" />;
  if (lowerProvider.includes('cohere')) return <Lightning className="w-4 h-4" />;
  if (lowerProvider.includes('mistral')) return <Sparkle className="w-4 h-4" />;
  if (lowerProvider.includes('deepseek')) return <Cpu className="w-4 h-4" />;
  if (lowerProvider.includes('qwen')) return <Robot className="w-4 h-4" />;
  if (lowerProvider.includes('agentica')) return <Brain className="w-4 h-4" />;
  if (lowerProvider.includes('aionlabs')) return <Lightning className="w-4 h-4" />;
  if (lowerProvider.includes('microsoft')) return <MicrosoftTeamsLogo className="w-4 h-4" />;
  if (lowerProvider.includes('amazon') || lowerProvider.includes('titan')) return <AmazonLogo className="w-4 h-4" />;
  if (lowerProvider.includes('hugging face') || lowerProvider.includes('hf')) return <Robot className="w-4 h-4" />;
  if (lowerProvider.includes('alfredpros')) return <Cpu className="w-4 h-4" />;
  if (lowerProvider.includes('allenai') || lowerProvider.includes('olmo') || lowerProvider.includes('molmo')) return <Brain className="w-4 h-4" />;
  if (lowerProvider.includes('stability') || lowerProvider.includes('stable')) return <Sparkle className="w-4 h-4" />;
  if (lowerProvider.includes('eleutherai') || lowerProvider.includes('gpt-j') || lowerProvider.includes('gpt-neox')) return <Lightning className="w-4 h-4" />;
  if (lowerProvider.includes('bigscience') || lowerProvider.includes('bloom')) return <Robot className="w-4 h-4" />;
  if (lowerProvider.includes('together') || lowerProvider.includes('redpajama')) return <Cpu className="w-4 h-4" />;
  if (lowerProvider.includes('x') || lowerProvider.includes('twitter') || lowerProvider.includes('grok')) return <TwitterLogo className="w-4 h-4" />;
  return <Lightning className="w-4 h-4" />;
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
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedModelIds = new Set(selectedModels.map(m => m.id));
  const availableModels = models.filter(model => !selectedModelIds.has(model.id));
  const groupedModels = groupModelsByProvider(availableModels);
  
  const filteredGroups = groupedModels.map(([provider, providerModels]) => [
    provider,
    providerModels.filter(model => 
      model.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ]).filter(([, models]) => models.length > 0);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleModelSelect = (model: LLMModel) => {
    onAddModel(model);
    setIsOpen(false);
    setSearchTerm('');
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-input rounded bg-background hover:bg-accent transition-colors"
      >
        <Lightning className="w-4 h-4" />
        <span>Add Model</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-80 overflow-hidden w-96">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search models..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-input rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>
          </div>
          
          <div className="overflow-y-auto max-h-64">
            {filteredGroups.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                {searchTerm ? 'No models found' : 'No models available'}
              </div>
            ) : (
              filteredGroups.map(([provider, providerModels]) => (
                <div key={provider} className="border-b border-border last:border-b-0">
                  <div className="px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground flex items-center gap-2">
                    {getProviderIcon(provider)}
                    {provider} ({providerModels.length})
                  </div>
                  {providerModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleModelSelect(model)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{model.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {model.context_length ? `${model.context_length.toLocaleString()} context` : 'Unknown context'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
