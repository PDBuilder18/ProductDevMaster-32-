import crypto from 'crypto';
import { AuthUser } from '../middleware/auth';

export interface ShopifyCustomer {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  verified_email: boolean;
  metafields?: { [key: string]: any };
}

export interface ShopifyConfig {
  shopDomain: string;
  storefrontAccessToken: string;
  webhookSecret?: string;
}

export class ShopifyService {
  private config: ShopifyConfig;

  constructor(config: ShopifyConfig) {
    this.config = config;
  }

  // Validate Shopify customer session
  async validateCustomerSession(customerId: string, email?: string): Promise<ShopifyCustomer | null> {
    try {
      // Query Shopify Storefront API to validate customer
      const query = `
        query GetCustomer($id: ID!) {
          customer(id: $id) {
            id
            email
            firstName
            lastName
            verifiedEmail
          }
        }
      `;

      const response = await fetch(`https://${this.config.shopDomain}/api/2023-10/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': this.config.storefrontAccessToken,
        },
        body: JSON.stringify({
          query,
          variables: { id: `gid://shopify/Customer/${customerId}` }
        }),
      });

      const data = await response.json();

      if (data.data?.customer) {
        const customer = data.data.customer;
        return {
          id: customerId,
          email: customer.email,
          first_name: customer.firstName,
          last_name: customer.lastName,
          verified_email: customer.verifiedEmail,
        };
      }

      return null;
    } catch (error) {
      console.error('Shopify customer validation failed:', error);
      return null;
    }
  }

  // Convert Shopify customer to AuthUser
  shopifyCustomerToAuthUser(customer: ShopifyCustomer): AuthUser {
    return {
      id: `shopify_${customer.id}`,
      email: customer.email,
      provider: 'shopify',
      providerData: {
        shopifyId: customer.id,
        firstName: customer.first_name,
        lastName: customer.last_name,
        verifiedEmail: customer.verified_email,
      },
    };
  }

  // Store PDBuilder session data in Shopify customer metafields
  async updateCustomerMetafields(customerId: string, pdbuilderData: any): Promise<boolean> {
    try {
      // This would require Admin API access in a real implementation
      // For now, we'll use the webhook/app integration approach
      console.log('Storing PDBuilder data for customer:', customerId, pdbuilderData);
      
      // In a real implementation, this would use Shopify Admin API:
      // const mutation = `
      //   mutation customerUpdate($input: CustomerInput!) {
      //     customerUpdate(input: $input) {
      //       customer {
      //         id
      //         metafields(first: 10) {
      //           edges {
      //             node {
      //               namespace
      //               key
      //               value
      //             }
      //           }
      //         }
      //       }
      //       userErrors {
      //         field
      //         message
      //       }
      //     }
      //   }
      // `;

      return true;
    } catch (error) {
      console.error('Failed to update customer metafields:', error);
      return false;
    }
  }

  // Get PDBuilder session data from Shopify customer metafields
  async getCustomerMetafields(customerId: string): Promise<any> {
    try {
      // In a real implementation, this would fetch from Shopify Admin API
      console.log('Fetching PDBuilder data for customer:', customerId);
      return null;
    } catch (error) {
      console.error('Failed to fetch customer metafields:', error);
      return null;
    }
  }

  // Validate Shopify webhook signature
  validateWebhookSignature(body: string, signature: string): boolean {
    if (!this.config.webhookSecret) return false;

    const hmac = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(body, 'utf8')
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'base64'),
      Buffer.from(hmac, 'base64')
    );
  }

  // Generate Shopify embedded app URL for PDBuilder
  generateEmbeddedAppUrl(customerId: string, sessionId?: string): string {
    // Mask the base URL in logs - use environment variable or fallback
    const baseUrl = process.env.REPLIT_DEV_DOMAIN || process.env.APP_URL?.replace(/^https?:\/\//, '') || 'masked-domain';
    const params = new URLSearchParams({
      shopify_customer_id: customerId,
      embedded: 'true',
    });

    if (sessionId) {
      params.append('session_id', sessionId);
    }

    return `https://${baseUrl}/embedded?${params.toString()}`;
  }

  // Create Liquid template snippet for embedding PDBuilder
  generateLiquidSnippet(customerId?: string): string {
    const embedUrl = customerId 
      ? this.generateEmbeddedAppUrl(customerId)
      : this.generateEmbeddedAppUrl('{{ customer.id }}');

    return `
{% comment %}
  PDBuilder Embedded App Integration
  Add this to your customer account page or a custom page
{% endcomment %}

{% if customer %}
  <div id="pdbuilder-container" style="width: 100%; min-height: 600px;">
    <iframe 
      src="${embedUrl}"
      width="100%" 
      height="600px" 
      frameborder="0"
      style="border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    </iframe>
  </div>
{% else %}
  <div style="text-align: center; padding: 2rem; background: #f8f9fa; border-radius: 8px;">
    <p>Please <a href="/account/login">log in</a> to access the PDBuilder app.</p>
  </div>
{% endif %}

<script>
  // Optional: Handle iframe communication for better UX
  window.addEventListener('message', function(event) {
    // Validate origin without exposing internal URLs in generated code
    const allowedOrigin = '${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : window.location.origin}';
    if (event.origin !== allowedOrigin) return;
    
    if (event.data.type === 'pdbuilder_resize') {
      const iframe = document.querySelector('#pdbuilder-container iframe');
      if (iframe && event.data.height) {
        iframe.style.height = event.data.height + 'px';
      }
    }
  });
</script>
    `.trim();
  }
}

export const createShopifyService = (config: ShopifyConfig) => new ShopifyService(config);