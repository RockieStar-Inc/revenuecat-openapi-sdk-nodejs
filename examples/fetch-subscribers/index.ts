import { Configuration, CustomerApi } from 'revenuecat-openapi-sdk-nodejs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const API_KEY = process.env.REVENUECAT_API_KEY;
const PROJECT_ID = process.env.REVENUECAT_PROJECT_ID;

if (!API_KEY || !PROJECT_ID) {
  console.error('Please set REVENUECAT_API_KEY and REVENUECAT_PROJECT_ID in your .env file');
  process.exit(1);
}

// Initialize the SDK
const configuration = new Configuration({
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  },
  basePath: 'https://api.revenuecat.com/v2'
});

const customerApi = new CustomerApi(configuration);

async function fetchSubscribers(): Promise<void> {
  try {
    console.log('Fetching subscribers...\n');
    
    // Fetch the list of customers/subscribers
    const response = await customerApi.listCustomers({
      projectId: PROJECT_ID!,
      startingAfter: undefined, // Optional: for pagination
      limit: 100 // Optional: number of records per page (default is usually 20)
    });

    console.log(`Total subscribers found: ${response.items?.length || 0}`);
    console.log('Has more pages:', (response as any).hasMore || false);
    
    if (response.items && response.items.length > 0) {
      console.log('\n--- Subscriber List ---\n');
      
      response.items.forEach((customer, index) => {
        console.log(`${index + 1}. Customer ID: ${customer.id}`);
        console.log(`   App User ID: ${(customer as any).appUserId || 'N/A'}`);
        console.log(`   Created: ${(customer as any).createdAt || 'N/A'}`);
        console.log(`   Last Seen: ${customer.lastSeenAt}`);
        
        // Display entitlements if any
        const entitlements = (customer as any).entitlements;
        if (entitlements && Object.keys(entitlements).length > 0) {
          console.log('   Active Entitlements:');
          Object.entries(entitlements).forEach(([key, entitlement]: [string, any]) => {
            console.log(`     - ${key}: ${entitlement.expiresAt ? `expires ${entitlement.expiresAt}` : 'lifetime'}`);
          });
        }
        
        console.log('');
      });
      
      // Pagination info
      if ((response as any).hasMore && (response as any).nextPage) {
        console.log(`\nTo fetch next page, use startingAfter: "${(response as any).nextPage}"`);
      }
    } else {
      console.log('No subscribers found.');
    }
    
  } catch (error: any) {
    console.error('Error fetching subscribers:', error);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', await error.response.text());
    }
  }
}

// Run the example
fetchSubscribers();