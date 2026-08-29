import 'dotenv/config';

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const locationId = process.env.SHOPIFY_LOCATION_ID;

async function testShopifyConnection() {
  console.log('🔍 Initiating Shopify Connection Test...\n');

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

    console.log('✅ Connection Successful!');
    console.log('=========================');
    console.log(`🏪 Shop Name: ${shop.name}`);
    console.log(`🌐 Domain: ${shop.myshopifyDomain}`);
    console.log(`💰 Currency: ${shop.currencyCode}`);
    console.log(`📈 Plan: ${shop.plan.displayName}`);

    if (location) {
      console.log(`\n📍 Location: ${location.name}`);
      console.log(`   Status: ${location.isActive ? 'Active' : 'Inactive'}`);
    } else {
      console.warn('\n⚠️ Location ID did not return a valid location. Double-check your SHOPIFY_LOCATION_ID.');
    }

    if (products?.nodes?.length > 0) {
      console.log(`\n📦 Sample Product Found: "${products.nodes[0].title}"`);
    } else {
      console.log('\n📦 Catalog: No products found in this store yet.');
    }

    console.log('\n✅ All systems nominal. Ready to sync.');

  } catch (err) {
    console.error('❌ Connection failed:', err);
  }
}

testShopifyConnection();