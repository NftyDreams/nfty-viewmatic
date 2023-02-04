const path = require('path');
const fse = require('fs-extra');
const fs = require("fs").promises;
const globals = require('./globals');
const sharp = require('sharp');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const QRCode = require('qrcode');



class AssetGen {

    static _log(indent, info) {
        console.log(' '.repeat((indent - 1) * 5) + (info.length > 0 && !info.startsWith('{') ? ' ⚙️  ' : '') + info);
    }


    static async _drawImage(options, isVideo) {

        let src = path.join(options.path, options.name);


        try {
            let overlays = [];
            const isLandscape = options.landscape;
            let metadata = !isVideo ? 
                                await sharp(src).metadata() 
                                : 
                                { 
                                    width: isLandscape ? globals.UHD_WIDTH : globals.UHD_HEIGHT,
                                    height: isLandscape ? globals.UHD_HEIGHT : globals.UHD_WIDTH
                                };


            let itemWidth;
            let itemHeight;

            // Scale if necessary
            let scale = 1.0;
            if (isLandscape) {
                itemWidth = globals.UHD_WIDTH - globals.GUTTER - (globals.MARGIN * 3);
                scale = itemWidth / metadata.width;
                itemHeight = scale * metadata.height;
            } else {
                itemHeight = globals.UHD_WIDTH - globals.GUTTER - (globals.MARGIN * 3);
                scale = itemHeight / metadata.height;
                itemWidth = scale * metadata.width;
            }

            let topOffset = isLandscape ? globals.MARGIN : (metadata.height * scale) + (globals.MARGIN * 2);
            let leftOffset = isLandscape ? (metadata.width * scale) + (globals.MARGIN * 2) : globals.MARGIN;

            // Main Image

            if (!isVideo) {
                overlays.push({
                    input: src,
                    top: globals.MARGIN,
                    left: globals.MARGIN 
                });    
            } 

            overlays.push({
                input: options.logoUrl,
                top: topOffset,
                left: isLandscape ? leftOffset + (globals.GUTTER - 300)/2 : globals.MARGIN,
                height: 300 
            });

            topOffset = isLandscape ? topOffset + 300 + globals.MARGIN : topOffset;
            leftOffset = isLandscape ? leftOffset : leftOffset + 300 + globals.MARGIN;

            // Title
            overlays.push({
                input: await sharp({
                                    text: {
                                            text: options.title,
                                            width: isLandscape ? globals.GUTTER : globals.UHD_HEIGHT * .5, // max width
                                            height: 120 // max height
                                    }
                            })
                            .png()
                            .toBuffer(),
                top: topOffset,
                left: leftOffset
            });

            // Artist Name
            topOffset += globals.MARGIN + 120;
            overlays.push({
                input: await sharp({
                                    text: {
                                            text: options.artist,
                                            width: isLandscape ? globals.GUTTER : globals.UHD_HEIGHT * .5, // max width
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
                                            width: isLandscape ? globals.GUTTER - 60 : (globals.UHD_HEIGHT * .5) - 60, // max width
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

            topOffset += 40 + globals.MARGIN;
            if (options.description !== '') {
                overlays.push({
                    input: await sharp({
                                        text: {
                                                text: options.description,
                                                width: isLandscape ? globals.GUTTER - 60 : (globals.UHD_HEIGHT * .5) - 60, // max width
                                                height: 200
                                        }
                                })
                                .png()
                                .toBuffer(),
                    top: topOffset,
                    left: leftOffset
                });    
            }

            const qrCodeFile = path.join(options.tmpDir, options.account + '.png');
            const qrcodeUrl = options.qrcodeUrl ? options.qrcodeUrl : globals.WEB_URL + '?id=' + options.project + globals.ID_SEPARATOR + options.account;
            await QRCode.toFile(qrCodeFile, qrcodeUrl, {width: globals.GUTTER * .6, color: { light: '#000000', dark: '#666666'}});
            overlays.push({
                input: qrCodeFile,
                top: isLandscape ? globals.UHD_HEIGHT - globals.GUTTER * .6 - globals.MARGIN : globals.UHD_WIDTH - globals.GUTTER * .6 - globals.MARGIN,
                left: isLandscape ? leftOffset + (globals.GUTTER - globals.GUTTER *.6)/2 : globals.UHD_HEIGHT - globals.GUTTER * .6 - globals.MARGIN,
                height: globals.GUTTER * .6
            });

            return await sharp({
                    create: {
                        width: isLandscape ? globals.UHD_WIDTH: globals.UHD_HEIGHT,
                        height: isLandscape ? globals.UHD_HEIGHT: globals.UHD_WIDTH,
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

    static async renderVideo(options) {

        if (options.path) {

            AssetGen._log(1, 'START');
            AssetGen._log(1, 'Options:');
            AssetGen._log(1, '');
            AssetGen._log(2, JSON.stringify(options, null, 4));
            AssetGen._log(1, '');

            const newOutputPath = options.outputPath.substr(0, options.outputPath.lastIndexOf('/'));
            const tag = options.outputPath.replace(newOutputPath + '/', '');

            if (!fse.existsSync(newOutputPath)) {
                fse.mkdirSync(newOutputPath);
            }

            const originalPath = path.join(newOutputPath, globals.ORIGINAL_FOLDER);
            if (!fse.existsSync(originalPath)) {
                fse.mkdirSync(originalPath);
            }

            const inFile = path.join(options.path, options.name);
            const originalFile = path.join(originalPath, options.name.split(' ')[0] + '.mp4');

            const buff = Buffer.alloc(100);
            const header = Buffer.from("mvhd"); // Read header from video file

            const video = await fs.open(inFile, 'r');
            const { buffer } = await video.read(buff, 0, 100, 0);
            await video.close();
        
            const start = buffer.indexOf(header) + 17;
            const timeScale = buffer.readUInt32BE(start, 4);
            const duration = buffer.readUInt32BE(start + 4);
            const durationInMilliseconds = Math.floor(duration/timeScale * 1000);

            fse.copyFileSync(inFile, originalFile);  
            

            const outFile = path.join(newOutputPath, options.name.split(' ')[0] + '.png');
            const imgBuffer = await AssetGen._drawImage(options, true);
            sharp(imgBuffer)
                .toFile(outFile);


            return {tag, displayUrl: outFile.split(globals.OUTPUT_FOLDER)[1], originalUrl: originalFile.split(globals.OUTPUT_FOLDER)[1], isVideo: true, duration: durationInMilliseconds };

        } else {
            throw 'Invalid options';
        }        
    }

    static async renderImage(options) {

        if (options.path) {

            AssetGen._log(1, 'START');
            AssetGen._log(1, 'Options:');
            AssetGen._log(1, '');
            AssetGen._log(2, JSON.stringify(options, null, 4));
            AssetGen._log(1, '');

            const newOutputPath = options.outputPath.substr(0, options.outputPath.lastIndexOf('/'));
            const tag = options.outputPath.replace(newOutputPath + '/', '');

            if (!fse.existsSync(newOutputPath)) {
                fse.mkdirSync(newOutputPath);
            }

            const originalPath = path.join(newOutputPath, globals.ORIGINAL_FOLDER);
            if (!fse.existsSync(originalPath)) {
                fse.mkdirSync(originalPath);
            }
            const inFile = path.join(options.path, options.name);
            const originalFile = path.join(originalPath, options.name.split(' ')[0] + '.png');
            fse.copyFileSync(inFile, originalFile);  


            const outFile = path.join(newOutputPath, options.name.split(' ')[0] + '.png');
            const imgBuffer = await AssetGen._drawImage(options, false);
            sharp(imgBuffer)
                .toFile(outFile);


            return { tag, displayUrl: outFile.split(globals.OUTPUT_FOLDER)[1], originalUrl: originalFile.split(globals.OUTPUT_FOLDER)[1], isVideo: false, duration: 0};

        } else {
            throw 'Invalid options';
        }
    }

}

module.exports.AssetGen = AssetGen;