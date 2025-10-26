# Gmail SMTP Setup for Supabase (Free Option)

## 1. Create Gmail App Password

### Step 1: Enable 2-Factor Authentication
1. Go to **Google Account Settings**
2. **Security** → **2-Step Verification**
3. **Turn on** 2-factor authentication

### Step 2: Generate App Password
1. Go to **Google Account Settings**
2. **Security** → **App passwords**
3. **Select app**: Mail
4. **Select device**: Other (name it "Supabase")
5. **Copy the 16-character password**

## 2. Configure Supabase SMTP

### In Supabase Dashboard:
1. Go to **Authentication → Settings**
2. Find **"SMTP Settings"**
3. Fill in these details:

```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Pass: [16-character app password]
SMTP Admin Email: your-email@gmail.com
SMTP Sender Name: SkillStake
```

## 3. Test Email Configuration

### Test Steps:
1. **Save SMTP settings**
2. **Enable email confirmations**
3. **Sign up with a test account**
4. **Check email** for confirmation link
5. **Click link** to confirm

## 4. Email Limits

### Gmail SMTP Limits:
- **500 emails per day** (free Gmail)
- **2,000 emails per day** (Google Workspace)
- **Rate limit**: 100 emails per hour

### For Production:
- Consider **SendGrid** or **Mailgun** for higher limits
- **Monitor email delivery** rates
- **Set up email analytics**

## 5. Troubleshooting

### Common Issues:
- **"Invalid credentials"** → Check app password
- **"Connection refused"** → Check SMTP settings
- **Emails not received** → Check spam folder
- **Rate limited** → Wait and try again
