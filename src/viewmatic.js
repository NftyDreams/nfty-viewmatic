const path = require('path');
const globals = require('./globals');
const { AssetGen } = require('./assetgen');
/**
 * Generates all images for an exhibition
 */

async function viewmatic(project, artworks, artfiles, flags, logoUrl, tmpDir) {

    const exhibits = [];

    // let lDone = 0;
    // let pDone = 0;

    for (let a = 0; a < artfiles.length; a++) {  //async/await in forEach has problems; don't use
        let artfile = artfiles[a];
        let options = {
            path: artfile.path,
            outputPath: artfile.path.replace(globals.INPUT_FOLDER, globals.OUTPUT_FOLDER),
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
            options.project = artwork.project;
            options.account = artwork.account;
            options.description = artwork.description;
            options.landscape = options.path.indexOf('L-') > -1 ? true : false;

            // if (options.landscape === true) {
            //     if (lDone > 25) continue;
            //     lDone++;
            // }

            // if (options.landscape === false) {
            //     if (pDone > 3) continue;
            //     pDone++;
            // }

            const pathFrags = artfile.path.split('-');
            const level = pathFrags[pathFrags.length - 2];

            const artInfo = artwork;
            delete artInfo.orientation;
            delete artInfo.media;
            delete artInfo.mediaUrl;
            artInfo.id = options.project + '-' + options.account;
            artInfo.artist = options.artist;
            artInfo.flag = options.flag;

            let mediaInfo = {};
            if (options.name.indexOf('.mp4') > -1) {
                mediaInfo = await AssetGen.renderVideo(options);
            } else {
                mediaInfo = await AssetGen.renderImage(options);
            }
            artInfo.isLandscape = options.landscape;
            artInfo.isVideo = mediaInfo.isVideo;
            artInfo.displayUrl = mediaInfo.displayUrl;
            artInfo.originalUrl = mediaInfo.originalUrl;
            artInfo.duration = mediaInfo.duration;
            artInfo.level = level;
            
            exhibits.push(artInfo);

        }

    }

    return exhibits.sort((a,b)=> (a.level + a.artist > b.level + b.artist ? 1 : -1))
}


module.exports = {
    viewmatic
}