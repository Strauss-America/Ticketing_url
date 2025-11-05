// updating email via sendgrid
// new updates
const sgMail = require('@sendgrid/mail');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { ticketId, newStatus, ticketFields } = JSON.parse(event.body);
    
    // Set SendGrid API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const adminEmail = 'william.hinebrick@strauss.com';
    const fromEmail = 'william.hinebrick@strauss.com';
    const fromName = 'Strauss Analytics Ticketing';
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
    await sgMail.send({
      to: requesterEmail,
      from: {
        email: fromEmail,
        name: fromName
      },
      replyTo: adminEmail,
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
