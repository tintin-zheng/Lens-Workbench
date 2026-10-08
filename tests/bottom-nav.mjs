import assert from 'node:assert/strict'
const { chromium } = await import(process.env.UI_ALIGNMENT_PLAYWRIGHT || 'playwright')
const browser = await chromium.launch({ headless: true, executablePath: process.env.UI_ALIGNMENT_CHROME })
let checks = 0
try {
  for (const width of [320, 375, 430, 620, 1194]) for (const colorScheme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width, height: 800 }, colorScheme })
    await page.addInitScript(() => { localStorage.setItem('currentUserId', '2'); localStorage.setItem('currentUserName', '张三') })
    await page.goto(process.env.UI_ALIGNMENT_URL || 'http://127.0.0.1:5181')
    await page.getByRole('heading', { name: '器材管理', exact: true }).waitFor()
    const nav = page.locator('.primary-nav')
    for (const label of ['器材', '任务', '记录', '我的', '记录', '器材']) {
      await nav.getByRole('button', { name: label, exact: true }).click()
      await page.waitForTimeout(340)
      if (width > 620) { assert.equal(await page.locator('.primary-nav-slider-track').isVisible(), false); continue }
      const geometry = await nav.evaluate(root => {
        const slider = root.querySelector('.primary-nav-slider').getBoundingClientRect()
        const button = root.querySelector('[aria-pressed=true]')
        const rect = button.getBoundingClientRect()
        const icon = button.querySelector('.primary-nav-icon').getBoundingClientRect()
        const text = button.lastElementChild.getBoundingClientRect()
        return { dx: Math.abs(slider.x + slider.width / 2 - rect.x - rect.width / 2), dy: Math.abs(slider.y + slider.height / 2 - rect.y - rect.height / 2), iconX: Math.abs(slider.x + slider.width / 2 - icon.x - icon.width / 2), textX: Math.abs(slider.x + slider.width / 2 - text.x - text.width / 2), groupY: Math.abs(slider.y + slider.height / 2 - (icon.top + text.bottom) / 2), bg: getComputedStyle(button).backgroundColor }
      })
      for (const key of ['dx', 'dy', 'iconX', 'textX', 'groupY']) assert.ok(geometry[key] < .6, `${width}/${colorScheme}/${label}: ${JSON.stringify(geometry)}`)
      assert.equal(geometry.bg, 'rgba(0, 0, 0, 0)')
      checks++
    }
    if (width <= 620) {
      const start = await page.locator('.primary-nav-slider').evaluate(el => el.getBoundingClientRect().x)
      await nav.getByRole('button', { name: '我的', exact: true }).click()
      await page.waitForTimeout(70)
      const middle = await page.locator('.primary-nav-slider').evaluate(el => el.getBoundingClientRect().x)
      await page.waitForTimeout(300)
      const end = await page.locator('.primary-nav-slider').evaluate(el => el.getBoundingClientRect().x)
      assert.ok(start < middle && middle < end, 'Slider must move continuously, not jump')
      if (width === 375 && process.env.NAV_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.NAV_SCREENSHOT_DIR}/nav-web-${colorScheme}.png` })
    }
    await page.close()
  }
  console.log(`PASS: ${checks} mobile centering checks, continuous animation, reverse navigation, light/dark and unchanged desktop navigation`)
} finally { await browser.close() }
