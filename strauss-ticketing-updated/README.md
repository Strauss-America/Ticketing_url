# Strauss America - Data Request Ticketing System

A complete ticketing system for managing data requests, integrated with Airtable for centralized storage and Netlify for hosting.

## 🎯 What's Fixed

The original system stored tickets in browser localStorage, meaning tickets were only visible on the computer where they were submitted. This new version:

✅ Stores all tickets in Airtable (centralized database)
✅ All admins can see all tickets from any device
✅ Real-time updates across all users
✅ Email notifications still work
✅ Export functionality maintained

## 📋 Prerequisites

- Netlify account (free)
- Airtable account (free)
- Your Airtable API key and Base ID from Phase 1

## 🚀 Deployment Steps

### Step 1: Prepare Your Files

You have all the files in the `strauss-ticketing-updated` folder:
- `index.html` - Main application
- `netlify.toml` - Netlify configuration
- `package.json` - Dependencies
- `netlify/functions/` - Backend functions
  - `submit-ticket.js`
  - `get-tickets.js`
  - `update-ticket.js`

### Step 2: Deploy to Netlify

**Option A: Deploy via Netlify UI (Easiest)**

1. Go to https://app.netlify.com
2. Log in to your account
3. Click **"Add new site"** → **"Deploy manually"**
4. Drag and drop the entire `strauss-ticketing-updated` folder
5. Wait for deployment to complete

**Option B: Deploy via Git (Recommended for updates)**

1. Create a new GitHub repository
2. Push all files to the repository
3. In Netlify, click **"Add new site"** → **"Import from Git"**
4. Connect your GitHub repository
5. Netlify will auto-detect settings from `netlify.toml`
6. Click **"Deploy site"**

### Step 3: Configure Environment Variables in Netlify

After deployment:

1. Go to your site in Netlify dashboard
2. Click **"Site configuration"** → **"Environment variables"**
3. Add these variables (click **"Add a variable"** for each):

| Variable Name | Value | Where to Find It |
|---------------|-------|------------------|
| `AIRTABLE_API_KEY` | Your API token | From Phase 1, Step 3 |
| `AIRTABLE_BASE_ID` | Your Base ID (starts with `app`) | From Phase 1, Step 4 |
| `ADMIN_EMAIL` | your-email@strauss.com | Your email for notifications |

4. Click **"Save"**

### Step 4: Redeploy

After adding environment variables:

1. Go to **"Deploys"** tab
2. Click **"Trigger deploy"** → **"Clear cache and deploy site"**
3. Wait for deployment to complete (1-2 minutes)

### Step 5: Test Your System

1. Click on your site URL (e.g., `https://your-site-name.netlify.app`)
2. Submit a test ticket using the form
3. Click **"Admin Dashboard"**
4. Enter password: `strauss2024` (you can change this in `index.html` line 597)
5. Verify the ticket appears in the dashboard
6. Check Airtable - the ticket should also be there
7. Try updating the ticket status

## 🔐 Changing Admin Password

To change the admin password:

1. Open `index.html`
2. Find line 597: `const ADMIN_PASSWORD = 'strauss2024';`
3. Change `'strauss2024'` to your desired password
4. Save and redeploy

## 📧 Setting Up Email Notifications (Optional)

The system currently logs email notifications. To send actual emails:

1. Sign up for SendGrid (free tier: 100 emails/day)
2. Get your SendGrid API key
3. Add `SENDGRID_API_KEY` to Netlify environment variables
4. Uncomment lines 45-54 in `submit-ticket.js`
5. Update the `from` email address
6. Redeploy

## 📊 Using Airtable Interface

You can also manage tickets directly in Airtable:

1. Go to your Airtable base
2. View all tickets in the table
3. Sort, filter, and edit as needed
4. Changes sync automatically to the web interface

## 🔄 Updating Your Site

If you deployed via Git:
1. Make changes to your files locally
2. Commit and push to GitHub
3. Netlify automatically redeploys

If you deployed manually:
1. Make changes to your files
2. Go to Netlify → **"Deploys"** → **"Deploy manually"**
3. Drag and drop the updated folder

## 📁 File Structure

```
strauss-ticketing-updated/
├── index.html              # Main application
├── netlify.toml           # Netlify configuration
├── package.json           # Dependencies
├── .env.example          # Environment variables template
└── netlify/
    └── functions/
        ├── submit-ticket.js    # Create new tickets
        ├── get-tickets.js      # Fetch all tickets
        └── update-ticket.js    # Update ticket status
```

## ✨ Features

### User Features
- Submit data requests via clean form
- Required fields validation
- Success/error messages
- Mobile-responsive design

### Admin Features
- Password-protected dashboard
- Real-time ticket viewing
- Filter by status, urgency, type
- Search functionality
- Update ticket status and hours
- Add admin notes
- Export to CSV

### Technical Features
- Centralized database (Airtable)
- Serverless functions (Netlify)
- No backend server required
- Automatic scaling
- HTTPS enabled

## 🆘 Troubleshooting

### Tickets not appearing in dashboard
1. Check environment variables are set correctly
2. Verify Airtable API token has correct permissions
3. Check browser console for errors (F12)
4. Check Netlify function logs

### "Failed to submit ticket" error
1. Verify Airtable Base ID is correct
2. Check that table is named exactly "Tickets"
3. Verify all field names match in Airtable
4. Check Netlify function logs for details

### Admin login not working
1. Verify you're entering the correct password
2. Check `index.html` line 597 for current password
3. Password is case-sensitive

## 📞 Support

If you encounter issues:
1. Check Netlify function logs: **Site → Functions → View logs**
2. Check Airtable API status: https://status.airtable.com
3. Review browser console (F12) for JavaScript errors

## 🎓 Next Steps

Consider these enhancements:
- Set up SendGrid for automated emails
- Add file upload capability
- Create custom Airtable views
- Add more ticket fields
- Implement ticket assignment to team members
- Add due date reminders

## 📝 License

Internal use for Strauss America only.
