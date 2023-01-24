const path = require('path');
const fse = require('fs-extra');
const sharp = require('sharp');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const QRCode = require('qrcode');

const UHD_WIDTH = 3840;
const UHD_HEIGHT = 2160;

const GUTTER = 600;
const MARGIN = 80;

class AssetGen {

    static _log(indent, info) {
        console.log(' '.repeat((indent - 1) * 5) + (info.length > 0 && !info.startsWith('{') ? ' ⚙️  ' : '') + info);
    }


    static async _drawImage(options) {

        let src = path.join(options.path, options.name);
        try {
            let overlays = [];
            //modulateInfo.hue = sortedLayers[s].hue;

            const metadata = await sharp(src).metadata();
            const isLandscape = options.landscape;

            let itemWidth;
            let itemHeight;

            // Scale if necessary
            if (isLandscape) {
                itemWidth = UHD_WIDTH - GUTTER - (MARGIN * 3);
                itemHeight = (itemWidth / metadata.width) * metadata.height;
            } else {
                itemHeight = UHD_WIDTH - GUTTER - (MARGIN * 3);
                itemWidth = (itemHeight / metadata.height) * metadata.width;
            }

            let topOffset = isLandscape ? MARGIN : metadata.height + (MARGIN * 2);
            let leftOffset = isLandscape ? metadata.width + (MARGIN * 2) : MARGIN;

            // Main Image
            overlays.push({
                input: src,
                top: MARGIN,
                left: MARGIN 
            });

            overlays.push({
                input: options.logoUrl,
                top: topOffset,
                left: isLandscape ? leftOffset + (GUTTER - 300)/2 : MARGIN,
                height: 300 
            });

            topOffset = isLandscape ? topOffset + 300 + MARGIN : topOffset;
            leftOffset = isLandscape ? leftOffset : leftOffset + 300 + MARGIN;

            // Title
            overlays.push({
                input: await sharp({
                                    text: {
                                            text: options.title,
                                            width: isLandscape ? GUTTER : UHD_HEIGHT * .5, // max width
                                            height: 120 // max height
                                    }
                            })
                            .png()
                            .toBuffer(),
                top: topOffset,
                left: leftOffset
            });

            // Artist Name
            topOffset += MARGIN + 120;
            overlays.push({
                input: await sharp({
                                    text: {
                                            text: options.artist,
                                            width: isLandscape ? GUTTER : UHD_HEIGHT * .5, // max width
                                            height: 60 // max height
                                    }
                            })
                            .png()
                            .toBuffer(),
                top: topOffset,
                left: leftOffset
            });

            // Country           
            topOffset += 80;
            overlays.push({
                input: await sharp({
                                    text: {
                                            text: options.country,
                                            width: isLandscape ? GUTTER - 60 : (UHD_HEIGHT * .5) - 60, // max width
                                            height: 40
                                    }
                            })
                            .png()
                            .toBuffer(),
                top: topOffset,
                left: leftOffset + (options.flag ? 90 : 0)
            });

            if (options.flag) {
                const fimg = await fetch(options.flag)
                const fimgb = await fimg.buffer()
                overlays.push({
                    input: fimgb,
                    top: topOffset - 15,
                    left: leftOffset,
                    width: 40
                });    
            }

            topOffset += 40 + MARGIN;
            overlays.push({
                input: await sharp({
                                    text: {
                                            text: options.description,
                                            width: isLandscape ? GUTTER - 60 : (UHD_HEIGHT * .5) - 60, // max width
                                            height: 200
                                    }
                            })
                            .png()
                            .toBuffer(),
                top: topOffset,
                left: leftOffset
            });


            const qrCodeFile = path.join(options.tmpDir, options.account + '.png');
            await QRCode.toFile(qrCodeFile, 'https://nftydreams.github.io/nfty-viewmatic?a=' + options.account + '&id=' + options.id, {width: GUTTER, color: { light: '#000000', dark: '#666666'}});
            overlays.push({
                input: qrCodeFile,
                top: isLandscape ? UHD_HEIGHT - GUTTER - MARGIN : UHD_WIDTH - GUTTER - MARGIN,
                left: isLandscape ? leftOffset : UHD_HEIGHT - GUTTER - MARGIN,
                height: GUTTER 
            });

            return await sharp({
                    create: {
                        width: isLandscape ? UHD_WIDTH: UHD_HEIGHT,
                        height: isLandscape ? UHD_HEIGHT: UHD_WIDTH,
                        channels: 4,
                        background: '#000000'
                    }
                })
                .composite(overlays)
                .png()
                .toBuffer()
        }
        catch (e) {
            console.log(e);
        }
    }

    static async render(options) {

        if (options.path) {

            AssetGen._log(1, 'START');
            AssetGen._log(1, 'Options:');
            AssetGen._log(1, '');
            AssetGen._log(2, JSON.stringify(options, null, 4));
            AssetGen._log(1, '');

            const buffer = await AssetGen._drawImage(options);
            if (!fse.existsSync(options.outputPath)) {
                fse.mkdirSync(options.outputPath);
            }
            const outfile = path.join(options.outputPath, options.name.split(' ')[0] + '.png');
            console.log(outfile)
            sharp(buffer)
                .toFile(outfile);

            return outfile;

        } else {
            throw 'Invalid options';
        }
    }

}

module.exports.AssetGen = AssetGen;