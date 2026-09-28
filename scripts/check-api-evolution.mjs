import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base=process.argv[2] ?? 'https://127.0.0.1:5180';
const browser=await chromium.launch();
const context=await browser.newContext({ignoreHTTPSErrors:true,reducedMotion:'reduce'});
const errors=[],live=[];
await context.route('https://api.wikiforge.fr/**',route=>{live.push(route.request().url());return route.abort();});
await context.addInitScript(()=>localStorage.setItem('encyclomestre.auth-session',JSON.stringify({accessToken:'mock-only',user:{id:'1',username:'Demo',displayName:'Demo',role:'user'}})));
const page=await context.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
try {
 for(const width of [360,390,768,1024,1440]){
  await page.setViewportSize({width,height:950});await page.goto(base+'/market');await page.locator('[data-auction-id="70"]').waitFor();
  await page.locator('[data-auction-id="70"]').getByRole('button',{name:'Ajouter aux favoris'}).click();
  await page.getByRole('button',{name:'Favoris',exact:true}).click();await page.waitForFunction(()=>document.querySelector('button[aria-label="Suivant"]')?.disabled || [...document.querySelectorAll('button')].some(b=>b.textContent?.trim()==='Suivant' && b.disabled));
  assert.equal(await page.getByRole('button',{name:'Précédent',exact:true}).isDisabled(),true);assert.equal(await page.getByRole('button',{name:'Suivant',exact:true}).isDisabled(),true);
  await page.locator('[data-auction-id="70"]').getByRole('button',{name:'Retirer des favoris'}).click();
  await page.goto(base+'/collection');await page.getByText('Progression de la collection',{exact:true}).click();await page.getByText(/exemplaires · .*cartes actives différentes/).waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
 }
 await page.goto(base+'/settings');await page.getByLabel('Pseudonyme',{exact:true}).fill('Nouveau pseudo');await page.getByRole('button',{name:'Enregistrer',exact:true}).click();await page.getByText('Profil enregistré.',{exact:true}).waitFor();
 assert.equal(await page.getByLabel('Pseudonyme',{exact:true}).isDisabled(),true);await page.getByText(/Prochain changement de pseudo possible/).waitFor();
 await page.getByRole('button',{name:'Enregistrer',exact:true}).click();assert.equal(await page.getByRole('alert').count(),0);
 await page.getByRole('button',{name:'Voir les conséquences'}).click();await page.getByLabel('Mot de passe actuel').fill('wrong');await page.getByRole('checkbox',{name:/fermeture définitive/}).check();await page.getByRole('button',{name:'Supprimer mon compte',exact:true}).click();await page.getByRole('alert').getByText('Mot de passe incorrect.',{exact:true}).waitFor();
 await page.getByLabel('Mot de passe actuel').fill('demo-password');await page.getByRole('checkbox',{name:/fermeture définitive/}).check();await page.getByRole('button',{name:'Supprimer mon compte',exact:true}).click();await page.getByText('Votre compte a été fermé et vos sessions révoquées.').waitFor();
 assert.deepEqual(errors,[]);assert.deepEqual(live,[]);console.log('API evolution: favorites, paging, progression, name cooldown and deletion passed on mocks at five widths.');
}finally{await browser.close();}
