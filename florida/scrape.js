const puppeteer = require('puppeteer');
const fs = require('fs');

(async ()=>{
	const browser = await puppeteer.launch({
		headless: false, 
		args: ['--no-sandbox', '--disable-setuid-sandbox']
	});
	const page = await browser.newPage();
	var links = await getAllLinks(page);
	var data = [];
	for(var i=0; i<links.length; i++){
		var lodge_data = await getLodegData(links[i], page);
		data.push(lodge_data);
	}
	fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
	await browser.close();
})();

async function getLodegData(url, page){
	await page.goto(url);
	await page.waitForSelector("#ctl00_ContentPlaceHolder1_LabelInfo1");
	const details = await page.evaluate(() => {
		var details = {};
		var text = document.querySelector("#ctl00_ContentPlaceHolder1_LabelInfo1").innerHTML;
		text = text.replace(/&nbsp;/g, ' ');
		text = text.replace(/<br>/g, ' ');
		var parts = text.split(/Lodge Number:|District Number:|Zone:|Lodge County:|Lodge Chartered On:|Lodge Street Address:|Lodge Mailing Address:/g).map(e=>e.trim()).filter(e=>!!e)
		details.lodge_no = +parts[0];
		details.dist_no = +parts[1];
		details.zone_no = +parts[2];
		details.county = parts[3];
		details.charter_date = parts[4];
		details.street_address = parts[5];
		details.mailing_address = parts[6];
		details.lodge = $("#ctl00_ContentPlaceHolder1_LabelLodgeName").text().trim();
		var mailto_link = $("#ctl00_ContentPlaceHolder1_HyperLinkEmailLodge").attr('href');
		details.email = mailto_link ? mailto_link.split('mailto:')[1].split('?subject')[0] : '';
		details.phone = ($("#ctl00_ContentPlaceHolder1_LabelInfo2").text().split(":")[1]||"").trim();
		text = $("#ctl00_ContentPlaceHolder1_LabelInfo3").text();
		text = text.replace(/&nbsp;/g, ' ');
		text = text.replace(/<br>/g, ' ');
		var parts = text.split(/Lodge Meetings:|Meeting Time:/g).map(e=>e.trim()).filter(e=>!!e);
		details.meeting_time = parts.reverse().join(' ').trim();
		return details;
	});
	details.gl_link = url;
	return details;
}

async function getAllLinks(page){
	var links = [];
	for(var pageNo=1;;pageNo++){
		var ls = await getLinksFromPage(pageNo, page);
		if(!ls || !ls.length) break;
		links.push(...ls);
	}
	return links;
}

async function getLinksFromPage(pageNo, page){
	
	// go to search page
	await page.goto('http://lodges.glflamason.org/public/Lodge-Search.aspx');
	await page.waitForSelector("#ctl00_ContentPlaceHolder1_AccordionPane5_header");
	
	// click on the accordion header
	await page.click("#ctl00_ContentPlaceHolder1_AccordionPane5_header");
	await pause(1);
	
	// type into search box
	await page.focus('#ctl00_ContentPlaceHolder1_AccordionPane5_content_TextBoxSearchDistrict');
	await page.type('#ctl00_ContentPlaceHolder1_AccordionPane5_content_TextBoxSearchDistrict', ""+pageNo);
	await page.keyboard.press('Enter');
	await page.waitForNavigation({ waitUntil: 'networkidle0' })
	
	const links = await page.evaluate(() => {
		var table = document.querySelector("#ctl00_ContentPlaceHolder1_GridViewResults");
		return table ? [...table.querySelectorAll("a")].map(a=>a.href) : [];
	});
	
	return links;
}

function pause(seconds){
	return new Promise(done=>{
		setTimeout(done, seconds*1000);
	});
}
