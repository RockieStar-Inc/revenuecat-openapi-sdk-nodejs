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

interface ActiveSubscription {
  customerId: string;
  appUserId: string;
  subscriptionId?: string;
  productIdentifier?: string;
  expiresAt?: string;
  willRenew?: boolean;
  store?: string;
  entitlements: string[];
}

async function fetchActiveSubscriptions(): Promise<void> {
  try {
    console.log('Fetching active subscriptions...\n');
    
    // First, fetch all customers
    const customersResponse = await customerApi.listCustomers({
      projectId: PROJECT_ID!,
      limit: 100
    });

    if (!customersResponse.items || customersResponse.items.length === 0) {
      console.log('No customers found.');
      return;
    }

    console.log(`Found ${customersResponse.items.length} customers\n`);
    console.log('Analyzing subscriptions...\n');

    const activeSubscriptions: ActiveSubscription[] = [];
    let activeCount = 0;
    let expiredCount = 0;
    let lifetimeCount = 0;

    // Analyze each customer's subscription status
    for (const customer of customersResponse.items) {
      const customerData = customer as any;
      
      // Check for active subscriptions through entitlements
      if (customerData.entitlements && Object.keys(customerData.entitlements).length > 0) {
        const now = new Date();
        
        for (const [entitlementKey, entitlement] of Object.entries(customerData.entitlements) as [string, any][]) {
          const expiresAt = entitlement.expiresAt ? new Date(entitlement.expiresAt) : null;
          
          // Check if subscription is active (no expiry or expiry is in the future)
          const isActive = !expiresAt || expiresAt > now;
          const isLifetime = !expiresAt && entitlement.purchaseDate;
          
          if (isActive) {
            if (isLifetime) {
              lifetimeCount++;
            } else {
              activeCount++;
            }
            
            activeSubscriptions.push({
              customerId: customer.id!,
              appUserId: customerData.appUserId || customer.id!,
              productIdentifier: entitlement.productIdentifier,
              expiresAt: entitlement.expiresAt,
              willRenew: entitlement.willRenew,
              store: entitlement.store,
              entitlements: [entitlementKey]
            });
          } else {
            expiredCount++;
          }
        }
      }
      
      // Also check subscriptions array if available
      if (customerData.subscriptions && Array.isArray(customerData.subscriptions)) {
        for (const subscription of customerData.subscriptions) {
          const expiresAt = subscription.expiresDate ? new Date(subscription.expiresDate) : null;
          const now = new Date();
          
          if (!expiresAt || expiresAt > now) {
            // Check if we already have this subscription
            const existing = activeSubscriptions.find(
              sub => sub.customerId === customer.id && sub.productIdentifier === subscription.productIdentifier
            );
            
            if (!existing) {
              activeSubscriptions.push({
                customerId: customer.id!,
                appUserId: customerData.appUserId || customer.id!,
                subscriptionId: subscription.id,
                productIdentifier: subscription.productIdentifier,
                expiresAt: subscription.expiresDate,
                willRenew: subscription.willRenew,
                store: subscription.store,
                entitlements: []
              });
              activeCount++;
            }
          }
        }
      }
    }

    // Display summary
    console.log('=== SUBSCRIPTION SUMMARY ===\n');
    console.log(`Total Active Subscriptions: ${activeCount}`);
    console.log(`Lifetime Purchases: ${lifetimeCount}`);
    console.log(`Expired Subscriptions: ${expiredCount}`);
    console.log(`Total Active (including lifetime): ${activeCount + lifetimeCount}\n`);

    // Display active subscriptions
    if (activeSubscriptions.length > 0) {
      console.log('=== ACTIVE SUBSCRIPTIONS ===\n');
      
      activeSubscriptions.forEach((subscription, index) => {
        console.log(`${index + 1}. Customer: ${subscription.appUserId}`);
        console.log(`   Product: ${subscription.productIdentifier || 'N/A'}`);
        
        if (subscription.expiresAt) {
          const expiryDate = new Date(subscription.expiresAt);
          const daysRemaining = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          console.log(`   Expires: ${subscription.expiresAt} (${daysRemaining} days remaining)`);
          console.log(`   Will Renew: ${subscription.willRenew ? 'Yes' : 'No'}`);
        } else {
          console.log(`   Type: Lifetime Purchase`);
        }
        
        if (subscription.store) {
          console.log(`   Store: ${subscription.store}`);
        }
        
        if (subscription.entitlements.length > 0) {
          console.log(`   Entitlements: ${subscription.entitlements.join(', ')}`);
        }
        
        console.log('');
      });

      // Group by product
      console.log('=== SUBSCRIPTIONS BY PRODUCT ===\n');
      const productGroups = activeSubscriptions.reduce((acc, sub) => {
        const product = sub.productIdentifier || 'Unknown';
        if (!acc[product]) {
          acc[product] = [];
        }
        acc[product].push(sub);
        return acc;
      }, {} as Record<string, ActiveSubscription[]>);

      Object.entries(productGroups).forEach(([product, subs]) => {
        console.log(`${product}: ${subs?.length || 0} subscribers`);
      });

      // Revenue metrics (simplified)
      console.log('\n=== RENEWAL STATUS ===\n');
      const willRenewCount = activeSubscriptions.filter(sub => sub.willRenew === true).length;
      const willNotRenewCount = activeSubscriptions.filter(sub => sub.willRenew === false).length;
      const unknownRenewalCount = activeSubscriptions.filter(sub => sub.willRenew === undefined).length;
      
      console.log(`Will Renew: ${willRenewCount}`);
      console.log(`Will Not Renew: ${willNotRenewCount}`);
      console.log(`Unknown/Lifetime: ${unknownRenewalCount}`);
      
      if (willNotRenewCount > 0) {
        const churnRate = ((willNotRenewCount / (willRenewCount + willNotRenewCount)) * 100).toFixed(2);
        console.log(`\nPredicted Churn Rate: ${churnRate}%`);
      }
    }

    // Pagination reminder
    if ((customersResponse as any).hasMore) {
      console.log('\n⚠️  Note: There are more customers available. Implement pagination to fetch all.');
    }

  } catch (error: any) {
    console.error('Error fetching active subscriptions:', error);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', await error.response.text());
    }
  }
}

// Run the script
fetchActiveSubscriptions();