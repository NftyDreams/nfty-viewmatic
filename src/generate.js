const path = require('path');
const fse = require('fs-extra');
const { viewmatic } = require('./viewmatic.js');
const colors = require('colors');
var dir = require('node-dir');
const { resourceLimits } = require('worker_threads');


(async () => {

    let p = process.argv[2];

    // let c = process.argv[3];
    // let s = process.argv[4]
    // let r = process.argv[5]

    let dataPath = path.join(__dirname, '..', 'data');
    const help = "\nUsage: generate\n\t{ source }\n\n".green;


    const artworksFile = path.join(dataPath, p + '.json');
    const flagsFile = path.join(dataPath, 'flags.json');
    const artworksDir = path.join(dataPath, 'input');
    const outputDir = path.join(__dirname, '..', 'docs', 'assets');
    const logoUrl = path.join(dataPath, 'NftyDreams-Logomark.png');
    const tmpDir = path.join(dataPath, 'tmp');
    const outFileJson = path.join(outputDir, p + '-exhibits.json');
    const outFileHtml = path.join(outputDir, p + '.html');

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

        const artworks = fse.readJSONSync(artworksFile);
        const flags = fse.readJSONSync(flagsFile);
        const artfiles = [];

        dir.subdirs(artworksDir, async function(err, subdirs) {
            if (err) throw err;
            subdirs.forEach(function(filePath) {
                const files = fse.readdirSync(filePath);
                files.forEach((file) => {
                    if (err) {
                      console.log("Error getting directory information.")
                    } else {
                      files.forEach(function(file) {           
                        artfiles.push({ path: filePath, name: file})
                      });
                    }
                });
            });

            const result = await viewmatic(artworks, artfiles, flags, logoUrl, tmpDir)

            // Write output files
            fse.writeJsonSync(outFileJson, result, { spaces: 2 });

            let html = '';
            let prevLevel = ''
            result.forEach((item) => {
                if (item.level !== prevLevel) {
                    html += `<h2>Level ${item.level}</h2>\n`;
                    prevLevel = item.level;
                }
                html += `<div class="artwork"><img src="${item.imageUrl}" alt="" /></div>\n`;
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