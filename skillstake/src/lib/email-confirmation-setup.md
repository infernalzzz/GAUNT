# Email Confirmation Setup for Supabase

## 1. Supabase Email Configuration

### Supabase DOES Send Emails, But You Need To:
1. **Configure SMTP settings** in Supabase Dashboard
2. **Set up email templates** for confirmation emails
3. **Enable email confirmations** in auth settings

## 2. Step-by-Step Setup

### Step 1: Configure SMTP (Required)
1. Go to **Authentication → Settings**
2. Find **"SMTP Settings"** section
3. Choose one of these options:

#### Option A: Use Supabase's Default (Limited)
- Uses Supabase's default email service
- **Limited to 3 emails per hour** for free tier
- Good for testing, not production

#### Option B: Use Your Own SMTP (Recommended)
- **Gmail SMTP**: smtp.gmail.com:587
- **SendGrid**: api.sendgrid.com
- **Mailgun**: smtp.mailgun.org:587
- **AWS SES**: email-smtp.us-east-1.amazonaws.com:587

### Step 2: Email Templates
1. Go to **Authentication → Email Templates**
2. Customize the **"Confirm signup"** template
3. Add your branding and messaging

### Step 3: Enable Email Confirmation
1. Go to **Authentication → Settings**
2. **Check "Enable email confirmations"**
3. **Save changes**

## 3. Email Service Options

### Free Options:
- **Gmail SMTP** (15,000 emails/day)
- **SendGrid** (100 emails/day free)
- **Mailgun** (5,000 emails/month free)

### Paid Options:
- **SendGrid** ($15/month for 40,000 emails)
- **Mailgun** ($35/month for 50,000 emails)
- **AWS SES** ($0.10 per 1,000 emails)

## 4. Testing Email Confirmation

### Test Flow:
1. **Enable email confirmations**
2. **Sign up with a new account**
3. **Check email** for confirmation link
4. **Click link** to confirm account
5. **Try logging in** (should work after confirmation)

## 5. Production Considerations

### For Launch:
- **Start with email confirmation enabled**
- **Monitor email delivery rates**
- **Have fallback for email issues**
- **Consider phone verification** for high-stakes lobbies
