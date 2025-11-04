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
    const { airtableId, status, estimatedHours, actualHours, notes } = data;
    
    if (!airtableId) {
      throw new Error('Airtable record ID is required');
    }
    
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
