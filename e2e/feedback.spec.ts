import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.route('**/api/connection?**',r=>r.fulfill({json:{configured:false,connected:false}}));await page.goto('/');await page.getByRole('button',{name:'Explore on my own'}).click();});
test('profile and privacy review uses manual records, validates and persists',async({page})=>{
await page.getByRole('link',{name:'Check profile & privacy',exact:true}).click();await expect(page.getByRole('heading',{name:'Profile & Privacy',exact:true})).toBeVisible();
const cv=page.getByLabel('CV start year',{exact:true}),linked=page.getByLabel('LinkedIn start year',{exact:true});await page.getByRole('button',{name:'Mark this checked',exact:true}).click();await expect(page.getByRole('region',{name:'Next profile check'})).toContainText('Check what a signed-out visitor can see');await expect(page.getByLabel('Confirm each account handle belongs to me',{exact:true})).toBeChecked();await expect(cv).toHaveValue('');await expect(linked).toHaveValue('');await page.getByLabel('Role being compared').fill('Retail assistant');await cv.fill('2022');await linked.fill('2021');await expect(page.getByText('The years differ.',{exact:false})).toBeVisible();await linked.fill('2022');await expect(page.getByText('The years match.',{exact:false})).toBeVisible();await page.getByLabel('Check what a signed-out visitor can see',{exact:true}).check();await page.reload();await expect(cv).toHaveValue('2022');await expect(linked).toHaveValue('2022');await expect(page.getByLabel('Check what a signed-out visitor can see',{exact:true})).toBeChecked();await cv.fill('0000');await expect(page.getByText('Enter two valid years',{exact:false})).toBeVisible();
});
test('mistaken account attribution can be dismissed with context preserved and undone',async({page})=>{
await page.goto('/#/review');const row=page.locator('.post-row').filter({hasText:'Class 4B'});await row.getByRole('button',{name:/Class 4B/}).click();const lens=page.getByRole('dialog',{name:'Context Lens'});await lens.getByLabel('Add your context').fill('Existing context.');await lens.getByRole('button',{name:'Save context',exact:true}).click();await lens.getByRole('button',{name:'Not my post',exact:true}).click();await expect(lens).toHaveCount(0);await expect(row).toHaveCount(0);await page.getByRole('button',{name:'Show processed posts'}).click();await row.getByRole('button',{name:/Class 4B/}).click();await expect(lens.getByLabel('Add your context')).toHaveValue('Existing context.\nAccount ownership: not my post (self-reported).');await lens.getByRole('button',{name:'Close dialog'}).click();await page.locator('.toast').getByRole('button',{name:'Undo',exact:true}).click();await expect(row).toContainText('Not reviewed');
});

test('setup presents one data path at a time and keeps connection optional',async({page})=>{
await page.getByRole('button',{name:'Tutorial',exact:true}).click();
const setup=page.getByRole('region',{name:'Account setup'});
await setup.getByLabel('Your name',{exact:true}).fill('Robin');
await setup.getByLabel('Email address',{exact:true}).fill('robin@example.com');
await setup.getByRole('button',{name:'Save details & continue'}).click();
await setup.getByRole('button',{name:'Continue to accounts'}).click();
await expect(setup.getByRole('heading',{name:'Connect Mastodon',exact:true})).toHaveCount(0);
await expect(setup.getByRole('heading',{name:'Import your Mastodon posts',exact:true})).toHaveCount(0);
await expect(setup.getByText('Choose a connection or an archive to see the next step.',{exact:true})).toBeVisible();
await setup.getByRole('button',{name:'Imported archive',exact:true}).click();
await expect(setup.getByLabel('Import outbox.json',{exact:true})).toBeVisible();
await expect(setup.getByRole('heading',{name:'Connect Mastodon',exact:true})).toHaveCount(0);
await setup.getByRole('button',{name:'Connected account',exact:true}).click();
await expect(setup.getByText("Account connections aren't ready on this site yet.",{exact:true})).toBeVisible();
await expect(setup.getByLabel('Import outbox.json',{exact:true})).toHaveCount(0);
await setup.getByRole('button',{name:'Import an archive instead',exact:true}).click();
await expect(setup.getByLabel('Import outbox.json',{exact:true})).toBeVisible();
await expect(setup.getByRole('button',{name:'Continue with my posts'})).toBeDisabled();
await setup.getByRole('button',{name:'Skip for now — add posts later'}).click();
await expect(setup.getByText('Practice · Sample posts',{exact:true})).toBeVisible();
await expect(setup).toContainText('Neither changes the original post.');
});

test('connection explains access and requires an explicit choice before authorising',async({page})=>{
await page.unroute('**/api/connection?**');
await page.route('**/api/connection?**',r=>r.fulfill({json:{configured:true,connected:false}}));
await page.goto('/#/platforms');await page.reload();
await expect(page.getByText('Only add your own account or archive.',{exact:false})).toBeVisible();
const authorise=page.getByRole('button',{name:'Authorise with Mastodon',exact:true});
const consent=page.getByRole('checkbox',{name:/I authorise this app/});
await expect(authorise).toBeDisabled();await consent.check();await expect(authorise).toBeEnabled();
await consent.uncheck();await expect(authorise).toBeDisabled();
});
