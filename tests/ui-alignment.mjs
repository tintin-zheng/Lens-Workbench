import assert from 'node:assert/strict'
// Run against the local mock-data dev server. Install Playwright separately,
// or point UI_ALIGNMENT_PLAYWRIGHT at an existing runtime module.
const { chromium } = await import(process.env.UI_ALIGNMENT_PLAYWRIGHT || 'playwright')
const browser = await chromium.launch({ headless: true, executablePath: process.env.UI_ALIGNMENT_CHROME || undefined })
let checks = 0
try {
  for (const width of [375, 430, 1194]) for (const colorScheme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width, height: 800 }, colorScheme })
    await page.addInitScript(() => { localStorage.setItem('currentUserId', '2'); localStorage.setItem('currentUserName', '张三') })
    await page.goto(process.env.UI_ALIGNMENT_URL || 'http://127.0.0.1:5173')
    await page.getByRole('heading', { name: '器材管理', exact: true }).waitFor()
    for (const [primary, labels] of [['器材', ['全部', '可借', '已借出']], ['记录', ['借还记录', '任务记录']], ['我的', ['器材借用', '参与任务']]]) {
      await page.locator('.primary-nav').getByRole('button', { name: primary, exact: true }).click()
      for (const label of labels) {
        await page.locator('.status-tabs').getByRole('button', { name: label, exact: true }).click()
        await page.waitForTimeout(320)
        const delta = await page.locator('.status-tabs').evaluate(root => {
          const slider = root.querySelector('.status-slider').getBoundingClientRect()
          const text = root.querySelector('[aria-pressed="true"] span').getBoundingClientRect()
          return { x: Math.abs(slider.x + slider.width / 2 - text.x - text.width / 2), y: Math.abs(slider.y + slider.height / 2 - text.y - text.height / 2) }
        })
        assert.ok(delta.x < 1 && delta.y < 1, `${width}/${colorScheme}/${label}: ${JSON.stringify(delta)}`)
        checks++
      }
    }
    await page.locator('.primary-nav').getByRole('button', { name: '器材', exact: true }).click()
    await page.locator('.status-tabs[data-animate="false"]').waitFor()
    await page.getByRole('button', { name: '录入单件器材', exact: true }).click()
    let dialog = page.getByRole('dialog')
    await dialog.waitFor()
    assert.equal(Math.round((await dialog.boundingBox()).width), Math.min(width - 36, 420))
    assert.equal(await dialog.locator('.submit-equipment').evaluate(el => el.getBoundingClientRect().height), 48)
    if (process.env.UI_ALIGNMENT_SCREENSHOTS) await page.screenshot({ path: `${process.env.UI_ALIGNMENT_SCREENSHOTS}/web-form-${width}-${colorScheme}.png` })
    await dialog.getByRole('button', { name: '关闭', exact: true }).click()
    await page.getByRole('button', { name: '录入 Kit', exact: true }).click()
    dialog = page.getByRole('dialog')
    await page.setViewportSize({ width, height: 420 })
    await page.waitForTimeout(100)
    const scroll = await dialog.evaluate(el => {
      const body = el.querySelector('.form-body')
      const head = el.querySelector('.form-title').getBoundingClientRect().top
      const footer = el.querySelector('.submit-equipment').getBoundingClientRect().top
      body.scrollTop = 1000
      return { scrollable: body.scrollHeight > body.clientHeight, head, newHead: el.querySelector('.form-title').getBoundingClientRect().top, footer, newFooter: el.querySelector('.submit-equipment').getBoundingClientRect().top, bottom: el.getBoundingClientRect().bottom }
    })
    assert.ok(scroll.scrollable)
    assert.equal(scroll.head, scroll.newHead)
    assert.equal(scroll.footer, scroll.newFooter)
    assert.ok(scroll.bottom <= 420)
    await page.keyboard.press('Escape')
    await page.getByRole('dialog').waitFor({ state: 'hidden' })
    await page.setViewportSize({ width, height: 800 })
    await page.locator('.primary-nav').getByRole('button', { name: '任务', exact: true }).click()
    await page.getByRole('button', { name: '发布新任务', exact: true }).click()
    await page.getByRole('dialog', { name: '任务表单' }).waitFor()
    if (process.env.UI_ALIGNMENT_SCREENSHOTS) await page.screenshot({ path: `${process.env.UI_ALIGNMENT_SCREENSHOTS}/web-task-${width}-${colorScheme}.png` })
    await page.close()
  }
  console.log(`PASS: ${checks} centered filter states, page-entry reset, 6 equipment/Kit/task dialogs, fixed Kit header/footer, small viewport, Escape and light/dark layouts`)
} finally { await browser.close() }
