# Security Policy

## Overview

This document outlines the security measures implemented in the Itihas Heritage Assistant and provides guidelines for reporting security vulnerabilities.

## Security Features

### ✅ Implemented Security Measures

#### 1. API Key Protection
- **No client-side API keys**: All API keys are stored securely in Netlify environment variables
- **Backend-only access**: API calls are routed through Netlify Functions
- **Build-time exclusion**: API keys are never included in the frontend bundle

#### 2. Rate Limiting
All backend endpoints implement rate limiting to prevent abuse:

| Endpoint | Rate Limit | Time Window |
|----------|-----------|-------------|
| `fetchPlaceDetails` | 10 requests | 1 minute |
| `generateImage` | 5 requests | 1 minute |
| `analyzeImage` | 3 requests | 1 minute |

Rate limiting is tracked per client IP address.

#### 3. Input Validation & Sanitization
- **Length limits**: All text inputs are limited to reasonable lengths
- **Type validation**: Inputs are validated for correct data types
- **Sanitization**: Potential XSS vectors are sanitized
- **File validation**: Uploaded images are validated (type, count, size)

Example from `fetchPlaceDetails`:
```typescript
const sanitizedPlaceName = placeName.trim().substring(0, 200);
const sanitizedLanguage = language.trim().substring(0, 50);
```

#### 4. Request Timeout Protection
- All API calls have 15-20 second timeouts
- Prevents resource exhaustion from hanging requests
- Automatic fallback to cached or mock data

#### 5. Response Caching
- Reduces load on external APIs
- 1-hour cache for place details
- 2-hour cache for images
- Prevents cache poisoning with input sanitization

#### 6. CORS Configuration
- Proper CORS headers on all endpoints
- Allows requests from any origin (public API)
- Prevents CSRF attacks through backend architecture

#### 7. Error Handling
- Errors never expose sensitive information
- Generic error messages shown to users
- Detailed errors logged server-side only
- Stack traces hidden in production

#### 8. Dependency Security
- Regular dependency updates via `npm audit`
- Automated vulnerability scanning
- Use of stable, well-maintained packages

## Security Best Practices for Deployment

### Environment Variables

**✅ DO:**
- Store all API keys in Netlify environment variables
- Use different keys for development and production
- Rotate API keys periodically
- Use strong, unique keys

**❌ DON'T:**
- Commit API keys to Git
- Share keys in public channels
- Use the same key across multiple projects
- Store keys in frontend code

### API Key Rotation

If you need to rotate your API keys:

1. Generate new key in Google AI Studio
2. Add new key to Netlify environment variables
3. Trigger a redeploy
4. Monitor for errors
5. Delete old key after verification

```bash
netlify env:set GEMINI_API_KEY "new_key_here"
netlify deploy --prod
```

### Monitoring

Monitor your deployment for suspicious activity:

1. **Check function logs regularly:**
   ```bash
   netlify functions:log fetchPlaceDetails --lines 100
   ```

2. **Monitor rate limit hits:**
   - Frequent 429 errors may indicate abuse
   - Check logs for suspicious IP addresses

3. **Review API usage:**
   - Check Google Cloud Console for unexpected spikes
   - Set up billing alerts

4. **Enable Netlify Analytics:**
   - Track unusual traffic patterns
   - Monitor bandwidth usage

## Known Limitations

### 1. Public API Endpoints
- Backend functions are publicly accessible
- Rate limiting provides primary protection
- Consider adding authentication for production use at scale

### 2. Client-Side Image Upload
- Images are converted to base64 on client
- Large images may impact performance
- 5-image limit enforced

### 3. No User Authentication
- Current implementation doesn't require user accounts
- Favorites stored in localStorage only
- No personal data collection

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

### Please DO:
- Email security concerns to the repository maintainer
- Provide detailed description of the vulnerability
- Include steps to reproduce the issue
- Allow reasonable time for a fix before public disclosure

### Please DON'T:
- Publicly disclose the vulnerability before it's fixed
- Exploit the vulnerability for malicious purposes
- Attempt to access other users' data

### Response Timeline

- **Initial response**: Within 48 hours
- **Status update**: Within 7 days
- **Fix timeline**: Depends on severity
  - Critical: 1-7 days
  - High: 7-30 days
  - Medium: 30-90 days
  - Low: Best effort

## Security Checklist for Contributors

Before submitting a PR, ensure:

- [ ] No API keys or secrets in code
- [ ] Input validation on all user inputs
- [ ] Proper error handling (no info leakage)
- [ ] Dependencies up to date (`npm audit`)
- [ ] Rate limiting considered for new endpoints
- [ ] XSS prevention in rendered content
- [ ] SQL injection prevention (if using database)
- [ ] CORS configured correctly

## Vulnerability Disclosure

We maintain a list of past vulnerabilities (currently none) to be transparent about our security:

| CVE/ID | Severity | Date Discovered | Date Fixed | Description |
|--------|----------|----------------|------------|-------------|
| - | - | - | - | No vulnerabilities reported yet |

## Compliance

### Data Protection
- **GDPR**: No personal data collected or stored
- **CCPA**: No California consumer data processed
- **Cookie Policy**: No cookies used (localStorage only)

### Third-Party Services
- **Google Gemini**: Subject to Google's privacy policy
- **Unsplash**: Subject to Unsplash's terms of service
- **Wikimedia**: Public domain content
- **OpenStreetMap**: Open data license

## Security Updates

Stay informed about security updates:

1. **Watch this repository** for security advisories
2. **Subscribe to Netlify security blog**: https://www.netlify.com/blog/
3. **Follow Google AI updates**: https://ai.google.dev/
4. **Check npm security advisories**: https://github.com/advisories

## Security Contact

For security-related questions or concerns:

- **GitHub Issues**: For general security questions (no vulnerabilities)
- **Email**: Contact repository owner directly for vulnerability reports
- **Response time**: 48 hours for critical issues

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Netlify Security](https://www.netlify.com/security/)
- [Google Cloud Security](https://cloud.google.com/security)
- [npm Security](https://docs.npmjs.com/about-security-audits)

## License

This security policy is provided as-is and is subject to change without notice.

---

**Last Updated**: February 2026

**Version**: 1.0.0

---

## Acknowledgments

We appreciate the security research community and responsible disclosure. If you help improve our security, we're happy to credit you (with permission) in our acknowledgments.

---

Thank you for helping keep Itihas Heritage Assistant and its users safe! 🔒
