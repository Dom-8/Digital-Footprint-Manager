import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.route('**/api/connection?**',r=>r.fulfill({json:{configured:false,connected:false}}));});
test('tutorial replaces setup and teaches an actual saved review',async({page})=>{
await page.goto('/');const welcome=page.getByRole('dialog',{name:'Welcome to Digital Footprint Manager'});
await expect(welcome.getByRole('heading',{name:'Understand old posts. Decide your next step.'})).toBeVisible();
await expect(welcome.locator('select')).toHaveCount(0);
await welcome.getByRole('button',{name:'Try sample tutorial',exact:true}).click();
await expect(page.getByRole('region',{name:'Tutorial'})).toBeVisible();
await expect(page.getByRole('heading',{name:'First, choose the career you want to prepare for.'})).toBeVisible();
await page.getByRole('region',{name:'Tutorial'}).getByRole('button',{name:'Use this career'}).click();
const lens=page.getByRole('dialog',{name:'Context Lens'});await expect(lens).toBeVisible();
await expect(lens.getByText('Tutorial · Step 2 of 3',{exact:true})).toBeVisible();
await lens.getByLabel('Add your context').fill('This example needs the original conversation for context.');
await lens.getByRole('button',{name:'Save context',exact:true}).click();
await lens.getByRole('button',{name:'Mark reviewed',exact:true}).click();
await expect(page).toHaveURL(/#\/reports/);
await expect(page.getByRole('heading',{name:'Your decision is now reflected in your report.'})).toBeVisible();
await expect(page.locator('.report').getByText('Reviewed',{exact:true}).first()).toBeVisible();
await page.getByRole('button',{name:'Finish tutorial',exact:true}).click();
await expect(page.getByRole('region',{name:'Tutorial'})).toHaveCount(0);
await page.goto('/#/review');const row=page.locator('.post-row').filter({hasText:'Class 4B'});await expect(row).toHaveClass(/priority-neutral/);
await page.reload();await expect(row).toHaveClass(/priority-neutral/);
await page.getByRole('button',{name:'Start tutorial',exact:true}).click();await page.getByRole('button',{name:'Try sample tutorial',exact:true}).click();
await expect(page.getByRole('region',{name:'Tutorial'})).toBeVisible();
await page.getByRole('button',{name:'Exit tutorial'}).click();
await expect(page.getByRole('region',{name:'Tutorial'})).toHaveCount(0);
});
test('sidebar retracts, keeps route labels and persists; dashboard has visible charts and no dropdowns',async({page})=>{
await page.setViewportSize({width:1440,height:1100});await page.goto('/');await page.getByRole('button',{name:'Explore on my own'}).click();
await expect(page.getByRole('heading',{name:'Your history. Your next step.'})).toBeVisible();
await expect(page.locator('main select, main details, header select')).toHaveCount(0);
await expect(page.getByRole('heading',{name:'Your platforms and history'})).toBeVisible();
await expect(page.locator('.priority-wheel svg').first()).toBeVisible();
const wheel=await page.locator('.priority-overview').boundingBox(),history=await page.locator('.visible-insights').boundingBox();expect(wheel!.y).toBeLessThan(history!.y);
const headerBorder=await page.getByRole('banner',{name:'Page header'}).evaluate(el=>getComputedStyle(el).borderBottomWidth);expect(headerBorder).toBe('2px');
await page.getByRole('button',{name:'Collapse sidebar'}).click();
await expect(page.locator('.clarity-shell')).toHaveClass(/sidebar-collapsed/);
await expect(page.locator('#app-sidebar')).toBeHidden();await expect.poll(async()=>(await page.locator('.workspace').boundingBox())!.x).toBe(0);await page.getByRole('button',{name:'Expand sidebar'}).click();
await page.getByRole('link',{name:'Content Review',exact:true}).click();await expect(page.getByRole('heading',{name:'Content Review',exact:true})).toBeVisible();
await page.getByRole('button',{name:'Collapse sidebar'}).click();await page.reload();await expect(page.getByRole('button',{name:'Expand sidebar'})).toBeVisible();
await page.getByRole('button',{name:'Expand sidebar'}).click();await expect.poll(async()=>(await page.locator('#app-sidebar').boundingBox())!.width).toBeGreaterThan(200);
await page.getByRole('link',{name:'Dashboard',exact:true}).click();
await page.getByRole('button',{name:/^High priority: \d+ posts$/}).click();await expect(page.getByLabel('Priority',{exact:true})).toHaveValue('High priority');
await page.goto('/');await page.getByRole('button',{name:'Needs review',exact:true}).click();await expect(page.getByRole('button',{name:'Needs review',exact:true})).toHaveAttribute('aria-pressed','true');
await page.getByRole('button',{name:'More tools',exact:true}).click();await expect(page.getByRole('link',{name:'Historical Timeline',exact:true})).toBeVisible();
await page.setViewportSize({width:375,height:900});await page.getByRole('button',{name:'Open navigation',exact:true}).click();await expect(page.getByRole('button',{name:'Close menu',exact:true})).toBeFocused();await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Open navigation',exact:true})).toBeFocused();
expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
await page.screenshot({path:'screenshots/clear-dashboard-mobile.png',fullPage:true});
});
test('tutorial temporarily uses sample posts and restores the selected source on exit',async({page})=>{
await page.goto('/');await page.getByRole('button',{name:'Explore on my own'}).click();
await page.goto('/#/platforms');await page.getByRole('button',{name:'Imported archive',exact:true}).click();
await page.getByRole('button',{name:'Start tutorial',exact:true}).click();await page.getByRole('button',{name:'Try sample tutorial',exact:true}).click();
await expect(page.locator('.context-source')).toHaveText('Demo data');
await page.getByRole('button',{name:'Exit tutorial'}).click();
await expect(page.locator('.context-source')).toHaveText('Imported posts');
await expect(page.locator('main select, main details')).toHaveCount(0);
});

test('review actions clear posts immediately and undo restores them',async({page})=>{
await page.goto('/');await page.getByRole('button',{name:'Explore on my own'}).click();await page.goto('/#/review');
const row=page.locator('.post-row').filter({hasText:'Class 4B'});
await row.getByRole('button',{name:/Class 4B/}).click();await page.getByRole('dialog').getByRole('button',{name:'Dismiss',exact:true}).click();
await expect(page.getByRole('dialog')).toHaveCount(0);await expect(row).toHaveCount(0);
await page.locator('.toast').getByRole('button',{name:'Undo',exact:true}).click();await expect(row).toBeVisible();
await row.getByRole('button',{name:/Class 4B/}).click();await page.getByRole('dialog').getByRole('button',{name:'Follow up',exact:true}).click();await expect(row).toHaveCount(0);
await page.getByRole('button',{name:'Show processed posts'}).click();await expect(row).toContainText('Marked for follow-up');
});

test('personal setup validates details, resumes and requires real data',async({page})=>{
await page.goto('/');await page.getByRole('button',{name:'Start tutorial',exact:true}).last().click();
const setup=page.getByRole('region',{name:'Account setup'});
await setup.getByRole('button',{name:'Save details & continue'}).click();await expect(setup.getByLabel('Your name',{exact:true})).toBeVisible();
await setup.getByLabel('Your name',{exact:true}).fill('Robin Test');await setup.getByLabel('Email address',{exact:true}).fill('robin@example.com');await setup.getByRole('button',{name:'Save details & continue'}).click();
await expect(setup.getByRole('heading',{name:/What career/})).toContainText('Robin');await page.reload();await expect(setup.getByRole('heading',{name:/What career/})).toBeVisible();
await setup.getByRole('button',{name:'Continue to accounts'}).click();await expect(setup.getByText("Account connections aren't ready on this site yet.",{exact:true})).toBeVisible();
await expect(setup.getByRole('button',{name:'Continue with my posts'})).toBeDisabled();await expect(setup.getByRole('button',{name:'Demo data',exact:true})).toHaveCount(0);
await setup.getByRole('button',{name:'Save & exit'}).click();await page.getByRole('button',{name:'Tutorial',exact:true}).click();await expect(setup.getByRole('heading',{name:'Bring your own posts into the picture.'})).toBeVisible();
});

test('source buttons prompt connection and archive selection',async({page})=>{
await page.goto('/');await page.getByRole('button',{name:'Explore on my own'}).click();await page.goto('/#/platforms');
await page.getByRole('button',{name:'Connected account',exact:true}).click();
const dialog=page.getByRole('dialog',{name:'Connect your Mastodon account'});await expect(dialog).toBeVisible();await expect(dialog.getByRole('button',{name:'Check again',exact:true})).toBeVisible();
await dialog.getByRole('button',{name:'Close connection setup'}).click();await expect(dialog).toHaveCount(0);
const chooser=page.waitForEvent('filechooser');await page.getByRole('button',{name:'Imported archive',exact:true}).click();const picker=await chooser;expect(picker.isMultiple()).toBe(false);
});
