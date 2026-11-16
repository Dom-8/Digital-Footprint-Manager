import {test,expect} from '@playwright/test';
test('teacher journey, saved decisions, complete routes and responsive layouts',async({page})=>{
  const failures:string[]=[];
  page.on('pageerror',error=>{failures.push(error.message);console.log('Browser runtime error:',error.message);});
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('/');
  const dialog=page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  for(let i=0;i<3;i++)await dialog.getByRole('button',{name:'Continue',exact:true}).click();
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button',{name:'Continue',exact:true}).click();
  await dialog.getByRole('button',{name:'Open my dashboard'}).click();
  await expect(dialog).not.toBeVisible();
  const metric=page.getByText('Items needing review',{exact:true}).locator('../..').locator('.metric-value');
  const before=Number(await metric.textContent());
  await page.getByRole('link',{name:'Content Review',exact:true}).click();
  await page.getByLabel('Priority',{exact:true}).selectOption('High priority');
  await page.getByRole('button',{name:/Class 4B at the placement school/}).click();
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Add your context').fill('This was a fictional training exercise; verify the original assignment.');
  await dialog.getByRole('button',{name:'Save context',exact:true}).click();
  await expect(dialog.getByText('Before and after context',{exact:true})).toBeVisible();
  await expect(dialog.getByText('High priority',{exact:true}).first()).toBeVisible();
  await dialog.getByRole('button',{name:'Mark reviewed',exact:true}).click();
  await page.keyboard.press('Escape');
  await page.getByRole('link',{name:'Dashboard',exact:true}).click();
  await expect(metric).toHaveText(String(before-1));
  await page.reload();
  await expect(metric).toHaveText(String(before-1));
  for(const [route,title] of [
    ['identity','My Digital Identity'],['industry','Industry Analysis'],
    ['readiness','Career Readiness'],['monitoring','Monitoring Centre'],
    ['reports','Reports'],['platforms','Connected Platforms'],
    ['settings','Privacy & Settings'],['methodology','Help & Methodology']
  ]){
    await page.goto('/#/'+route);
    await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();
  }
  await page.goto('/#/timeline');
  await expect(page.getByRole('heading',{name:'A timeline, not a single moment.'})).toBeVisible();
  await page.goto('/');
  for(const width of [375,768,1440]){
    await page.setViewportSize({width,height:1000});
    await expect(page.getByRole('heading',{name:'Welcome back, Alex.'})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
    if(width===375){
      await page.getByRole('button',{name:'Open navigation',exact:true}).click();
      await expect(page.getByRole('link',{name:'Content Review',exact:true})).toBeVisible();
      await page.getByRole('button',{name:'Close menu',exact:true}).click();
    }
    await page.screenshot({path:'screenshots/dashboard-'+width+'.png',fullPage:true});
  }
  expect(failures).toEqual([]);
});
test.afterEach(async({page},info)=>{if(info.status!==info.expectedStatus)console.log('Page at failure:',(await page.locator('body').innerText()).slice(0,12000));});
