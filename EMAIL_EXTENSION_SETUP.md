# Firebase Trigger Email Extension Setup

## Extension Details
- **Extension Name**: Trigger Email from Firestore
- **Extension ID**: `firebase/firestore-send-email`
- **Version**: 0.2.4 (Latest)

## Installation Steps

### Option 1: Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `svdfirebase000`
3. Navigate to **Build** > **Extensions**
4. Click **Install Extension**
5. Search for "Trigger Email from Firestore"
6. Click **Install**

### Configuration Parameters

When installing, you'll need to provide:

#### Required Settings:
- **SMTP Connection URI**: Your SMTP server details
  - Format: `smtps://username:password@smtp.gmail.com:465`
  - For Gmail: `smtps://your-email@gmail.com:app-password@smtp.gmail.com:465`
  - For custom SMTP: `smtps://username:password@your-smtp-server.com:465`

- **Email Documents Collection**: `mail`
  - This is where our code writes email documents

- **Default FROM Email**: Your sender email (e.g., `noreply@svdambalaj.com`)

- **Default Reply-To Email**: Support email (e.g., `info@svdambalaj.com`)

#### Optional Settings:
- **Users Collection**: (leave empty)
- **Templates Collection**: (leave empty - we use inline templates)
- **Testing Mode**: OFF (for production)

### Option 2: Gmail Setup (For Testing)

If using Gmail for testing:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Create App Password**:
   - Go to Google Account Settings
   - Security > 2-Step Verification > App passwords
   - Generate password for "Mail"
3. **Use in SMTP URI**:
   ```
   smtps://your-email@gmail.com:generated-app-password@smtp.gmail.com:465
   ```

### Option 3: Production Email Service

For production, consider using:
- **SendGrid**: Reliable transactional email service
- **Mailgun**: Developer-friendly email API
- **Amazon SES**: Cost-effective for high volume

## Email Flow

Once configured, the email system works as follows:

1. **Backend writes to Firestore**:
   ```javascript
   await db.collection('mail').add({
     to: 'customer@example.com',
     message: {
       subject: 'Quote Approved',
       html: '<html>...</html>',
       text: 'Plain text...',
       attachments: [/* PDF attachments */]
     }
   });
   ```

2. **Extension monitors collection**: Automatically detects new documents

3. **Extension sends email**: Uses configured SMTP settings

4. **Extension updates document**: Adds delivery status
   ```javascript
   {
     delivery: {
       state: 'SUCCESS',
       endTime: timestamp,
       info: { messageId: '...' }
     }
   }
   ```

## Testing

After installation, test with:

```javascript
// In Firebase Console > Firestore
// Manually add a document to 'mail' collection:
{
  to: 'your-test-email@example.com',
  message: {
    subject: 'Test Email',
    text: 'This is a test email from SVD Ambalaj'
  }
}
```

Check your inbox - you should receive the email within seconds.

## Email Templates Implemented

Our system has 5 email templates ready:

1. **Quote Approved** (`quoteApprovedTemplate`)
   - Sent when admin approves quote
   - Includes PDF attachment
   - Shows product details and totals

2. **Quote Rejected** (`quoteRejectedTemplate`)
   - Sent when admin rejects quote
   - Includes admin notes

3. **Sample Approved** (`sampleApprovedTemplate`)
   - Sent when sample request approved
   - Lists sample products

4. **New Quote Admin Notification** (`newQuoteAdminTemplate`)
   - Sent to admin when new quote submitted

5. **New Sample Admin Notification** (`newSampleAdminTemplate`)
   - Sent to admin when new sample requested

## Monitoring

Monitor email delivery:
- **Firebase Console** > **Firestore** > `mail` collection
  - Check `delivery.state` field (SUCCESS, ERROR, PENDING)
- **Firebase Console** > **Extensions** > **Trigger Email**
  - View logs and metrics

## Troubleshooting

### Emails not sending
1. Check extension is installed and enabled
2. Verify SMTP credentials are correct
3. Check Firestore `mail` collection for error messages
4. Review extension logs in Firebase Console

### Gmail blocks sign-in
- Ensure 2FA is enabled
- Use App Password (not regular password)
- Check "Less secure app access" if needed

### Attachment issues
- Ensure PDF buffer is base64 encoded
- Check attachment size limits (typically 10MB)
- Verify `contentType: 'application/pdf'`

## Cost Estimate

Firebase Trigger Email extension:
- **Free tier**: First 1,000 emails/month
- **Paid tier**: $0.01 per email after free tier

SMTP service costs vary by provider.
