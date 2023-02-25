const path = require('path');
const fse = require('fs-extra');

const MAX_DURATION = 15000;
const VIDEO_PRELOAD_DELAY = 5000;
const UHD_WIDTH = 3840;
const UHD_HEIGHT = 2160;
const GUTTER = 600;
const MARGIN = 80;
const AWS_BUCKET_URL = 'https://nfty-artworks.s3-us-west-1.amazonaws.com';

(async () => {

  let playlist = process.argv[2];
  let dataPath = path.join(__dirname, '..', 'public');

let exhibits = [];
let rootUrl =  AWS_BUCKET_URL;

if (playlist) {

  // Fetch the playlist
  const list = fse.readJSONSync(path.join(dataPath, 'playlists', `${playlist}.json`));

      const projects = [];

      // Generate a flat list of all exhibits
      list.forEach((item) => {
        Object.keys(item.sets).forEach((set) => {
          projects.push(
            {
              name: set,
              duration: item.duration,
              sets: item.sets[set]
            });
        });
      });

      // Fetch all exhibits for every project that is referenced
      await Promise.all(projects.map(async project => {
        try {
          const resp = await fetch(`${rootUrl}/${project.name}/${project.name}-exhibits.json`);
          const data = await resp.json();
          exhibits = Array.isArray(data) ? exhibits.concat(data) : exhibits.concat([data]);
        }
        catch (e) {
        }
      }));

      // For the playlist, build a list of media items and/or URLs

      let media = [];
      projects.forEach((project) => {
        project.sets.forEach((set) => {
          if (set.startsWith('http')) {
            if (set.indexOf('.mp4') < 0) {
              media.push({ url: set, duration: project.duration });
            }
          } else {
            const filtered = exhibits.filter(e => e.project === project.name && e.tags.includes(set));
            filtered.forEach((exhibit) => {
              media.push({
                displayUrl: rootUrl + exhibit.displayUrl,
                originalUrl: rootUrl + exhibit.originalUrl,
                isVideo: exhibit.isVideo,
                isLandscape: exhibit.isLandscape,
                duration: exhibit.duration === 0 ? project.duration : exhibit.duration
              });
            });
          }
        });
      });
      console.log('MEDIA', media)

} else {
  console.log('No playlist specified!')
}

})();

