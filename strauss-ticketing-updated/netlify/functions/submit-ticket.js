console.log('submit-ticket USING SENDGRID');

console.log('submit-ticket USING SENDGRID', {
  commit: process.env.COMMIT_REF || 'no-commit-ref',
  from: process.env.SENDGRID_FROM || 'unset'
});

const sgMail = require('@sendgrid/mail');

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
    
    // Set SendGrid API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const adminEmail = 'william.hinebrick@strauss.com';
    const fromEmail = 'william.hinebrick@strauss.com';
    const fromName = 'Strauss Analytics Ticketing';
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

    await sgMail.send({
      to: adminEmail,
      from: {
        email: fromEmail,
        name: fromName
      },
      replyTo: requesterEmail,
      subject: `[BY-NETLIFY] New Data Request - Ticket #${ticket.id}`,
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

    await sgMail.send({
      to: requesterEmail,
      from: {
        email: fromEmail,
        name: fromName
      },
      subject: `[BY-NETLIFY] Ticket Confirmation - #${ticket.id}`,
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
