const path = require('path');
const fse = require('fs-extra');
const { viewmatic } = require('./viewmatic.js');
const colors = require('colors');
var dir = require('node-dir');


(async () => {

    // let p = process.argv[2];
    // let c = process.argv[3];
    // let s = process.argv[4]
    // let r = process.argv[5]

    let dataPath = path.join(__dirname, '..', 'data');
    const help = "\nUsage: generate\n\t\n\n".green;


    const artworksFile = path.join(dataPath, 'artworks.json');
    const flagsFile = path.join(dataPath, 'flags.json');
    const artworksDir = path.join(dataPath, 'input');
    const outputDir = path.join(dataPath, 'output');
    const logoUrl = path.join(dataPath, 'NftyDreams-Logomark.png');
    const tmpDir = path.join(dataPath, 'tmp');

    if (fse.existsSync(outputDir)) {
        fse.rmSync(outputDir, { recursive: true });
    }
    fse.mkdirSync(outputDir);

    if (fse.existsSync(tmpDir)) {
        fse.rmSync(tmpDir, { recursive: true });
    }
    fse.mkdirSync(tmpDir);

    const outFile = path.join(outputDir, 'exhibition.json');

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
            fse.writeJsonSync(outFile, result.exhibits, { spaces: 2 });
    
            console.log(String("Exhibits generated to \"" + outFile + "\".").blue);

        });


    

    } else {
        console.log(help);
        throw new Error("Cannot locate file " + artworksFile);
    }
})();