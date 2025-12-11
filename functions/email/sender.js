import { db } from "../db/client.js";
import * as templates from "./templates.js";

const mailCollection = db.collection("mail");

/**
 * Send email using Firebase Trigger Email Extension
 * The extension watches the 'mail' collection and sends emails automatically
 */
async function sendEmail(to, subject, html, text, attachments = []) {
  try {
    const emailDoc = {
      to,
      message: {
        subject,
        html,
        text,
      },
      createdAt: new Date(),
    };

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      emailDoc.message.attachments = attachments;
    }

    // Write to Firestore mail collection
    // Firebase Trigger Email extension will pick this up and send the email
    const docRef = await mailCollection.add(emailDoc);

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error queuing email:", error);
    throw error;
  }
}

/**
 * Send quote approved notification to customer
 */
export async function sendQuoteApprovedEmail(quote, pdfBuffer = null) {
  const { subject, html, text } = await templates.quoteApprovedTemplate(quote);

  const attachments = [];
  if (pdfBuffer) {
    attachments.push({
      filename: `teklif-${quote.quoteNumber}.pdf`,
      content: pdfBuffer.toString("base64"),
      encoding: "base64",
      contentType: "application/pdf",
    });
  }

  return sendEmail(quote.customer.email, subject, html, text, attachments);
}

/**
 * Send quote rejected notification to customer
 */
export async function sendQuoteRejectedEmail(quote) {
  const { subject, html, text } = await templates.quoteRejectedTemplate(quote);
  return sendEmail(quote.customer.email, subject, html, text);
}

/**
 * Send sample approved notification to customer
 */
export async function sendSampleApprovedEmail(sample) {
  const { subject, html, text } = await templates.sampleApprovedTemplate(sample);
  return sendEmail(sample.customer.email, subject, html, text);
}

/**
 * Send new quote notification to admin
 */
export async function sendNewQuoteAdminEmail(quote, adminEmail) {
  const { subject, html, text } = await templates.newQuoteAdminTemplate(quote);
  return sendEmail(adminEmail, subject, html, text);
}

/**
 * Send new sample notification to admin
 */
export async function sendNewSampleAdminEmail(sample, adminEmail) {
  const { subject, html, text } = await templates.newSampleAdminTemplate(sample);
  return sendEmail(adminEmail, subject, html, text);
}

/**
 * Send test email to verify SMTP configuration
 */
export async function sendTestEmail(to) {
  const subject = "SVD Ambalaj - Test E-postası";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #f59e0b;">Test E-postası</h1>
      <p>Bu e-posta, SVD Ambalaj admin panelinden SMTP ayarlarınızı test etmek için gönderilmiştir.</p>
      <p>E-posta ayarlarınız doğru bir şekilde yapılandırılmış.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #6b7280; font-size: 12px;">Bu bir test e-postasıdır. Herhangi bir işlem yapmanıza gerek yoktur.</p>
    </div>
  `;
  const text = "Bu e-posta, SVD Ambalaj admin panelinden SMTP ayarlarınızı test etmek için gönderilmiştir. E-posta ayarlarınız doğru bir şekilde yapılandırılmış.";

  return sendEmail(to, subject, html, text);
}

/**
 * Send stock alert email to admin
 */
export async function sendStockAlertEmail(stockData, adminEmail) {
  const { subject, html, text } = await templates.stockAlertTemplate(stockData);
  return sendEmail(adminEmail, subject, html, text);
}

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmationEmail(order) {
  const customerEmail = order.customer?.email || order.billingAddress?.email;
  if (!customerEmail) {
    console.warn("No customer email for order confirmation:", order.id);
    return { success: false, error: "No customer email" };
  }

  const { subject, html, text } = await templates.orderConfirmationTemplate(order);
  return sendEmail(customerEmail, subject, html, text);
}

/**
 * Send order status update email to customer
 */
export async function sendOrderStatusEmail(order) {
  const customerEmail = order.customer?.email || order.billingAddress?.email;
  if (!customerEmail) {
    console.warn("No customer email for order status:", order.id);
    return { success: false, error: "No customer email" };
  }

  const { subject, html, text } = await templates.orderStatusTemplate(order);
  return sendEmail(customerEmail, subject, html, text);
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(user) {
  if (!user.email) {
    console.warn("No email for welcome email:", user.uid || user.id);
    return { success: false, error: "No user email" };
  }

  const { subject, html, text } = await templates.welcomeTemplate(user);
  return sendEmail(user.email, subject, html, text);
}

/**
 * Send new order notification to admin
 */
export async function sendNewOrderAdminEmail(order, adminEmail) {
  // Use orderConfirmation template but send to admin
  const { html, text } = await templates.orderConfirmationTemplate(order);
  const subject = `Yeni Sipariş - #${order.orderNumber || order.id}`;
  return sendEmail(adminEmail, subject, html, text);
}
