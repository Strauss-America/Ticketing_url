const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Fetch all tickets from Airtable
    const airtableResponse = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Tickets?sort%5B0%5D%5Bfield%5D=Created%20At&sort%5B0%5D%5Bdirection%5D=desc`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`
        }
      }
    );
    
    if (!airtableResponse.ok) {
      const errorData = await airtableResponse.json();
      console.error('Airtable error:', errorData);
      throw new Error('Failed to fetch tickets from Airtable');
    }
    
    const airtableData = await airtableResponse.json();
    
    // Transform Airtable records to our format
    const tickets = airtableData.records.map(record => ({
      airtableId: record.id,
      ticketId: record.fields['Ticket ID'],
      requesterName: record.fields['Requester Name'],
      requesterEmail: record.fields['Requester Email'],
      department: record.fields['Department'],
      requestType: record.fields['Request Type'],
      urgency: record.fields['Urgency'],
      status: record.fields['Status'] || 'New',
      deadline: record.fields['Deadline'] || null,
      description: record.fields['Description'],
      estimatedHours: record.fields['Estimated Hours'] || null,
      actualHours: record.fields['Actual Hours'] || null,
      notes: record.fields['Notes'] || '',
      createdAt: record.fields['Created At'],
      updatedAt: record.fields['Updated At']
    }));
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        tickets: tickets
      })
    };
    
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to fetch tickets',
        message: error.message
      })
    };
  }
};
