const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    
    // Generate ticket ID
    const ticketId = Date.now().toString();
    const now = new Date().toISOString();
    
    // Prepare Airtable record
    const airtableRecord = {
      fields: {
        'Ticket ID': ticketId,
        'Requester Name': data.requesterName,
        'Requester Email': data.requesterEmail,
        'Department': data.department,
        'Request Type': data.requestType,
        'Urgency': data.urgency,
        'Status': 'New',
        'Description': data.description,
        'Created At': now,
        'Updated At': now
      }
    };
    
    // Add deadline if provided
    if (data.deadline) {
      airtableRecord.fields['Deadline'] = data.deadline;
    }
    
    // Send to Airtable
    const airtableResponse = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Tickets`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(airtableRecord)
      }
    );
    
    if (!airtableResponse.ok) {
      const errorData = await airtableResponse.json();
      console.error('Airtable error:', errorData);
      throw new Error('Failed to save ticket to Airtable');
    }
    
    const airtableData = await airtableResponse.json();
    
    // Send email notification
    await sendEmailNotification(data, ticketId);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        ticketId: ticketId,
        message: 'Ticket submitted successfully'
      })
    };
    
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to submit ticket',
        message: error.message
      })
    };
  }
};

async function sendEmailNotification(data, ticketId) {
  // This uses Netlify's email integration
  // You can customize this or use a different email service
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@strauss.com';
  
  const emailBody = `
A new data request ticket has been submitted:

Ticket #: ${ticketId}
Requester: ${data.requesterName} (${data.requesterEmail})
Department: ${data.department}
Request Type: ${data.requestType}
Urgency: ${data.urgency}
Deadline: ${data.deadline || 'No deadline specified'}

Description:
${data.description}

Created: ${new Date().toLocaleString()}

Please log in to the admin dashboard to view and manage this ticket.
  `;
  
  // For production, integrate with SendGrid, AWS SES, or another email service
  // For now, this is a placeholder - you'll need to set up actual email sending
  console.log('Email notification would be sent to:', adminEmail);
  console.log('Email body:', emailBody);
  
  // Example with SendGrid (uncomment and configure if you want to use it):
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  await sgMail.send({
    to: adminEmail,
    from: 'noreply@strauss.com',
    subject: `New Data Request - Ticket #${ticketId}`,
    text: emailBody
  });
  */
}
