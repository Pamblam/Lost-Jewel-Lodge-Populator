const puppeteer = require('puppeteer');
const fs = require('fs');
require('dotenv').config();

(async ()=>{
	const browser = await puppeteer.launch({
		headless: false, 
		args: ['--no-sandbox', '--disable-setuid-sandbox']
	});
	const page = await browser.newPage();
	page.setDefaultTimeout(0);
	
	var json = fs.readFileSync('data.json', 'utf8');
	var data = JSON.parse(json);
	
	await wikiLogin(page);
	
	for(var i=0; i<data.length; i++){
		await createPage(data[i], page);
	}
	
	await browser.close();
})();

/**
 * Create an entry in the Wiki
 * @param {Object} data - contains data about the lodge
 * @param {Page} page - Puppeteer Page object
 */
async function createPage(data, page){
	var year = data.charter_date.split("/").pop();
	var title = data.lodge+" Lodge No. "+data.lodge_no;
	var url = "https://thelostjewel.org/index.php?title="+encodeURIComponent(title.replace(/\s+/g, '_').replace(/\./g, ''))+"&action=edit";
	var content = `{{Lodge
|name=${data.lodge}
|number=${data.lodge_no}
|status=Active
|juris=Grand Lodge of Florida
|founded=${year}
|location=${data.county} county
|meeting=${data.meeting_time}
}}

'''${data.lodge} No. ${data.lodge_no}''' is located in ${data.county} county, Florida. It received its charter on ${data.charter_date} from the Grand Lodge of Florida.

[[Category:Lodges]]
[[Category:Grand Lodge of Florida]]`;
	var summary = `${data.lodge} Lodge no. ${data.lodge_no} in ${data.county} county, Florida.`;
	
	await page.goto(url);
	
	await page.waitForSelector("#wpTextbox1");
	
	await page.evaluate(() => {
		document.querySelector('#wpTextbox1').value = '';
		document.querySelector('#wpSummary').value = '';
	});
	
	await page.type('#wpTextbox1', content);
	await page.type('#wpSummary', summary);
	
	await solveCaptcha(page);
	
	await Promise.all([
		page.waitForNavigation({ waitUntil: 'networkidle0' }),
		page.click("#wpSave")
	]);
	
	var url = await getUrl(page);
	if(url.indexOf("submit")>-1){
		await solveCaptcha(page);
		await page.click("#wpSave");
	}
}

/**
 * Get the current URI
 * @param {Page} page - Puppeteer Page object
 */
async function getUrl(page){
	return await page.evaluate(() => window.location.href)
}

/**
 * get the captcha question on the current page, if there is one
 * @param {Page} page - Puppeteer Page object
 */
async function getCaptcha(page){
	const captcha = await page.evaluate(() => {
		var label = document.querySelector("label[for='wpCaptchaWord']");
		if(!label) return "";
		return label.textContent.toLowerCase();
	});
	return !!captcha ? captcha : false;
}

/**
 * Solve the captcha on the current page, if there is one
 * @param {Page} page - Puppeteer Page object
 */
async function solveCaptcha(page){
	var captcha = await getCaptcha(page);
	if(false === captcha) return;
	if(captcha.indexOf('apron') > -1){
		await page.type('#wpCaptchaWord', 'white');
	}else if(captcha.indexOf('architecture') > -1){
		await page.type('#wpCaptchaWord', 'doric');
	}else if(captcha.indexOf('f&am') > -1){
		await page.type('#wpCaptchaWord', 'masons');
	}
}

/**
 * Log into the wiki
 * @param {Page} page - Puppeteer Page object
 */
async function wikiLogin(page){
	await page.goto('https://thelostjewel.org/Main_Page');
	await page.waitForSelector("#pt-login a");
	await page.click("#pt-login a");
	await page.waitForSelector("#wpName1");
	await page.type('#wpName1', process.env.LOGIN);
	await page.type('#wpPassword1', process.env.PASSWORD);
	await page.click("#wpLoginAttempt");
}

/**
 * Pause for specified seconds
 * @param {Number} seconds - Seconds to pause for
 */
function pause(seconds){
	return new Promise(done=>{
		setTimeout(done, seconds*1000);
	});
}