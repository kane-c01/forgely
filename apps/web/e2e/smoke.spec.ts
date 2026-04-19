import { expect, test } from '@playwright/test'

test.describe('forgely.com smoke', () => {
  test('home (/) responds 200 and shows hero copy', async ({ page }) => {
    const response = await page.goto('/')
    expect(response, 'navigation response').not.toBeNull()
    expect(response!.status(), 'home status').toBeLessThan(400)
    await expect(page).toHaveTitle(/Forgely/i)
  })

  test('Chinese locale (/zh) renders without 500', async ({ page }) => {
    const response = await page.goto('/zh')
    expect(response, 'zh navigation response').not.toBeNull()
    expect(response!.status(), '/zh status').toBeLessThan(500)
  })

  test('English locale (/en) renders without 500', async ({ page }) => {
    const response = await page.goto('/en')
    expect(response, 'en navigation response').not.toBeNull()
    expect(response!.status(), '/en status').toBeLessThan(500)
  })

  test('robots.txt is served', async ({ request }) => {
    const response = await request.get('/robots.txt')
    expect(response.status(), 'robots status').toBeLessThan(400)
  })
})
