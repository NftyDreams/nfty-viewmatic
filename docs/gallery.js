  document.querySelector(gallery.container).innerHTML = `
  <div class="gallery-info"></div>
  <button id="gallery-autoplay"></button>
  <div class="gallery-wrapper">
  </div>
  `;


  const out = document.querySelector('.gallery-info');
  const wrapper = document.querySelector('.gallery-wrapper');
  const autoplay = document.querySelector('#gallery-autoplay');
  let counter = 0;
  let autoincrease = gallery.autoplay === 'no' ? false : true;
  let restart = gallery.endless === 'no' ? false : true;
  let first = false;
  let last = false;
  let timeout = false;
  let speed = gallery.speed || 15000;
  let all;

  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });

  let playlist = params.l;
  let project = params.p;

  if (playlist && project) {
   
    fetch(`./${project}/${project}-exhibits.json`)
      .then((response) => response.json())
      .then((exhibits) => {

        fetch(`./playlists/${playlist}.json`)
          .then((response) => response.json())
          .then((list) => {

            let media = [];
            list.forEach((item) => {
              if (item.indexOf('.') > -1) {
                media.push(item);
              } else {
                 const urls = exhibits.filter(e => e.mediaUrl.indexOf(`/${item}/`) > -1);
                 urls.forEach(url => media.push(url.mediaUrl.replace('https://gallery.nftydreams.com','')));
              }
            });

            gallery.media = media;
            all = gallery.media.length
            validatecounter();
          });
    
      });

  }
  


  function validatecounter() {
    if (restart) {
      if (counter < 0) counter = all - 1;
      counter = counter % all;
    } else {
      if (counter <= 0) {
        counter = 0;
      }
      if (counter === all) counter = all - 1;
    }
    if (!restart) {
      first = counter === 0;
      last = counter === all - 1;
      if (counter === all - 1) {
        autoplay.classList.add('hidden');
      } else {
        autoplay.classList.remove('hidden');
      }
    }

    show();
  }
  function show() {
    clearTimeout(timeout);
    out.innerText = `${counter + 1}/${all}`;
    wrapper.innerText = '';
    wrapper.dataset.loaded = 'false';

    if (gallery.media[counter].endsWith('.mp4')) {
      wrapper.style.backgroundImage = ``;
      let vid = document.createElement('video');
      vid.setAttribute('loop', 'true');
      vid.setAttribute('autoplay', 'true');
      vid.setAttribute('src', gallery.media[counter]);
      if (wrapper.dataset.loaded === 'false') {
        vid.addEventListener('canplaythrough', ev => {
          wrapper.appendChild(vid);
          loaded();
        }, { passive: true, once: true });
      }
    } else {
      wrapper.innerText = ' ';
      let url = gallery.media[counter];
      let i = new Image();
      i.src = url;
      i.onload = function () {
        wrapper.style.backgroundImage = `url(${url})`;
        loaded();
      }
      i.onerror = function () {
        wrapper.innerText = 'Error loading image ' + url;
        loaded();
      }
    }
  }
  function loaded() {
    wrapper.dataset.loaded = 'true';
    if (autoincrease && !last) {
      timeout = window.setTimeout(function () {
        counter++;
        validatecounter();
      }, speed);
    }
  }
  function nextslide() {
    if (!last) {
      counter++;
      autoincrease = false;
      validatecounter();
    }
  };
  function prevslide() {
    if (!first) {
      counter--;
      autoincrease = false;
      validatecounter();
    }
  };
  function toggleauto() {
    autoincrease = !autoincrease;
    validatecounter();
  };
