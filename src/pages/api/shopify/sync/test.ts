import 'dotenv/config';

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const locationId = process.env.SHOPIFY_LOCATION_ID;

async function testShopifyConnection() {
  console.log('Testing Shopify GraphQL Admin API connection...\n');

  if (!domain || !token || !locationId) {
    console.error('❌ Missing environment variables in .env:');
    console.table({ domain: !!domain, token: !!token, locationId: !!locationId });
    process.exit(1);
  }

  const query = `
    query TestConnection($locationId: ID!) {
      shop {
        name
        myshopifyDomain
        currencyCode
        plan {
          displayName
        }
      }
      location(id: $locationId) {
        id
        name
        isActive
      }
      products(first: 1) {
        nodes {
          id
          title
        }
      }
    }
  `;

  try {
    const res = await fetch(`https://${domain}/admin/api/2026-07/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({
        query,
        variables: { locationId },
      }),
    });

    const result = await res.json();

    if (result.errors) {
      console.error('❌ GraphQL Errors:', JSON.stringify(result.errors, null, 2));
      return;
    }

    if (!res.ok) {
      console.error(`❌ HTTP Error ${res.status}:`, result);
      return;
    }

    const { shop, location, products } = result.data;

    console.log(' Store Connected:');
    console.log(`   - Name: ${shop.name}`);
    console.log(`   - Domain: ${shop.myshopifyDomain}`);
    console.log(`   - Plan: ${shop.plan.displayName}`);
    console.log(`   - Currency: ${shop.currencyCode}`);

    if (location) {
      console.log('\n Location Verified:');
      console.log(`   - Name: ${location.name}`);
      console.log(`   - ID: ${location.id}`);
      console.log(`   - Active: ${location.isActive}`);
    } else {
      console.warn('\n⚠️ Location ID did not return a valid location. Double-check your SHOPIFY_LOCATION_ID.');
    }

    console.log(`\n Access Scopes: Product access working (${products.nodes.length} existing products found).`);
    console.log('\n All credentials are valid. Ready for sync.');
  } catch (err) {
    console.error('❌ Connection failed:', err);
  }
}

testShopifyConnection();