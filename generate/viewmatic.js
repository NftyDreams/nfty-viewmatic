const path = require('path');
const globals = require('../public/assets/js/globals');
const { AssetGen } = require('./assetgen');
/**
 * Generates all images for an exhibition
 */

async function viewmatic(project, artworkInfo, artfiles, flags, outputDir, tmpDir) {

    const exhibits = [];

    for (let a = 0; a < artfiles.length; a++) {  //async/await in forEach has problems; don't use
        let artfile = artfiles[a];
        if (artfile.name.startsWith('.')) continue;
        console.log(artfile.path)
        let options = {
            path: artfile.path,
            outputPath: path.resolve(artfile.path.replace(globals.INPUT_FOLDER, globals.OUTPUT_FOLDER)),
            name: artfile.name,
            tmpDir
        }
        console.log('####', artworkInfo.artworks)
        let account = artfile.name.split(' ')[0].toLowerCase();
        let artwork = artworkInfo.artworks.find(e => e.account.toLowerCase() === account);
        if (artwork) {

            options.title = artwork.title;
            options.artist = artwork.firstName + ' ' + artwork.lastName;
            const flag = flags.find(e => e.name === artwork.country);
            options.flag = (flag ? flag.image : '');
            options.country = artwork.country;
            options.project = artwork.project;
            options.logoUrl = path.join(artfile.path, '..', '..','..','logos', artworkInfo.logo);
            options.account = artwork.account;
            options.description = artwork.description;
            options.landscape = options.path.indexOf('L-') > -1 ? true : false;
            options.qrcodeUrl = artworkInfo?.qrcodeUrl;
            options.outputDir = outputDir;

            // Folder names must be in the format P-A where the second letter is the level of the artwork
            const pathFrags = artfile.path.split('/');
            const folderFrags = pathFrags[pathFrags.length-1].split('-')
            options.level = folderFrags[1];

            const artInfo = artwork;
            delete artInfo.orientation;
            delete artInfo.media;
            delete artInfo.mediaUrl;
            artInfo.id = options.project + '/' + options.account;
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
            artInfo.tags = [mediaInfo.tag];
            artInfo.level = options.level;
                        
            exhibits.push(artInfo);

        }

    }

    return exhibits.sort((a,b)=> (a.level + a.artist > b.level + b.artist ? 1 : -1))
}


module.exports = {
    viewmatic
}