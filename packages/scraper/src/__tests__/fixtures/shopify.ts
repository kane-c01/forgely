export const shopifyProductsPage1 = {
  products: [
    {
      id: 1001,
      title: 'Forge Hammer',
      handle: 'forge-hammer',
      body_html: '<p>A heavy <strong>steel</strong> hammer.</p>',
      vendor: 'Forgely Tools',
      product_type: 'Tools',
      tags: 'steel, premium, bestseller',
      variants: [
        {
          id: 9001,
          title: 'Default',
          price: '49.95',
          compare_at_price: '69.95',
          sku: 'FH-001',
          available: true,
          inventory_quantity: 12,
          option1: 'Default',
        },
      ],
      images: [
        {
          src: 'https://cdn.shopify.com/s/files/forge-hammer-1.jpg',
          alt: 'Forge Hammer',
          width: 800,
          height: 800,
        },
      ],
      options: [{ name: 'Title', values: ['Default'] }],
    },
    {
      id: 1002,
      title: 'Anvil',
      handle: 'anvil',
      body_html: '<p>Cast iron anvil.</p>',
      vendor: 'Forgely Tools',
      product_type: 'Tools',
      tags: ['cast-iron', 'heavy'],
      variants: [
        {
          id: 9002,
          title: 'Small',
          price: 199,
          compare_at_price: null,
          sku: 'AN-S',
          available: false,
          option1: 'Small',
        },
        {
          id: 9003,
          title: 'Large',
          price: 299,
          compare_at_price: null,
          sku: 'AN-L',
          available: true,
          option1: 'Large',
        },
      ],
      images: [
        {
          src: '//cdn.shopify.com/anvil.jpg',
          alt: null,
          width: 1024,
          height: 768,
        },
      ],
      options: [{ name: 'Size', values: ['Small', 'Large'] }],
    },
  ],
}

export const shopifyProductsPage2 = {
  products: [
    {
      id: 1003,
      title: 'Bellows',
      handle: 'bellows',
      body_html: 'Hand-crafted bellows.',
      vendor: 'Forgely Tools',
      product_type: 'Tools',
      tags: '',
      variants: [
        {
          id: 9004,
          title: 'Default',
          price: '129.00',
          compare_at_price: null,
          sku: 'BL-001',
          available: true,
          option1: 'Default',
        },
      ],
      images: [],
      options: [{ name: 'Title', values: ['Default'] }],
    },
  ],
}

export const shopifyCollections = {
  collections: [
    {
      id: 5001,
      handle: 'forging',
      title: 'Forging Essentials',
      description: 'Tools for the modern blacksmith.',
      products_count: 3,
      image: {
        src: 'https://cdn.shopify.com/s/files/coll-forging.jpg',
        alt: 'Forging',
        width: 1200,
        height: 600,
      },
    },
  ],
}

export const shopifyMeta = {
  shop: {
    name: 'Forgely Demo Store',
    currency: 'USD',
    money_format: '${{amount}}',
  },
}
