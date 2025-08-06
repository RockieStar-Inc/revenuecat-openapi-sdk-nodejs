# Fetch Subscribers Example

This example demonstrates how to use the RevenueCat OpenAPI SDK to fetch a list of subscribers/customers from your RevenueCat project.

## Setup

1. Install dependencies:
```bash
npm install
# or
bun install
```

2. Configure your API credentials:
```bash
cp .env.example .env
```

Then edit `.env` and add your:
- `REVENUECAT_API_KEY`: Your RevenueCat Private API key (found in Project Settings > API Keys)
- `REVENUECAT_PROJECT_ID`: Your RevenueCat Project ID

## Running the Example

```bash
npm start
# or
bun start
```

## Features Demonstrated

- Initializing the SDK with API credentials
- Fetching a paginated list of customers/subscribers
- Displaying customer information including:
  - Customer ID
  - App User ID
  - Creation date
  - Last seen date
  - Active entitlements
- Handling pagination for large subscriber lists

## API Reference

The example uses the `CustomerApi.listCustomers()` method which accepts:
- `projectId` (required): Your RevenueCat project ID
- `startingAfter` (optional): Cursor for pagination
- `limit` (optional): Number of records per page (max 100)

## Error Handling

The example includes error handling for:
- Missing environment variables
- API request failures
- Response parsing errors

## Next Steps

You can extend this example to:
- Implement full pagination to fetch all subscribers
- Filter subscribers by specific criteria
- Export subscriber data to CSV/JSON
- Fetch detailed information for specific customers
- Check subscription status and entitlements