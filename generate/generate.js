const path = require('path');
const fse = require('fs-extra');
const globals = require('../public/assets/js/globals');
const { viewmatic } = require('./viewmatic.js');
const colors = require('colors');
var dir = require('node-dir');

(async () => {

    let project = process.argv[2];

    let dataPath = path.join(__dirname, '..', globals.INPUT_FOLDER);
    const help = "\nUsage: generate\n\t{ source }\n\n".green;


    const artworksFile = path.join(dataPath, project, project + '.json');
    const flagsFile = path.join(dataPath, 'flags.json');
    const artworksDir = path.join(dataPath, project);
    const outputDir = path.join(__dirname, '..', globals.OUTPUT_FOLDER, project);
    const tmpDir = path.join(dataPath, 'tmp');
    const outFileJson = path.join(outputDir, project + '-exhibits.json');
    const errorFileJson = path.join(outputDir, project + '-errors.json');
    const outFileHtml = path.join(outputDir, project + '.html');

    if (fse.existsSync(outputDir)) {
        fse.rmSync(outputDir, { recursive: true });
    }
    fse.mkdirSync(outputDir);

    if (fse.existsSync(tmpDir)) {
        fse.rmSync(tmpDir, { recursive: true });
    }
    fse.mkdirSync(tmpDir);

    if (fse.existsSync(artworksFile)) {
        console.log(String("\nUsing \"" + artworksFile + "\" for artworks.").blue);

        const artworkInfo = fse.readJSONSync(artworksFile);
        const flags = fse.readJSONSync(flagsFile);
        const artfiles = [];

        dir.subdirs(artworksDir, async function(err, subdirs) {
            if (err) throw err;
            console.log(subdirs)
            subdirs.forEach(function(filePath) {
                const files = fse.readdirSync(filePath);
                files.forEach((file) => {         
                    let fileName = file;
                    if (fileName.indexOf(' ') < 0) {
                        fileName = file.replace('.', ' - x.');
                        fse.renameSync(path.join(filePath,file), path.join(filePath, fileName));
                    }
                    artfiles.push({ path: filePath, name: fileName})
                });
            });
            const result = await viewmatic(project, artworkInfo, artfiles, flags, outputDir, tmpDir)

            // Write output files
            fse.writeJsonSync(outFileJson, result.exhibits, { spaces: 2 });
            fse.writeJsonSync(errorFileJson, result.errors, { spaces: 2 });

            let html = '';
            let prevLevel = ''
            result.exhibits.forEach((item) => {
                if (item.level !== prevLevel) {
                    html += `<h2>Level ${item.level}</h2>\n`;
                    prevLevel = item.level;
                }
                html += `<div class="artwork"><img src="${item.displayUrl}" alt="" /></div>\n`;
            });

            html = `<html><head><style>.artwork { margin-bottom: 10px; } img { width: 100%; }</style></head><body>\n${html}</body></html>`;
            fse.writeFileSync(outFileHtml, html);
            console.log(String("Exhibits generated to \"" + outFileJson + "\".").blue);

        });


    

    } else {
        console.log(help);
        throw new Error("Cannot locate file " + artworksFile);
    }
})();