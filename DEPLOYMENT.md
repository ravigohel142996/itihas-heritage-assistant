# Deployment Guide for Itihas Heritage Assistant (OpenAI GPT-5)

## Overview
This guide covers deploying the Itihas Heritage Assistant application to Netlify with OpenAI GPT-5 integration.

## Prerequisites
- GitHub account
- Netlify account (free tier is sufficient)
- OpenAI API key with GPT-5 access

## Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/ravigohel142996/itihas-heritage-assistant.git
cd itihas-heritage-assistant
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Create a `.env` file in the root directory:
```bash
OPENAI_API_KEY=sk-proj-your-actual-api-key-here
```

**Important:** Never commit this file to Git. It's already in `.gitignore`.

### 4. Install Netlify CLI (for local testing)
```bash
npm install -g netlify-cli
```

### 5. Run Local Development Server
```bash
netlify dev
```

This will start:
- Frontend dev server (port 3000)
- Netlify functions proxy (port 8888)

Access the app at: `http://localhost:8888`

## Deployment to Netlify

### Option 1: Automatic Deployment via GitHub (Recommended)

#### Step 1: Push Code to GitHub
Ensure your code is pushed to your GitHub repository.

#### Step 2: Connect Repository to Netlify
1. Log in to [Netlify](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Choose "GitHub" as your Git provider
4. Select your repository: `ravigohel142996/itihas-heritage-assistant`
5. Configure build settings (should auto-detect from `netlify.toml`):
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`

#### Step 3: Configure Environment Variables
1. Go to "Site settings" → "Environment variables"
2. Click "Add a variable"
3. Add the following:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (starts with `sk-...`)
   - **Scopes**: Check "Same value for all deploy contexts"

#### Step 4: Deploy
1. Click "Deploy site"
2. Wait for the build to complete (usually 1-2 minutes)
3. Your site will be live at: `https://your-site-name.netlify.app`

### Option 2: Manual Deployment via Netlify CLI

#### Step 1: Login to Netlify
```bash
netlify login
```

#### Step 2: Initialize Site (first time only)
```bash
netlify init
```
Follow the prompts to create a new site or link to an existing one.

#### Step 3: Set Environment Variables
```bash
netlify env:set OPENAI_API_KEY "your-openai-api-key-here"
```

#### Step 4: Deploy
```bash
# Deploy to production
netlify deploy --prod

# Or deploy to preview first
netlify deploy
```

## Verifying Deployment

### 1. Check Build Logs
In Netlify dashboard:
1. Go to "Deploys"
2. Click on the latest deploy
3. Review the build logs for any errors

### 2. Test the Application
1. Visit your deployed site URL
2. Try searching for a heritage site (e.g., "Taj Mahal")
3. Check browser console for any errors
4. Verify that API calls are working

### 3. Test Serverless Function
Check if the OpenAI proxy is accessible:
```bash
curl -X POST https://your-site-name.netlify.app/.netlify/functions/openai-proxy \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

## Troubleshooting

### Build Fails
1. Check that all dependencies are installed
2. Verify `package.json` has correct versions
3. Review build logs in Netlify dashboard

### API Key Not Working
1. Verify environment variable is set correctly in Netlify
2. Check that variable name is exactly `OPENAI_API_KEY`
3. Ensure API key has GPT-5 access enabled

### 429 Rate Limit Errors
- Check your OpenAI account usage limits
- Consider implementing request caching
- Upgrade your OpenAI plan if needed

### Function Timeout
- Netlify free tier has 10-second timeout for functions
- Consider upgrading to Pro for 26-second timeout
- Optimize API calls to reduce response time

### CORS Errors
- Should not occur since functions run on same domain
- If issues persist, check browser console for details

## Post-Deployment Configuration

### Custom Domain (Optional)
1. Go to "Site settings" → "Domain management"
2. Click "Add custom domain"
3. Follow instructions to configure DNS

### Configure Redirects (Already in netlify.toml)
The app uses:
```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

### Enable Continuous Deployment
Automatic deployments are enabled by default when connected via GitHub. Any push to the main branch will trigger a new deployment.

## Monitoring and Analytics

### Netlify Analytics
- Enable in Site settings → Analytics
- Track page views, top pages, and sources

### Function Logs
1. Go to "Functions" tab in Netlify
2. Click on `openai-proxy`
3. View real-time logs and invocations

### OpenAI Usage
Monitor your OpenAI usage at:
https://platform.openai.com/usage

## Security Best Practices

1. **Never expose API keys in frontend code** ✓ (Already implemented)
2. **Use environment variables** ✓ (Already configured)
3. **Implement rate limiting** (Consider adding this)
4. **Monitor usage regularly** (Set up alerts in OpenAI dashboard)
5. **Rotate API keys periodically**

## Cost Considerations

### Netlify (Free Tier)
- 100 GB bandwidth/month
- 300 build minutes/month
- 125,000 serverless function requests/month

### OpenAI GPT-5
- Pay-per-use pricing
- Monitor usage in OpenAI dashboard
- Set usage limits in OpenAI account settings

## Support

For issues or questions:
- GitHub Issues: https://github.com/ravigohel142996/itihas-heritage-assistant/issues
- OpenAI Documentation: https://platform.openai.com/docs
- Netlify Documentation: https://docs.netlify.com

## Appendix: Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `OPENAI_API_KEY` | Yes | OpenAI API key with GPT-5 access | `sk-proj-...` |

## Appendix: Netlify Configuration

The `netlify.toml` file contains:
```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[functions]
  node_bundler = "esbuild"
```

This configuration is automatically applied when deploying to Netlify.
