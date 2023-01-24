const path = require('path');
const { AssetGen } = require('./assetgen');
/**
 * Generates all images for an exhibition
 */

async function viewmatic(artworks, artfiles, flags, logoUrl, tmpDir) {

    const exhibits = [];

    // let lDone = 0;
    // let pDone = 0;

    for (let a = 0; a < artfiles.length; a++) {  //async/await in forEach has problems; don't use
        let artfile = artfiles[a];
        let options = {
            path: artfile.path,
            outputPath: artfile.path.replace('data', 'docs').replace('input', 'assets'),
            name: artfile.name,
            logoUrl,
            tmpDir
        }

        let account = artfile.name.split(' ')[0].toLowerCase();
        let artwork = artworks.find(e => e.account.toLowerCase() === account);
        if (artwork) {

            options.title = artwork.title;
            options.artist = artwork.firstName + ' ' + artwork.lastName;
            const flag = flags.find(e => e.name === artwork.country);
            options.flag = (flag ? flag.image : '');
            options.country = artwork.country;
            options.source = artwork.source;
            options.account = artwork.account;
            options.description = artwork.description;
            options.landscape = options.path.indexOf('-L-') > -1 ? true : false;

            // if (options.landscape === true) {
            //     if (lDone > 3) continue;
            //     lDone++;
            // }

            // if (options.landscape === false) {
            //     if (pDone > 3) continue;
            //     pDone++;
            // }

            const pathFrags = artfile.path.split('-');
            const level = pathFrags[pathFrags.length - 2];

            const artInfo = {
                id: options.source + '-' + options.account,
                title: options.title,
                artist: options.artist,
                flag: options.flag,
                country: options.country,
                source: options.source,
                account: options.account,
                description: options.description,
                landscape: options.landscape,
                imageUrl: options.name.indexOf('.mp4') < 0 ? await AssetGen.render(options) : '',
                level: level
            }

            exhibits.push(artInfo);

        }

    }

    return exhibits.sort((a,b)=> (a.level + a.artist > b.level + b.artist ? 1 : -1))
}


module.exports = {
    viewmatic
}