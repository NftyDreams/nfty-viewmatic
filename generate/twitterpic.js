const path = require('path');
const fse = require('fs-extra');
const globals = require('../public/assets/js/globals');
const jsdom = require("jsdom");
const Puppeteer = require('puppeteer');
require('events').EventEmitter.setMaxListeners(100);

getAvatar = async (twitterUsername) => {
    try {
        const browser = await Puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
        const page = await browser.newPage();
        await page.setUserAgent(
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36"
        );
        console.log(twitterUsername);
        await page.goto(`https://twitter.com/${twitterUsername}`);
    //    let source = await page.content({"waitUntil": "domcontentloaded"});
    //    console.log(source);
        const selector = 
        await page.waitForSelector(`a[href$="/photo"] img[src]`);
        const url = await page.evaluate(()=>document.querySelector(`a[href$="/photo"] img`).src);
        await browser.close();
        console.log(`${twitterUsername}: ${url}`);
        return url;    
    }
    catch(e) {
        console.log(`Error for ${twitterUsername}`);
        return '';
    }
  };

(async () => {

    let project = process.argv[2];

    let dataPath = path.join(__dirname, '..', globals.INPUT_FOLDER);
    const help = "\nUsage: generate\n\t{ source }\n\n".green;


    const artworksFile = path.join(dataPath, project, project + '.json');
    if (fse.existsSync(artworksFile)) {
        console.log(String("\nUsing \"" + artworksFile + "\" for artworks.").blue);

        const artworkInfo = fse.readJSONSync(artworksFile);
        for(let c=0;c<artworkInfo.artworks.length;c++){
            const item = artworkInfo.artworks[c];
            const picUrl = await getAvatar(item.twitter.replace('@',''));      
            item.twitterId = picUrl.replace('https://pbs.twimg.com/profile_images/','').split('/')[0];
        }
        console.log(JSON.stringify(artworkInfo, null, 2));
    

    } else {
        console.log(help);
        throw new Error("Cannot locate file " + artworksFile);
    }
})();