import { AbstractFulfillmentProvider, type FulfillmentOption } from '@medusajs/framework/utils'

/**
 * Manual fulfillment provider — the merchant handles shipping themselves.
 * This is the default for MVP; real carriers (USPS/DHL/etc.) plug in later.
 */
class ManualFulfillmentProvider extends AbstractFulfillmentProvider {
  static identifier = 'manual'

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    return [{ id: 'manual-fulfillment', name: 'Manual Fulfillment' }]
  }

  async validateFulfillmentData(
    _optionData: Record<string, unknown>,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return data
  }

  async validateOption(_data: Record<string, unknown>): Promise<boolean> {
    return true
  }

  async canCalculate(_data: Record<string, unknown>): Promise<boolean> {
    return true
  }

  async calculatePrice(
    _optionData: Record<string, unknown>,
    data: Record<string, unknown>,
  ): Promise<number> {
    return (data.price as number) ?? 0
  }

  async createFulfillment(
    _data: Record<string, unknown>,
    _items: Record<string, unknown>[],
    _order: Record<string, unknown>,
    _fulfillment: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return {}
  }

  async cancelFulfillment(_fulfillment: Record<string, unknown>): Promise<Record<string, unknown>> {
    return {}
  }

  async createReturnFulfillment(
    _fulfillment: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return {}
  }
}

export default ManualFulfillmentProvider
