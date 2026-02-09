# Deployment Guide - Itihas Heritage Assistant

This guide covers deploying the Itihas Heritage Assistant to production on Netlify with all backend functions working correctly.

## Prerequisites

Before deploying, ensure you have:

1. ✅ A [Netlify account](https://www.netlify.com/) (free tier works)
2. ✅ Your [Gemini API key](https://aistudio.google.com/app/apikey)
3. ✅ (Optional) [Unsplash API key](https://unsplash.com/developers) for better image quality
4. ✅ Git repository with your code

## Deployment Methods

### Method 1: Deploy via Netlify Dashboard (Recommended for First Time)

#### Step 1: Connect Repository

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Choose your Git provider (GitHub, GitLab, or Bitbucket)
4. Authorize Netlify to access your repositories
5. Select the `itihas-heritage-assistant` repository

#### Step 2: Configure Build Settings

Netlify should auto-detect the settings from `netlify.toml`, but verify:

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Functions directory**: `netlify/functions`

#### Step 3: Set Environment Variables

Before deploying, add your environment variables:

1. In your site dashboard, go to **Site settings** → **Environment variables**
2. Click **Add a variable**
3. Add the following variables:

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `GEMINI_API_KEY` | Your Gemini API key | **Required** |
| `UNSPLASH_ACCESS_KEY` | Your Unsplash key | Optional but recommended |

#### Step 4: Deploy

1. Click **Deploy site**
2. Wait for the build to complete (usually 1-2 minutes)
3. Your site will be live at `https://[random-name].netlify.app`

#### Step 5: Custom Domain (Optional)

1. Go to **Site settings** → **Domain management**
2. Click **Add custom domain**
3. Follow the instructions to configure your DNS

---

### Method 2: Deploy via Netlify CLI

#### Prerequisites

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login
```

#### Step 1: Initialize

```bash
cd itihas-heritage-assistant

# Initialize Netlify site
netlify init
```

Follow the prompts:
- **Create & configure a new site**: Yes
- **Team**: Select your team
- **Site name**: Choose a unique name (or leave blank for auto-generated)
- **Build command**: `npm run build` (should auto-detect)
- **Directory to deploy**: `dist`
- **Functions directory**: `netlify/functions`

#### Step 2: Set Environment Variables

```bash
# Set Gemini API key
netlify env:set GEMINI_API_KEY "your_actual_api_key_here"

# Set Unsplash key (optional)
netlify env:set UNSPLASH_ACCESS_KEY "your_unsplash_key_here"
```

#### Step 3: Deploy to Production

```bash
# Build locally first (optional but recommended)
npm run build

# Deploy to production
netlify deploy --prod
```

---

### Method 3: One-Click Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/ravigohel142996/itihas-heritage-assistant)

1. Click the button above
2. Connect your GitHub account
3. Netlify will fork the repository
4. Add environment variables when prompted
5. Click "Deploy site"

---

## Post-Deployment Checklist

After deployment, verify the following:

### ✅ Frontend Works
- [ ] Site loads at your Netlify URL
- [ ] Navigation menu works
- [ ] Language selector functions
- [ ] Voice search button appears

### ✅ Backend Functions Work
- [ ] Search for a heritage site (e.g., "Taj Mahal")
- [ ] Check if data loads (verify in browser console: no CORS errors)
- [ ] Check if images load
- [ ] Try uploading an image for analysis
- [ ] Verify rate limiting works (make >10 requests quickly)

### ✅ Environment Variables
```bash
# Check if variables are set correctly
netlify env:list
```

### ✅ Function Logs
To view function logs:
```bash
netlify functions:invoke fetchPlaceDetails --payload '{"placeName":"Taj Mahal","language":"English"}'
```

Or check logs in Netlify Dashboard:
**Functions** tab → Click on a function → **Logs**

---

## Troubleshooting

### Issue: Functions Return 404

**Cause**: Functions not deployed or wrong path

**Solution**:
1. Check `netlify.toml` has correct functions directory
2. Verify functions are in `netlify/functions/` directory
3. Rebuild and redeploy:
   ```bash
   netlify deploy --prod --force
   ```

### Issue: "API Key is missing" Error

**Cause**: Environment variable not set

**Solution**:
1. Go to Netlify Dashboard → Site settings → Environment variables
2. Verify `GEMINI_API_KEY` is set
3. If just added, trigger a new deploy:
   ```bash
   netlify deploy --prod
   ```
4. Clear cache if needed:
   ```bash
   netlify build --clear-cache
   ```

### Issue: Rate Limit Errors

**Cause**: Too many requests in a short time

**Solution**: This is working as intended. Rate limits are:
- Place details: 10 requests/minute
- Image generation: 5 requests/minute
- Image analysis: 3 requests/minute

To modify, edit the `RATE_LIMIT` constant in the respective function files.

### Issue: Images Not Loading

**Possible causes & solutions**:

1. **Gemini quota exceeded**: 
   - Add Unsplash API key for fallback
   - Placeholder images will still show

2. **CORS errors**:
   - Verify functions have correct CORS headers (should be automatic)
   - Check browser console for specific error

3. **Function timeout**:
   - Images may take up to 20 seconds to generate
   - Fallback to Unsplash/Wikimedia should be automatic

### Issue: Build Fails

**Common causes**:

1. **Missing dependencies**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **TypeScript errors**:
   ```bash
   npm run build 2>&1 | grep "error TS"
   ```

3. **Environment issues**:
   - Make sure Node.js version is 16+
   - Check Netlify build logs for specific errors

---

## Performance Optimization

### 1. Enable Asset Optimization

In Netlify Dashboard:
**Site settings** → **Build & deploy** → **Post processing**

Enable:
- ✅ Bundle CSS
- ✅ Minify CSS
- ✅ Minify JavaScript
- ✅ Pretty URLs

### 2. Configure Caching

The backend functions already cache responses, but you can add headers for static assets.

Create `netlify.toml` section (already included):
```toml
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### 3. Enable Netlify CDN

Automatically enabled! Your site is served from global CDN.

---

## Monitoring & Analytics

### View Function Usage

```bash
# Via CLI
netlify functions:list

# View function logs
netlify functions:log fetchPlaceDetails
```

### Built-in Analytics

Enable Netlify Analytics (paid feature) for:
- Page views
- Unique visitors
- Top pages
- Traffic sources

### Custom Monitoring

Add Google Analytics or other tracking by modifying `index.html`:

```html
<!-- Add before closing </head> tag -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

---

## Continuous Deployment

Netlify automatically deploys when you push to your main branch.

### Configure Branch Deploys

1. Go to **Site settings** → **Build & deploy** → **Deploy contexts**
2. Configure which branches to deploy
3. Enable **Deploy Previews** for pull requests

### Automated Testing (Optional)

Add to your workflow:

```bash
# .github/workflows/netlify-deploy.yml
name: Netlify Deploy
on: [push, pull_request]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: netlify deploy --prod
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

---

## Cost Estimation

### Free Tier Limits (Netlify)
- ✅ 100 GB bandwidth/month
- ✅ 125,000 function invocations/month
- ✅ 100 hours function runtime/month
- ✅ Automatic HTTPS
- ✅ Continuous deployment

### Gemini API (Google)
- Free tier: Generous limits
- Paid: Based on usage
- Monitor at [Google Cloud Console](https://console.cloud.google.com/)

### Estimated Usage
For a small to medium hackathon project:
- **Expected traffic**: ~1,000 visitors/month
- **Function calls**: ~5,000/month
- **Bandwidth**: ~10 GB/month
- **Cost**: $0 (well within free tier)

---

## Security Best Practices

✅ **Already Implemented:**
- API keys in environment variables (not in code)
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS headers configured
- Request timeouts

### Additional Recommendations:

1. **Enable Netlify Identity** (if adding user accounts)
2. **Use Netlify Forms** (for contact/feedback)
3. **Enable HTTPS-only** (automatic on Netlify)
4. **Regular dependency updates**:
   ```bash
   npm audit
   npm audit fix
   ```

---

## Support

If you encounter issues:

1. Check [Netlify Documentation](https://docs.netlify.com/)
2. View [Netlify Support Forums](https://answers.netlify.com/)
3. Open an issue on [GitHub](https://github.com/ravigohel142996/itihas-heritage-assistant/issues)
4. Check function logs: `netlify functions:log`

---

## Success! 🎉

Your Itihas Heritage Assistant should now be live and production-ready!

**Share your deployment:**
- Tweet about it with #ItihasHeritage
- Add it to your hackathon submission
- Share with the community

**Next Steps:**
- Monitor usage and performance
- Gather user feedback
- Iterate and improve
- Consider adding more features

---

**Happy Deploying!** 🚀
