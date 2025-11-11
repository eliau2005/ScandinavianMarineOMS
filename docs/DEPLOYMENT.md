# Deployment Guide - Vercel

This guide will help you deploy the Scandinavian Marine OMS application to Vercel.

## Prerequisites

- Vercel account (https://vercel.com)
- Git repository (GitHub, GitLab, or Bitbucket)
- Appwrite project already configured

---

## Step 1: Push Your Code to Git

1. **Initialize Git repository (if not already done):**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create a repository on GitHub/GitLab/Bitbucket**

3. **Push your code:**
   ```bash
   git remote add origin <your-repository-url>
   git branch -M main
   git push -u origin main
   ```

---

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. **Go to https://vercel.com**
2. **Click "New Project"**
3. **Import your Git repository**
4. **Configure the project:**
   - **Framework Preset:** Vite
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

5. **Add Environment Variables:**

   Click on "Environment Variables" and add the following:

   ```
   VITE_APPWRITE_ENDPOINT = https://fra.cloud.appwrite.io/v1
   VITE_APPWRITE_PROJECT_ID = 6910e6a5003af03cec58
   VITE_APPWRITE_DATABASE_ID = 6910f1320021a4469a93
   VITE_APPWRITE_PROFILES_COLLECTION_ID = profiles
   ```

   **Important:** Do NOT add `APPWRITE_API_KEY` here - it's only for server-side functions!

6. **Click "Deploy"**

7. **Wait for deployment to complete**

---

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Follow the prompts:**
   - Link to existing project or create new one
   - Confirm settings
   - Add environment variables when prompted

5. **Deploy to production:**
   ```bash
   vercel --prod
   ```

---

## Step 3: Update Appwrite Settings

After deployment, you need to add your Vercel domain to Appwrite:

1. **Go to Appwrite Console**
2. **Select your project**
3. **Go to Settings > Platforms**
4. **Find your Web App platform**
5. **Add your Vercel domain:**
   - Click "Add hostname"
   - Enter: `your-app-name.vercel.app`
   - Save

**Example:** `scandinavian-marine-oms.vercel.app`

---

## Step 4: Test Your Deployment

1. **Visit your Vercel URL:** `https://your-app-name.vercel.app`
2. **Try to login with your credentials**
3. **Verify all features work:**
   - Login
   - Admin dashboard
   - User management (if you have the function deployed)

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_APPWRITE_ENDPOINT` | Appwrite API endpoint | `https://fra.cloud.appwrite.io/v1` |
| `VITE_APPWRITE_PROJECT_ID` | Your Appwrite project ID | `6910e6a5003af03cec58` |
| `VITE_APPWRITE_DATABASE_ID` | Your database ID | `6910f1320021a4469a93` |
| `VITE_APPWRITE_PROFILES_COLLECTION_ID` | Profiles collection ID | `profiles` |

---

## Troubleshooting

### Issue: White screen after deployment

**Solution:**
- Check browser console for errors
- Verify environment variables are set correctly
- Ensure Appwrite hostname is added

### Issue: Can't login

**Solution:**
- Verify Appwrite hostname includes your Vercel domain
- Check that environment variables match your Appwrite project
- Verify user exists in Appwrite Auth and has a profile

### Issue: Functions not working

**Solution:**
- Appwrite Functions are deployed separately (not on Vercel)
- Ensure functions are deployed in Appwrite Console
- Verify function has correct environment variables

---

## Continuous Deployment

Vercel automatically redeploys when you push to your Git repository:

1. **Make changes locally**
2. **Commit and push:**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push
   ```
3. **Vercel automatically deploys the changes**

---

## Custom Domain (Optional)

To use a custom domain:

1. **Go to Vercel Dashboard > Your Project > Settings > Domains**
2. **Add your custom domain**
3. **Update DNS records as instructed**
4. **Add the custom domain to Appwrite:**
   - Appwrite Console > Settings > Platforms
   - Add your custom domain

---

## Production Checklist

Before going to production:

- [ ] All environment variables are set in Vercel
- [ ] Appwrite hostname includes Vercel domain
- [ ] Test login functionality
- [ ] Test user management
- [ ] Verify all dashboards work
- [ ] Check mobile responsiveness
- [ ] Test logout functionality
- [ ] Verify Appwrite Functions are deployed and working
- [ ] Set up monitoring/analytics (optional)

---

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify Appwrite Console logs
4. Ensure all environment variables are correct

---

**Good luck with your deployment! 🚀**
