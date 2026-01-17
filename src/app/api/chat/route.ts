import { NextRequest, NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';
import { AVAILABLE_MODELS, APIKeys } from '@/types';

function getProvider(modelId: string, apiKeys: APIKeys) {
  const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
  
  // Handle case where model might be custom or from history but not in current list
  // Default to OpenAI if not found (fallback)
  if (!model) {
     // Check if it looks like a provider specific ID
     if (modelId.startsWith('gpt')) return createOpenAI({ apiKey: apiKeys.openai })(modelId);
     if (modelId.startsWith('claude')) return createAnthropic({ apiKey: apiKeys.anthropic })(modelId);
     if (modelId.startsWith('gemini')) return createGoogleGenerativeAI({ apiKey: apiKeys.google })(modelId);
     throw new Error(`Unknown model: ${modelId}`);
  }

  switch (model.provider) {
    case 'openai': {
      if (!apiKeys.openai) throw new Error('OpenAI API key not configured');
      const openai = createOpenAI({ apiKey: apiKeys.openai });
      return openai(modelId);
    }
    case 'anthropic': {
      if (!apiKeys.anthropic) throw new Error('Anthropic API key not configured');
      const anthropic = createAnthropic({ apiKey: apiKeys.anthropic });
      return anthropic(modelId);
    }
    case 'google': {
      if (!apiKeys.google) throw new Error('Google AI API key not configured');
      const google = createGoogleGenerativeAI({ apiKey: apiKeys.google });
      return google(modelId);
    }
    case 'mistral': {
      if (!apiKeys.mistral) throw new Error('Mistral API key not configured');
      const mistral = createMistral({ apiKey: apiKeys.mistral });
      return mistral(modelId);
    }
    case 'cerebras': {
      if (!apiKeys.cerebras) throw new Error('Cerebras API key not configured');
      const cerebras = createOpenAI({ 
        baseURL: 'https://api.cerebras.ai/v1',
        apiKey: apiKeys.cerebras 
      });
      return cerebras(modelId);
    }
    case 'groq': {
      if (!apiKeys.groq) throw new Error('Groq API key not configured');
      const groq = createOpenAI({ 
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: apiKeys.groq 
      });
      return groq(modelId);
    }
    case 'openrouter': {
      if (!apiKeys.openrouter) throw new Error('OpenRouter API key not configured');
      const openrouter = createOpenAI({ 
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: apiKeys.openrouter 
      });
      // OpenRouter models usually have a prefix like "anthropic/claude-3-opus", use the ID directly
      return openrouter(modelId);
    }
    case 'ollama': {
      // For Ollama we use the OpenAI compatible endpoint
      // Default url is localhost:11434/v1
      const baseURL = apiKeys.ollama || 'http://localhost:11434/v1';
      const ollama = createOpenAI({ 
        baseURL,
        apiKey: 'ollama' // Ollama doesn't typically require a key
      });
      return ollama(modelId);
    }
    default:
      throw new Error(`Unknown provider for model: ${modelId}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { messages, model: modelId, apiKeys } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    if (!modelId) {
      return NextResponse.json({ error: 'Model is required' }, { status: 400 });
    }

    const provider = getProvider(modelId, apiKeys || {});

    // Filter out image content for models that don't support vision
    const visionSupportedModels = [
      'gpt-4o', 'gpt-4o-mini',
      'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229',
      'gemini-2.0-flash', 'gemini-1.5-pro'
    ];

    const supportsVision = visionSupportedModels.includes(modelId) || 
                         modelId.startsWith('claude-3') || 
                         modelId.startsWith('gemini-1.5') || 
                         modelId.startsWith('gemini-2.0');

    const filteredMessages = messages.map(msg => {
      if (typeof msg.content === 'string') {
        return msg;
      }
      
      // Handle array content (text + images)
      if (Array.isArray(msg.content)) {
        if (supportsVision) {
          return msg;
        } else {
          // Only keep text content for non-vision models
          const textContent = msg.content.filter(item => item.type === 'text')
                                         .map(item => item.text)
                                         .join('\n');
          return { ...msg, content: textContent };
        }
      }
      
      return msg;
    });

    const result = await generateText({
      model: provider,
      messages: filteredMessages,
    });

    return NextResponse.json({ content: result.text });
  } catch (error) {
    console.error('Chat API error:', error);
    const message = error instanceof Error ? error.message : 'An error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
