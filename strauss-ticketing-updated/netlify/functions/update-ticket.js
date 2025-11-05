const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const { OAuth2 } = google.auth;

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { ticketId, newStatus, ticketFields } = JSON.parse(event.body);
    
    const oauth2Client = new OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN
    });

    const accessToken = await oauth2Client.getAccessToken();

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
    const requesterEmail = ticketFields['Requester Email'];

    // Prepare email body
    let emailBody = `Hello ${ticketFields['Requester Name']},\n\n`;
    emailBody += `Your ticket #${ticketId} status has been updated to: ${newStatus}\n\n`;
    emailBody += `Ticket Details:\n`;
    emailBody += `Department: ${ticketFields['Department']}\n`;
    emailBody += `Request Type: ${ticketFields['Request Type']}\n`;
    emailBody += `Urgency: ${ticketFields['Urgency']}\n`;
    emailBody += `Deadline: ${ticketFields['Deadline']}\n\n`;
    emailBody += `Description:\n${ticketFields['Description']}\n\n`;
  
    emailBody += `If you have any questions, please reply to this email.\n\n`;
    emailBody += `Thank you,\nStrauss America Analytics Team`;

    // Send email to requester
    await transporter.sendMail({
      from: `"Strauss Analytics Ticketing" <${fromEmail}>`,
      replyTo: adminEmail,
      to: requesterEmail,
      subject: `Ticket Update - #${ticketId} - ${newStatus}`,
      text: emailBody
    });
    
    console.log(`Update email sent to ${requesterEmail} for ticket ${ticketId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Email sent successfully' 
      })
    };

  } catch (error) {
    console.error('Error sending email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to send email',
        details: error.message 
      })
    };
  }
};
