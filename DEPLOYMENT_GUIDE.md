# SkillStake Deployment Guide

This guide covers multiple hosting options for your React + Vite + Supabase application.

## Prerequisites

1. **Git Setup** (if not already done):
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

2. **Environment Variables**: You'll need your Supabase credentials:
   - Supabase URL
   - Supabase Anon Key
   - Stripe keys (if using payments)

## Option 1: GitHub Pages (Free Static Hosting)

### Step 1: Create GitHub Repository
1. Go to [GitHub.com](https://github.com) and create a new repository
2. Name it `skillstake` or your preferred name
3. Make it public (required for free GitHub Pages)

### Step 2: Push Your Code
```bash
# In your project directory
git remote add origin https://github.com/YOUR_USERNAME/skillstake.git
git branch -M main
git push -u origin main
```

### Step 3: Configure GitHub Pages
1. Go to your repository on GitHub
2. Click "Settings" tab
3. Scroll to "Pages" section
4. Under "Source", select "GitHub Actions"
5. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: skillstake/package-lock.json

    - name: Install dependencies
      run: |
        cd skillstake
        npm ci

    - name: Build
      run: |
        cd skillstake
        npm run build
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        VITE_STRIPE_PUBLISHABLE_KEY: ${{ secrets.VITE_STRIPE_PUBLISHABLE_KEY }}

    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: skillstake/dist
```

### Step 4: Add Environment Variables
1. Go to repository Settings → Secrets and variables → Actions
2. Add these secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PUBLISHABLE_KEY` (if using Stripe)

## Option 2: Vercel (Recommended for React Apps)

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Deploy
```bash
cd skillstake
vercel
```

### Step 3: Configure Environment Variables
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PUBLISHABLE_KEY`

### Step 4: Automatic Deployments
Connect your GitHub repository to Vercel for automatic deployments on every push.

## Option 3: Netlify

### Step 1: Build Settings
Create `netlify.toml` in your project root:

```toml
[build]
  base = "skillstake"
  publish = "skillstake/dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Step 2: Deploy
1. Go to [Netlify.com](https://netlify.com)
2. Drag and drop your `skillstake/dist` folder
3. Or connect your GitHub repository

### Step 3: Environment Variables
1. Go to Site settings → Environment variables
2. Add your Supabase and Stripe keys

## Option 4: Railway

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Deploy
```bash
cd skillstake
railway login
railway init
railway up
```

## Environment Variables Setup

Create a `.env` file in your `skillstake` directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## Build Optimization

Update your `vite.config.ts` for production:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          stripe: ['@stripe/stripe-js', '@stripe/react-stripe-js']
        }
      }
    }
  },
  server: {
    port: 3000
  }
})
```

## Database Considerations

Since you're using Supabase:
1. Make sure your Supabase project is in production mode
2. Configure proper RLS policies
3. Set up proper CORS settings
4. Consider database backups

## Custom Domain (Optional)

For any hosting option:
1. Purchase a domain
2. Configure DNS settings
3. Add SSL certificate (most platforms do this automatically)

## Monitoring and Analytics

Consider adding:
- Vercel Analytics
- Google Analytics
- Sentry for error tracking
- Supabase Analytics

## Security Checklist

- [ ] Environment variables are properly set
- [ ] RLS policies are configured
- [ ] CORS is properly configured
- [ ] HTTPS is enabled
- [ ] API keys are not exposed in client code

## Troubleshooting

### Common Issues:
1. **Build fails**: Check environment variables
2. **Supabase connection issues**: Verify URL and keys
3. **Routing issues**: Ensure proper redirects for SPA
4. **Performance**: Optimize bundle size and images

### Support:
- Vercel: Excellent for React apps
- Netlify: Great for static sites
- GitHub Pages: Free but limited
- Railway: Good for full-stack apps
