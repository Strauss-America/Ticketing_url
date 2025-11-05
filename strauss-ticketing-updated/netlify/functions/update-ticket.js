const fetch = require('node-fetch');
const nodemailer = require('nodemailer');

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
    const { airtableId, status, estimatedHours, actualHours, notes } = data;
    
    if (!airtableId) {
      throw new Error('Airtable record ID is required');
    }
    
    // First, get the current ticket details so we can email the requester
    const getResponse = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Tickets/${airtableId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`
        }
      }
    );
    
    if (!getResponse.ok) {
      throw new Error('Failed to fetch ticket details');
    }
    
    const ticketData = await getResponse.json();
    const ticketFields = ticketData.fields;
    
    const now = new Date().toISOString();
    
    // Prepare update fields
    const updateFields = {
      'Status': status,
      'Updated At': now
    };
    
    // Add optional fields if provided
    if (estimatedHours !== null && estimatedHours !== undefined) {
      updateFields['Estimated Hours'] = estimatedHours;
    }
    
    if (actualHours !== null && actualHours !== undefined) {
      updateFields['Actual Hours'] = actualHours;
    }
    
    if (notes !== null && notes !== undefined) {
      updateFields['Notes'] = notes;
    }
    
    // Update in Airtable
    const airtableResponse = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Tickets/${airtableId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: updateFields
        })
      }
    );
    
    if (!airtableResponse.ok) {
      const errorData = await airtableResponse.json();
      console.error('Airtable error:', errorData);
      throw new Error('Failed to update ticket in Airtable');
    }
    
    const airtableData = await airtableResponse.json();
    
    // Send email notification about the update
    try {
      await sendUpdateEmail(ticketFields, status, estimatedHours, actualHours, notes);
    } catch (emailError) {
      console.error('Email error (ticket still updated):', emailError);
      // Don't fail the whole request if email fails
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Ticket updated successfully'
      })
    };
    
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to update ticket',
        message: error.message
      })
    };
  }
};

async function sendUpdateEmail(ticketFields, newStatus, estimatedHours, actualHours, notes) {
  // Create transporter using your SMTP settings
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });

  const ticketId = ticketFields['Ticket ID'];
  const requesterName = ticketFields['Requester Name'];
  const requesterEmail = ticketFields['Requester Email'];
  const oldStatus = ticketFields['Status'];
  const adminEmail = process.env.ADMIN_EMAIL || 'william.hinebrick@strauss.com';
  const fromEmail = process.env.SMTP_USER;
  
  // Determine what changed
  const changes = [];
  if (newStatus !== oldStatus) {
    changes.push(`Status: ${oldStatus} → ${newStatus}`);
  }
  if (estimatedHours !== null && estimatedHours !== undefined) {
    changes.push(`Estimated Hours: ${estimatedHours}`);
  }
  if (actualHours !== null && actualHours !== undefined) {
    changes.push(`Actual Hours: ${actualHours}`);
  }
  
  // Build the email body
  let emailBody = `Hi ${requesterName},

Your data request ticket has been updated.

Ticket #: ${ticketId}
New Status: ${newStatus}
Request Type: ${ticketFields['Request Type']}

`;

  if (changes.length > 0) {
    emailBody += `Changes:\n${changes.map(c => `  • ${c}`).join('\n')}\n\n`;
  }

  if (notes) {
    emailBody += `Admin Notes:\n${notes}\n\n`;
  }

  emailBody += `Original Request:\n${ticketFields['Description']}\n\n`;
  
  emailBody += `If you have any questions, please reply to this email.\n\n`;
  emailBody += `Thank you,\nStrauss America Analytics Team`;

  // Send email to requester
  await transporter.sendMail({
    from: fromEmail,
    replyTo: adminEmail,
    to: requesterEmail,
    subject: `Ticket Update - #${ticketId} - ${newStatus}`,
    text: emailBody
  });
  
  console.log(`Update email sent to ${requesterEmail} for ticket ${ticketId}`);
}
