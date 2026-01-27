import { test, expect } from '@playwright/test';

const SUPABASE_URL = 'https://clfcuadlkfpawkpnehdq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZmN1YWRsa2ZwYXdrcG5laGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MTI3MzQsImV4cCI6MjA4MzA4ODczNH0.Y-LPnnqwhIRN72dLkcrRBm6ZD7LzIo9rlGEzGV0hBdY';

test('Check Supabase API fields - verify order_remarks exists', async ({ request }) => {
  // Query Supabase API directly to see all fields
  const response = await request.get(
    `${SUPABASE_URL}/rest/v1/localization_resources?select=*&limit=5`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  expect(response.ok()).toBeTruthy();

  const data = await response.json();
  console.log('=== Supabase API Response (first 5 records) ===');
  console.log(JSON.stringify(data, null, 2));

  if (data.length > 0) {
    console.log('\n=== Available fields in database ===');
    console.log(Object.keys(data[0]));

    // Check if order_remarks exists
    const hasOrderRemarks = 'order_remarks' in data[0];
    console.log(`\n=== order_remarks field exists: ${hasOrderRemarks} ===`);
    expect(hasOrderRemarks).toBeTruthy();
  }
});

test('Verify all expected fields exist in database', async ({ request }) => {
  // Query Supabase API to verify all expected fields exist
  const response = await request.get(
    `${SUPABASE_URL}/rest/v1/localization_resources?select=*&limit=1`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  expect(response.ok()).toBeTruthy();
  const data = await response.json();

  if (data.length > 0) {
    const fields = Object.keys(data[0]);
    console.log('\n=== All fields in localization_resources ===');
    console.log(fields);

    // Verify all expected fields exist
    const expectedFields = [
      'id',
      'resource_type',
      'culture_code',
      'resource_key',
      'resource_value',
      'organization_id',
      'created_at',
      'updated_at',
      'order_remarks'
    ];

    for (const field of expectedFields) {
      const exists = fields.includes(field);
      console.log(`${field}: ${exists ? '✅' : '❌'}`);
      expect(exists).toBeTruthy();
    }
  }
});
