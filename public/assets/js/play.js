const MAX_DURATION = 15000;
const VIDEO_PRELOAD_DELAY = 5000;
const UHD_WIDTH = 3840;
const UHD_HEIGHT = 2160;
const GUTTER = 600;
const MARGIN = 80;
const AWS_BUCKET_URL = 'https://nfty-artworks.s3-us-west-1.amazonaws.com';

const out = document.querySelector('.gallery-info');
const container = document.getElementById("gallery-container");
const wrapper = document.getElementById("wrapper-main");
let counter = 0;
let timeout = false;
let all;
let exhibits = [];
let queue = [];
let rootUrl =  AWS_BUCKET_URL;

const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

let playlist = params.p;
let newDuration = params.d;

if (playlist) {

  // Fetch the playlist
  fetch(`./playlists/${playlist}.json`)
    .then((response) => response.json())
    .then(async (list) => {

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
      gallery.media = media;
      all = gallery.media.length;
      preloadAll();


    });

} else {
  location.replace('https://nftydreams.com/go/');
}

function preloadAll() {
  gallery.media.forEach((item, index) => {

    let div = document.createElement("div");
    div.className = 'gallery-wrapper';
    div.style.display = 'none';
    if (!item.isVideo) {
      let img = new Image();
      img.onload = function () {
        div.id = `wrapper-${queue.length}`;
        div.style.backgroundImage = `url(${img.src})`;
        div.style.position = 'relative';
        container.appendChild(div);
        img.remove();
        queue.push(newDuration ?? item.duration);
        out.innerText = `${queue.length} items loaded`;

        if (queue.length === 1) {
          updateCounter();
        }
      }
      img.src = item.displayUrl;
    } else {

      let img = new Image();
      img.onload = function () {
        div.style.backgroundImage = `url(${img.src})`;
        container.appendChild(div);
        img.remove();

        let vid = document.createElement('video');

        vid.muted = true;
        vid.src = item.originalUrl;
        vid.addEventListener('canplaythrough', ev => {
          div.id = `wrapper-${queue.length}`;
          vid.id = `video-${queue.length}`;
          div.appendChild(vid);
          queue.push(Math.min(item.duration+VIDEO_PRELOAD_DELAY, MAX_DURATION+VIDEO_PRELOAD_DELAY));
          out.innerText = `${queue.length} items loaded`;
          if (queue.length === 1) {
            updateCounter();
          }
        }, { passive: true, once: true });

      }
      img.src = item.displayUrl;
    }
  });

}

function updateCounter() {
  hideCurrentElement();
  counter++;
  if (counter < 0) counter = queue.length - 1;
  counter = counter % queue.length;
  showNextElement();
}

function hideCurrentElement() {
  const div = document.getElementById(`wrapper-${counter}`);
  if (div) div.style.display = 'none';
  const vid = document.getElementById(`video-${counter}`);
  if (vid) {
    vid.pause();
  }
}

function showNextElement() {
  clearTimeout(timeout);
  out.innerText = `${counter + 1}/${queue.length}`;

  timeout = window.setTimeout(function () {
    updateCounter();
  }, queue[counter]);

  const wrapper = document.getElementById(`wrapper-${counter}`);
  wrapper.style.display = 'block';

  const vid = document.getElementById(`video-${counter}`);
  if (vid) {
    vid.currentTime = 0;
    const isLandscape = vid.clientWidth > vid.clientHeight;
    const marginScale = MARGIN/UHD_WIDTH;
    const itemScale = 3000/UHD_WIDTH;
   if (isLandscape) {
      vid.style.marginLeft = `${container.clientWidth * marginScale}px`;
      vid.style.width = `${container.clientWidth * itemScale}px`
      vid.style.marginTop = `${(container.clientHeight - vid.clientHeight) / 2}px`;
    } else {
      vid.style.marginTop = `${container.clientWidth * marginScale}px`;
      vid.style.height = `${container.clientHeight * itemScale}px`
    }
    vid.muted = true;
    vid.play();
  }
}
