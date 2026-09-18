import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:1440,height:1100}});
 await page.goto('http://127.0.0.1:3000');
 await page.getByText('Prévia local',{exact:true}).waitFor();
 await page.screenshot({path:'test-results/final-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:'test-results/final-mobile.png',fullPage:true});
 console.log('Desktop/mobile screenshots saved; no horizontal overflow.');
} finally { await browser.close(); }
