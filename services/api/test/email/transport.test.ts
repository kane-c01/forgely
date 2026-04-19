import { afterEach, describe, expect, it } from 'vitest'

import { ConsoleTransport, getEmailTransport, setEmailTransport } from '../../src/email/index.js'

afterEach(() => setEmailTransport(null))

describe('email/transport', () => {
  it('falls back to ConsoleTransport when RESEND_API_KEY is unset', async () => {
    delete process.env.RESEND_API_KEY
    setEmailTransport(null)
    const transport = getEmailTransport()
    expect(transport.name).toBe('console')
  })

  it('ConsoleTransport buffers messages so tests can assert on them', async () => {
    const transport = new ConsoleTransport()
    setEmailTransport(transport)
    const r = await getEmailTransport().send({
      to: 'jane@forgely.test',
      subject: 'hello',
      html: '<p>hi</p>',
    })
    expect(r.id).toMatch(/^mock_/)
    expect(transport.getRecentMessages().length).toBe(1)
    expect(transport.getRecentMessages()[0]?.subject).toBe('hello')
  })
})
