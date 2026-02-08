# Migration Guide: Gemini API → OpenAI GPT-5

## Overview
This document explains the changes made to migrate from Google Gemini API to OpenAI GPT-5.

## What Changed

### 1. API Provider
- **Before**: Google Gemini API (`@google/genai`)
- **After**: OpenAI GPT-5 API (via Netlify serverless functions)

### 2. Architecture
- **Before**: Direct API calls from frontend with embedded API key
- **After**: Backend proxy pattern with serverless functions

### 3. Environment Variables
- **Before**: `GEMINI_API_KEY` in `.env.local`, exposed to frontend via Vite
- **After**: `OPENAI_API_KEY` in `.env`, used only in backend functions

### 4. API Model
- **Before**: `gemini-3-flash-preview`, `gemini-2.5-flash-image`, `gemini-3-pro-image-preview`
- **After**: `gpt-5` (OpenAI Chat Completions API)

## File Changes

### New Files
```
netlify/functions/openai-proxy.ts    # Backend proxy for OpenAI API
services/openaiService.ts            # New service layer
netlify.toml                         # Netlify deployment config
.env.example                         # Environment variable template
DEPLOYMENT.md                        # Deployment documentation
MIGRATION.md                         # This file
```

### Modified Files
```
package.json                         # Updated dependencies
App.tsx                             # Updated import
components/PlaceDisplay.tsx         # Updated import
vite.config.ts                      # Removed API key exposure
README.md                           # Updated documentation
```

### Removed Files
```
services/geminiService.ts           # Old Gemini service (replaced)
```

## Dependency Changes

### Removed
```json
{
  "@google/genai": "^1.39.0"
}
```

### Added
```json
{
  "@netlify/functions": "^2.8.1"
}
```

## API Interface Compatibility

The public API interface remains the same, so existing frontend code requires minimal changes:

```typescript
// These functions work the same way:
fetchPlaceDetails(placeName: string, language: Language): Promise<HistoricPlaceData>
generatePlaceImage(placeName: string, description: string): Promise<string>
analyzeSpatialDepth(images: string[], language: Language): Promise<VisualAnalysisData>
translateSummary(summary: string): Promise<Record<string, string>>
```

## Migration Steps for Developers

### Step 1: Update Local Environment
```bash
# Pull latest changes
git pull origin main

# Remove old dependencies
npm install

# Create new .env file
cp .env.example .env

# Add your OpenAI API key to .env
echo "OPENAI_API_KEY=your-key-here" >> .env
```

### Step 2: Test Locally
```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Run with Netlify dev server (includes functions)
netlify dev

# Access at http://localhost:8888
```

### Step 3: Update Deployment
If you have an existing deployment:
1. Update environment variables in Netlify dashboard
2. Change `GEMINI_API_KEY` to `OPENAI_API_KEY`
3. Redeploy the site

## API Differences

### Request Format

#### Gemini (Before)
```typescript
ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: prompt,
  config: {
    responseMimeType: 'application/json',
    responseSchema: { /* schema */ }
  }
})
```

#### OpenAI (After)
```typescript
fetch('/.netlify/functions/openai-proxy', {
  method: 'POST',
  body: JSON.stringify({
    model: 'gpt-5',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    response_format: { type: 'json_object' }
  })
})
```

### Response Handling

#### Gemini (Before)
```typescript
const response = await ai.models.generateContent(...)
const text = response.text
const data = JSON.parse(text)
```

#### OpenAI (After)
```typescript
const response = await fetch(...)
const apiResponse = await response.json()
const text = apiResponse.choices[0].message.content
const data = JSON.parse(text)
```

## Security Improvements

### Before (Gemini)
- ❌ API key exposed in frontend bundle via Vite define
- ❌ API calls made directly from browser
- ❌ API key visible in browser DevTools

### After (OpenAI)
- ✅ API key stored only on server (Netlify Functions)
- ✅ All API calls proxied through backend
- ✅ API key never exposed to client

## Feature Changes

### Image Generation
**Status**: Requires additional implementation

The Gemini API had built-in image generation (`gemini-2.5-flash-image`). OpenAI uses DALL-E 3 which requires separate implementation:

```typescript
// TODO: Implement DALL-E 3 integration
export const generatePlaceImage = async (
  placeName: string,
  visualDescription: string
): Promise<string> => {
  // Currently throws error
  // Needs DALL-E 3 API call implementation
}
```

**Workaround Options**:
1. Implement DALL-E 3 API call
2. Use alternative image generation service
3. Use pre-generated images
4. Disable image generation feature

### Image Analysis (Vision API)
**Status**: Partially implemented

OpenAI GPT-5 supports vision capabilities, but the current implementation uses text-only analysis. To fully implement:

```typescript
// TODO: Add vision API support
const messages = [
  {
    role: 'user',
    content: [
      { type: 'text', text: prompt },
      { type: 'image_url', image_url: { url: base64Image } }
    ]
  }
]
```

## Cost Comparison

### Gemini API
- Free tier available
- Hit quota limits (reason for migration)

### OpenAI GPT-5
- Pay-per-use pricing
- No free tier
- More generous rate limits
- Monitor usage at: https://platform.openai.com/usage

## Performance Considerations

### Latency
- **Added**: ~50-100ms for serverless function cold start
- **Reduced**: Better API reliability (no quota issues)

### Caching
Consider implementing caching to reduce API costs:
```typescript
// Example: Cache responses in localStorage
const cacheKey = `place-${placeName}-${language}`
const cached = localStorage.getItem(cacheKey)
if (cached) return JSON.parse(cached)
```

## Testing

### Unit Tests
No unit tests were present in the original codebase. Consider adding:
```bash
npm install --save-dev vitest @testing-library/react
```

### Integration Tests
Test the serverless function:
```bash
curl -X POST http://localhost:8888/.netlify/functions/openai-proxy \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Test"}]}'
```

## Rollback Plan

If issues occur, rollback is possible:

### Step 1: Revert Code
```bash
git revert <commit-hash>
git push origin main
```

### Step 2: Restore Dependencies
```bash
npm install @google/genai@^1.39.0
npm uninstall @netlify/functions
```

### Step 3: Restore Environment Variables
Change `OPENAI_API_KEY` back to `GEMINI_API_KEY` in Netlify dashboard.

## Known Limitations

1. **Image Generation**: Not yet implemented for OpenAI
2. **Vision API**: Text-only analysis currently
3. **Cold Starts**: Serverless functions may have slight delay on first request
4. **Costs**: OpenAI is pay-per-use (no free tier)

## Future Improvements

1. Implement DALL-E 3 for image generation
2. Add full vision API support for image analysis
3. Implement response caching to reduce costs
4. Add request rate limiting on backend
5. Add usage analytics and monitoring
6. Implement retry logic for failed requests

## Support

For questions or issues:
- GitHub Issues: https://github.com/ravigohel142996/itihas-heritage-assistant/issues
- OpenAI Docs: https://platform.openai.com/docs
- Netlify Docs: https://docs.netlify.com/functions/overview/

## Changelog

### v2.0.0 (Current)
- ✅ Migrated from Gemini to OpenAI GPT-5
- ✅ Implemented backend proxy pattern
- ✅ Improved security (no exposed API keys)
- ✅ Added error handling for rate limits
- ✅ Updated documentation
- ⏳ Image generation pending (DALL-E 3)
- ⏳ Full vision API pending

### v1.0.0 (Previous)
- Used Google Gemini API
- Direct API calls from frontend
- Quota limit issues
