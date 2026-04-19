import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/forgely',
    databaseLogging: process.env.NODE_ENV === 'development',
    databaseDriverOptions:
      process.env.NODE_ENV === 'production'
        ? { connection: { ssl: { rejectUnauthorized: false } } }
        : {},
    http: {
      storeCors: process.env.STORE_CORS ?? 'http://localhost:3000,http://localhost:3002',
      adminCors: process.env.ADMIN_CORS ?? 'http://localhost:3001,http://localhost:7001',
      authCors:
        process.env.AUTH_CORS ??
        'http://localhost:3000,http://localhost:3001,http://localhost:3002',
      jwtSecret: process.env.JWT_SECRET ?? 'forgely-jwt-secret-change-in-prod',
      cookieSecret: process.env.COOKIE_SECRET ?? 'forgely-cookie-secret-change-in-prod',
    },
    redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },

  admin: {
    backendUrl: process.env.MEDUSA_BACKEND_URL ?? 'http://localhost:9000',
    path: '/app',
  },

  modules: [
    // ---- Forgely custom modules ----
    {
      resolve: './src/modules/forgely-tenant',
    },
    {
      resolve: './src/modules/forgely-asset',
    },
    {
      resolve: './src/modules/forgely-theme',
    },
    {
      resolve: './src/modules/forgely-gen',
    },
    {
      resolve: './src/modules/forgely-ai',
    },

    // ---- Payment providers ----
    {
      resolve: '@medusajs/medusa/payment',
      options: {
        providers: [
          {
            resolve: './src/providers/payment-stripe',
            id: 'stripe',
            options: {
              apiKey: process.env.STRIPE_API_KEY ?? '',
            },
          },
          {
            resolve: './src/providers/payment-paypal',
            id: 'paypal',
            options: {
              clientId: process.env.PAYPAL_CLIENT_ID ?? '',
              clientSecret: process.env.PAYPAL_CLIENT_SECRET ?? '',
              sandbox: process.env.NODE_ENV !== 'production',
            },
          },
          {
            resolve: './src/providers/payment-wechat-pay',
            id: 'wechat-pay',
            options: {
              appId: process.env.WECHAT_PAY_APP_ID ?? '',
              mchId: process.env.WECHAT_PAY_MCH_ID ?? '',
              apiKey: process.env.WECHAT_PAY_API_KEY ?? '',
              sandbox: process.env.NODE_ENV !== 'production',
            },
          },
          {
            resolve: './src/providers/payment-alipay',
            id: 'alipay',
            options: {
              appId: process.env.ALIPAY_APP_ID ?? '',
              privateKey: process.env.ALIPAY_PRIVATE_KEY ?? '',
              sandbox: process.env.NODE_ENV !== 'production',
            },
          },
          {
            resolve: './src/providers/payment-nowpayments',
            id: 'nowpayments',
            options: {
              apiKey: process.env.NOWPAYMENTS_API_KEY ?? '',
              ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET ?? '',
              sandbox: process.env.NODE_ENV !== 'production',
            },
          },
        ],
      },
    },

    // ---- Fulfillment providers ----
    {
      resolve: '@medusajs/medusa/fulfillment',
      options: {
        providers: [
          {
            resolve: './src/providers/fulfillment-manual',
            id: 'manual',
          },
        ],
      },
    },
  ],
})
