const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const { OAuth2 } = google.auth;

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the incoming ticket data
    const ticket = JSON.parse(event.body);
    
    // Get OAuth credentials from environment variables
    const oauth2Client = new OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN
    });

    const accessToken = await oauth2Client.getAccessToken();

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: accessToken.token
      }
    });

    const adminEmail = 'william.hinebrick@strauss.com';
    const fromEmail = 'william.hinebrick@strauss.com';
    const requesterEmail = ticket.requesterEmail;

    // Email to admin
    const adminEmailBody = `A new data request ticket has been submitted:

Ticket #: ${ticket.id}
Requester: ${ticket.requesterName} (${ticket.requesterEmail})
Department: ${ticket.department}
Request Type: ${ticket.requestType}
Urgency: ${ticket.urgency}
Deadline: ${ticket.deadline}

Description:
${ticket.description}

Created: ${ticket.createdAt}

Please log in to the admin dashboard to view and manage this ticket:
https://strauss-america-analytics-tickets.netlify.app`;

    await transporter.sendMail({
      from: `"Strauss Analytics Ticketing" <${fromEmail}>`,
      to: adminEmail,
      replyTo: requesterEmail,
      subject: `New Data Request - Ticket #${ticket.id}`,
      text: adminEmailBody
    });

    // Confirmation email to requester
    const requesterEmailBody = `Dear ${ticket.requesterName},

Thank you for submitting your data request. Your ticket has been received and assigned the following number:

Ticket #: ${ticket.id}

Request Summary:
- Department: ${ticket.department}
- Request Type: ${ticket.requestType}
- Urgency: ${ticket.urgency}
- Deadline: ${ticket.deadline}

Description:
${ticket.description}

Our analytics team will review your request and get back to you shortly. You will receive email updates as your ticket status changes.

If you have any questions, please reply to this email.

Thank you,
Strauss America Analytics Team`;

    await transporter.sendMail({
      from: `"Strauss Analytics Ticketing" <${fromEmail}>`,
      to: requesterEmail,
      subject: `Ticket Confirmation - #${ticket.id}`,
      text: requesterEmailBody
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Ticket submitted successfully',
        ticketId: ticket.id 
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to submit ticket',
        details: error.message 
      })
    };
  }
};
