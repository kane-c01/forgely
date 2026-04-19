export const wcStorefrontProducts = [
  {
    id: 24,
    name: 'Hoodie',
    slug: 'hoodie',
    permalink: 'https://woo.example.com/product/hoodie/',
    description: '<p>A cozy <em>hoodie</em>.</p>',
    short_description: '<p>Cozy.</p>',
    sku: 'HOOD-1',
    prices: {
      currency_code: 'USD',
      currency_minor_unit: 2,
      price: '4500',
      regular_price: '5000',
      sale_price: '4500',
    },
    is_in_stock: true,
    on_sale: true,
    images: [{ id: 1, src: 'https://woo.example.com/images/hoodie.jpg', alt: 'Hoodie' }],
    categories: [{ id: 5, name: 'Clothing', slug: 'clothing' }],
    tags: [{ id: 1, name: 'cozy', slug: 'cozy' }],
    type: 'simple',
    parent: 0,
  },
  {
    id: 25,
    name: 'T-Shirt',
    slug: 't-shirt',
    permalink: 'https://woo.example.com/product/t-shirt/',
    description: '<p>Soft tee.</p>',
    short_description: null,
    sku: null,
    prices: {
      currency_code: 'USD',
      currency_minor_unit: 2,
      price: '1995',
      regular_price: '1995',
      sale_price: '1995',
    },
    is_in_stock: false,
    images: [],
    categories: [{ id: 5, name: 'Clothing', slug: 'clothing' }],
    tags: [],
    type: 'simple',
    parent: 0,
  },
]

export const wcStorefrontCategories = [
  {
    id: 5,
    name: 'Clothing',
    slug: 'clothing',
    description: 'Wearable goods',
    count: 2,
    permalink: 'https://woo.example.com/product-category/clothing/',
    image: { src: 'https://woo.example.com/images/clothing.jpg', alt: 'Clothing' },
  },
]

export const wcShopHtml = `
<!doctype html>
<html lang="en">
<head>
<title>Woo Demo Shop</title>
<meta name="generator" content="WooCommerce 8.4">
</head>
<body class="woocommerce">
  <ul class="products">
    <li class="product">
      <a href="https://woo.example.com/product/hoodie/" class="woocommerce-LoopProduct-link">
        <img src="https://woo.example.com/images/hoodie.jpg" alt="Hoodie" />
        <h2 class="woocommerce-loop-product__title">Hoodie</h2>
        <span class="price"><span class="amount">$45.00</span></span>
      </a>
    </li>
    <li class="product">
      <a href="/product/t-shirt/" class="woocommerce-LoopProduct-link">
        <img src="/images/tshirt.jpg" alt="T-shirt" />
        <h2 class="woocommerce-loop-product__title">T-Shirt</h2>
        <span class="price"><span class="amount">$19.95</span></span>
      </a>
    </li>
  </ul>
</body>
</html>
`

export const wcHomepageHtml = `
<!doctype html><html lang="en">
<head>
<title>Woo Demo Shop</title>
<meta property="og:site_name" content="Woo Demo">
<meta name="description" content="A WooCommerce demo store.">
<link rel="stylesheet" href="/wp-content/plugins/woocommerce/assets/css/woocommerce.css">
</head>
<body class="woocommerce-page"><h1>Welcome</h1></body>
</html>
`
