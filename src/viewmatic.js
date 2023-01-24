const path = require('path');
const { AssetGen } = require('./assetgen');
/**
 * Generates all images for an exhibition
 */

async function viewmatic(artworks, artfiles, flags, logoUrl, tmpDir) {

    const exhibits = [];

    let lDone = 0;
    let pDone = 0;

    for(let a=0; a<artfiles.length; a++) {  //async/await in forEach has problems; don't use
        let artfile = artfiles[a];
        let options = {
            path: artfile.path,
            outputPath: artfile.path.replace('input', 'output'),
            name: artfile.name,
            logoUrl,
            tmpDir
        }

        if (options.name.indexOf('.mp4') < 0) {
            let account = artfile.name.split(' ')[0].toLowerCase();
            let artwork = artworks.find(e => e.account.toLowerCase() === account);
            if (artwork) {

                options.title = artwork.title;
                options.artist = artwork.firstName + ' ' + artwork.lastName;
                const flag = flags.find(e => e.name === artwork.country);
                options.flag = (flag ? flag.image : '');
                options.country = artwork.country;
                options.account = artwork.account;
                options.description = artwork.description;
                options.landscape = options.path.indexOf('-L-') > -1 ? true : false;

                if (options.landscape === true)  {
                    if (lDone > 3) continue;
                    lDone++;
                }

                if (options.landscape === false)  {
                    if (pDone > 3) continue;
                    pDone++;
                }

                exhibits.push(
                    await AssetGen.render(options)
                );    

            }


        }
    }

    return {
        exhibits
    }
}

module.exports = {
    viewmatic
}