const puppeteer = require('puppeteer');
const fs = require('fs');

(async ()=>{
	const browser = await puppeteer.launch({
		headless: false, 
		args: ['--no-sandbox', '--disable-setuid-sandbox']
	});
	const page = await browser.newPage();
	var json = fs.readFileSync(__dirname+'/data.json', 'utf8');
	var data = JSON.parse(json);
	for(var i=0; i<data.length; i++){
		data[i].charter_date = await getCharterDate(data[i], page);
	}
	fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
	await browser.close();
})();

async function getCharterDate(data, page){
	await page.goto("https://ga.grandview.systems/public_lodges/lodge/"+data.lodge_num);
	await page.waitForSelector(".compact-table");
	const str = await page.evaluate(() => {
		var tds = [...document.querySelectorAll('td')];
		var td = tds.filter(td=>td.innerHTML.indexOf("Chartered on:")>-1);
		return td[0].nextElementSibling.innerHTML.trim();
	});
	var [date, year] = str.split(",").map(m=>m.trim());
	var [month, date] = date.split(' ');
	var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	month = (months.indexOf(month)+1).toString().padStart(2, '0');
	date = date.padStart(2, '0');
	return `${month}/${date}/${year}`;
}


function pause(seconds){
	return new Promise(done=>{
		setTimeout(done, seconds*1000);
	});
}
