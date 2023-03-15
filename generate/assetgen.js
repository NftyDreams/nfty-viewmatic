const path = require('path');
const fse = require('fs-extra');
const fs = require("fs").promises;
const globals = require('../public/assets/js/globals');
const sharp = require('sharp');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const QRCode = require('qrcode');
const ffmpeg = require('ffmpeg-static');
const genThumbnail = require('simple-thumbnail');


class AssetGen {

    static _log(indent, info) {
        console.log(' '.repeat((indent - 1) * 5) + (info.length > 0 && !info.startsWith('{') ? ' ⚙️  ' : '') + info);
    }


    static async _drawImage(options, isVideo) {

        let src = path.join(options.path, options.name);


        try {
            let overlays = [];
            let metadata = !isVideo ?
                await sharp(src).metadata()
                :
                {
                    width: options.isLandscape ? 3000 : 2000,
                    height: options.isLandscape ? 2000 : 3000
                };


            let itemWidth;
            let itemHeight;

            // Scale if necessary
            let scale = 1.0;
            if (options.isLandscape) {
                itemWidth = globals.UHD_WIDTH - globals.GUTTER - (globals.MARGIN * 3);
                scale = itemWidth / metadata.width;
                itemHeight = scale * metadata.height;
            } else {
                itemHeight = globals.UHD_WIDTH - globals.GUTTER - (globals.MARGIN * 3);
                scale = itemHeight / metadata.height;
                itemWidth = scale * metadata.width;
            }

            let topOffset = options.isLandscape ? globals.MARGIN : (metadata.height * scale) + (globals.MARGIN * 2);
            let leftOffset = options.isLandscape ? (metadata.width * scale) + (globals.MARGIN * 2) : globals.MARGIN;

            // Main Image

            if (!isVideo) {
                overlays.push({
                    input: src,
                    top: globals.MARGIN,
                    left: globals.MARGIN
                });
            } else {
                const keyImage = path.join(options.tmpDir, options.account + '-video.jpg');
                await genThumbnail(src, keyImage, `${metadata.width}x${metadata.height}`, {
                    path: ffmpeg
                });
                overlays.push({
                    input: keyImage,
                    top: globals.MARGIN,
                    left: globals.MARGIN
                });

            }

            overlays.push({
                input: options.logoUrl,
                top: topOffset,
                left: options.isLandscape ? leftOffset + (globals.GUTTER - 300) / 2 : globals.MARGIN,
                height: 300
            });

            topOffset = options.isLandscape ? topOffset + 300 + globals.MARGIN : topOffset;
            leftOffset = options.isLandscape ? leftOffset : leftOffset + 300 + globals.MARGIN;

            // Title
            overlays.push({
                input: await sharp({
                    text: {
                        text: options.title,
                        width: options.isLandscape ? globals.GUTTER : globals.UHD_HEIGHT * .5, // max width
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
                        width: options.isLandscape ? globals.GUTTER : globals.UHD_HEIGHT * .5, // max width
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
                        width: options.isLandscape ? globals.GUTTER - 60 : (globals.UHD_HEIGHT * .5) - 60, // max width
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
                const fimgb = await fimg.arrayBuffer()
                const buffer = Buffer.from(fimgb);
                overlays.push({
                    input: buffer,
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
                            width: options.isLandscape ? globals.GUTTER - 60 : (globals.UHD_HEIGHT * .5) - 60, // max width
                            height: 200
                        }
                    })
                        .png()
                        .toBuffer(),
                    top: topOffset,
                    left: leftOffset
                });
            }

            topOffset += 100 + globals.MARGIN;
            const priceData = globals.PRICE_DATA[0];
            overlays.push({
                input: await sharp({
                    text: {
                        text: `USD ${priceData.usd_price[options.level]} (Digital Collectible)\n\nScan for options`,
                        width: globals.GUTTER * .8, // max width
                        height: 250,
                        align: 'center'
                    }
                })
                    .png()
                    .toBuffer(),
                top: options.isLandscape ? globals.UHD_HEIGHT - globals.GUTTER * .6 - globals.MARGIN - 250 : globals.UHD_WIDTH - globals.GUTTER * .6 - globals.MARGIN - 250,
                left: options.isLandscape ? leftOffset + (globals.GUTTER - globals.GUTTER * .8) / 2 : globals.UHD_HEIGHT - globals.GUTTER * .8 - globals.MARGIN,
            });

            const qrCodeFile = path.join(options.tmpDir, options.account + '.png');
            const qrcodeUrl = (options.qrcodeUrl ? options.qrcodeUrl : globals.WEB_URL) + '?id=' + options.project + globals.ID_SEPARATOR + options.account;
            await QRCode.toFile(qrCodeFile, qrcodeUrl, { width: globals.GUTTER * .6, color: { light: '#000000', dark: '#666666' } });
            overlays.push({
                input: qrCodeFile,
                top: options.isLandscape ? globals.UHD_HEIGHT - globals.GUTTER * .6 - globals.MARGIN : globals.UHD_WIDTH - globals.GUTTER * .6 - globals.MARGIN,
                left: options.isLandscape ? leftOffset + (globals.GUTTER - globals.GUTTER * .6) / 2 : globals.UHD_HEIGHT - globals.GUTTER * .7 - globals.MARGIN,
                height: globals.GUTTER * .6
            });
        

            const buffers = [];

            buffers[0] = await sharp({
                create: {
                    width: options.isLandscape ? globals.UHD_WIDTH : globals.UHD_HEIGHT,
                    height: options.isLandscape ? globals.UHD_HEIGHT : globals.UHD_WIDTH,
                    channels: 4,
                    background: '#000000'
                }
            })
                .composite(overlays)
                .png()
                .toBuffer()

            buffers[1] = await sharp(buffers[0])
                .resize(options.isLandscape ? globals.THUMB_WIDTH : globals.THUMB_HEIGHT, options.isLandscape ? globals.THUMB_HEIGHT : globals.THUMB_WIDTH)
                .jpeg()
                .toBuffer();

            return buffers;
        }
        catch (e) {
            console.log(e);
        }
    }


    static async renderMedia(options) {

        AssetGen._log(1, '');
        AssetGen._log(1, `PROCESSING: ${options.name}`);
        try {
            if (options.path) {

                //            AssetGen._log(1, 'Options:');
                // AssetGen._log(1, '');
                // AssetGen._log(2, JSON.stringify(options, null, 4));
                // AssetGen._log(1, '');

                const newOutputPath = options.outputPath.substr(0, options.outputPath.lastIndexOf('/'));
                const tag = options.outputPath.replace(newOutputPath + '/', '');

                if (!fse.existsSync(newOutputPath)) {
                    fse.mkdirSync(newOutputPath);
                }

                if (!fse.existsSync(path.join(newOutputPath, globals.THUMB_FOLDER))) {
                    fse.mkdirSync(path.join(newOutputPath, globals.THUMB_FOLDER));
                }

                const originalPath = path.join(newOutputPath, globals.ORIGINAL_FOLDER);
                if (!fse.existsSync(originalPath)) {
                    fse.mkdirSync(originalPath);
                    fse.mkdirSync(path.join(originalPath, globals.THUMB_FOLDER));
                }
                const inFile = path.join(options.path, options.name);
                const originalFile = path.join(originalPath, options.name.split(' ')[0] + options.name.substr(options.name.lastIndexOf('.')).toLowerCase().replace('.jpeg','.jpg'));
                fse.copyFileSync(inFile, originalFile);

                const isVideo = options.name.endsWith('.mp4');
                let durationInMilliseconds = 0;
                if (isVideo === true) {

                    const buff = Buffer.alloc(100);
                    const header = Buffer.from("mvhd"); // Read header from video file

                    const video = await fs.open(inFile, 'r');
                    const { buffer } = await video.read(buff, 0, 100, 0);
                    await video.close();

                    const start = buffer.indexOf(header) + 17;
                    const timeScale = buffer.readUInt32BE(start, 4);
                    const duration = buffer.readUInt32BE(start + 4);
                    durationInMilliseconds = Math.floor(duration / timeScale * 1000);

                    const keyImage = path.join(originalPath, globals.THUMB_FOLDER, options.name.split(' ')[0] + '.jpg');
                    await genThumbnail(inFile, keyImage, `${options.isLandscape ? globals.ORIGINAL_THUMB_WIDTH : globals.ORIGINAL_THUMB_HEIGHT}x?`, {
                        path: ffmpeg
                    });
                } else {
                    sharp(inFile)
                        .resize(options.isLandscape ? globals.ORIGINAL_THUMB_WIDTH : globals.ORIGINAL_THUMB_HEIGHT, options.isLandscape ? globals.ORIGINAL_THUMB_HEIGHT : globals.ORIGINAL_THUMB_WIDTH)
                        .jpeg()
                        .toFile(path.join(originalPath, globals.THUMB_FOLDER, options.name.split(' ')[0] + '.jpg'));
                }


                const outFile = path.join(newOutputPath, options.name.split(' ')[0] + '.png');
                const imgBuffers = await AssetGen._drawImage(options, isVideo);
                sharp(imgBuffers[0]).toFile(outFile);

                const thumbFile = path.join(newOutputPath, globals.THUMB_FOLDER, options.name.split(' ')[0] + '.jpg');
                sharp(imgBuffers[1]).toFile(thumbFile);
                AssetGen._log(2, `SUCCESS: ${options.name}`);

                return {
                    tag,
                    displayUrl: path.join('/', options.project, outFile.replace(options.outputDir, '')),
                    originalUrl: path.join('/', options.project, originalFile.replace(options.outputDir, '')),
                    isVideo,
                    duration: durationInMilliseconds,
                    error: false
                }
            } else {
                AssetGen._log(2, `INVALID PATH: ${options.name}`);
            }
        } catch (err) {
            AssetGen._log(2, `FAILURE: ${options.name}`);
            return {
                err,
                error: true
            }
        }
    }

}

module.exports.AssetGen = AssetGen;