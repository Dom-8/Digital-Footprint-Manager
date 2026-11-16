import {test,expect} from '@playwright/test';
const archive={type:'OrderedCollection',orderedItems:[{type:'Create',object:{type:'Note',id:'https://social.example/users/a/statuses/1',published:'2026-01-01T00:00:00Z',content:'<p>access code: 1234</p>',to:['https://www.w3.org/ns/activitystreams#Public']}}]};
test.beforeEach(async({page})=>{
await page.route('**/api/connection?**',route=>route.fulfill({json:{configured:false,connected:false,missing:['MASTODON_CLIENT_ID']}}));
await page.goto('/');await page.getByRole('button',{name:'Close dialog'}).click();
await expect(page.getByRole('heading',{name:'Welcome back, Alex.'})).toBeVisible();
});
test('latest career wins, decisions survive and priority outlines have labels',async({page})=>{
await page.goto('/#/review');
const first=page.locator('.post-row').filter({hasText:'Class 4B'});await expect(first).toHaveClass(/priority-high/);
await first.getByRole('button',{name:/Class 4B/}).click();await page.getByRole('dialog').getByRole('button',{name:'Mark reviewed',exact:true}).click();await page.keyboard.press('Escape');
await expect(first).toHaveClass(/priority-neutral/);await expect(first.getByText('Reviewed',{exact:true}).first()).toBeVisible();
await page.getByRole('button',{name:'Choose career and industry'}).first().click();await page.getByLabel('Search careers').fill('Software Developer');await page.getByRole('dialog').getByRole('button',{name:'Software Developer',exact:true}).click();
await page.getByRole('button',{name:'Choose career and industry'}).first().click();await page.getByLabel('Search careers').fill('Civil Engineer');await page.getByRole('dialog').getByRole('button',{name:'Civil Engineer',exact:true}).first().click();
await expect(page.locator('.analysis-status')).toContainText('Analysis completed for Civil Engineer');await expect(page.locator('.analysis-status')).not.toContainText('Software Developer');
await expect(first.getByText('Reviewed',{exact:true}).first()).toBeVisible();await expect(first.getByText('Assessment changed · decision kept')).toBeVisible();
await page.reload();await expect(first).toHaveClass(/priority-neutral/);await expect(page.locator('.analysis-status')).toContainText('Civil Engineer');
});
test('official archive import, source isolation, PDF/CSV and deletion',async({page})=>{
await page.goto('/#/platforms');await expect(page.getByText('Setup required',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Authorise with Mastodon'})).toBeDisabled();
await page.getByLabel('Import outbox.json').setInputFiles({name:'outbox.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(archive))});
await expect(page.getByText('1 imported posts saved in this browser.',{exact:false})).toBeVisible();
await page.goto('/#/review');await expect(page.locator('.post-row')).toHaveCount(1);await expect(page.locator('.post-row')).toContainText('access code: 1234');
await page.getByRole('link',{name:'Report this filtered view'}).click();await expect(page.locator('.report')).toContainText('imported data');
const pdfWait=page.waitForEvent('download');await page.getByRole('button',{name:'Download PDF'}).click();const pdf=await pdfWait;expect(pdf.suggestedFilename()).toMatch(/\.pdf$/);const stream=await pdf.createReadStream();const chunks:Buffer[]=[];for await(const chunk of stream!)chunks.push(Buffer.from(chunk));expect(Buffer.concat(chunks).subarray(0,5).toString()).toBe('%PDF-');
const csvWait=page.waitForEvent('download');await page.getByRole('button',{name:'Export CSV'}).click();const csv=await csvWait;expect(csv.suggestedFilename()).toMatch(/\.csv$/);
const cs=await csv.createReadStream();const cc:Buffer[]=[];for await(const chunk of cs!)cc.push(Buffer.from(chunk));const content=Buffer.concat(cc).toString();expect(content).toContain('access code: 1234');expect(content).not.toContain('Class 4B');
await page.goto('/#/platforms');await page.getByRole('button',{name:'Connected account',exact:true}).click();await page.goto('/#/review');await expect(page.locator('.post-row')).toHaveCount(0);
await page.goto('/#/platforms');page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Delete imported data'}).click();await expect(page.getByText('0 imported posts saved in this browser.',{exact:false})).toBeVisible();
});
test('connection failures keep connected source empty and show recovery',async({page})=>{
await page.unroute('**/api/connection?**');await page.route('**/api/connection?**',route=>route.request().url().includes('action=status')?route.fulfill({json:{configured:true,connected:true,account:'test',instance:'https://social.example'}}):route.fulfill({status:429,json:{error:'Mastodon rate limit reached.',retryAfter:30}}));
await page.reload();await page.goto('/#/platforms');await page.getByRole('button',{name:'Connected account',exact:true}).click();await expect(page.getByRole('button',{name:'Load latest posts'})).toBeVisible();await page.getByRole('button',{name:'Load latest posts'}).click();await expect(page.getByRole('alert')).toContainText('Retry after 30 seconds');await page.goto('/#/review');await expect(page.locator('.post-row')).toHaveCount(0);
});
