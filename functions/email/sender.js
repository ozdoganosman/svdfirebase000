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
  const { subject, html, text } = templates.quoteApprovedTemplate(quote);

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
  const { subject, html, text } = templates.quoteRejectedTemplate(quote);
  return sendEmail(quote.customer.email, subject, html, text);
}

/**
 * Send sample approved notification to customer
 */
export async function sendSampleApprovedEmail(sample) {
  const { subject, html, text } = templates.sampleApprovedTemplate(sample);
  return sendEmail(sample.customer.email, subject, html, text);
}

/**
 * Send new quote notification to admin
 */
export async function sendNewQuoteAdminEmail(quote, adminEmail) {
  const { subject, html, text } = templates.newQuoteAdminTemplate(quote);
  return sendEmail(adminEmail, subject, html, text);
}

/**
 * Send new sample notification to admin
 */
export async function sendNewSampleAdminEmail(sample, adminEmail) {
  const { subject, html, text } = templates.newSampleAdminTemplate(sample);
  return sendEmail(adminEmail, subject, html, text);
}
