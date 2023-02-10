(async () => {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });

  const template = params.t ?? 'foundry1';
  const project = params.p ?? 'foundry-g1';
  const account = params.a ?? '0xd07D220d7e43eCa35973760F8951c79dEebe0dcc';
  const rootUrl = 'https://nfty-artworks.s3-us-west-1.amazonaws.com/';
  const templatesUrl = 'assets/images/templates/';

  document.getElementById('template').value = template;
  document.getElementById('project').value = project;
  document.getElementById('account').value = account;
  
  // Fetch all exhibits for project
  const resp = await fetch(`${rootUrl}${project}/${project}-exhibits.json`)
  const exhibits = await resp.json();

  // Load all templates
  const templateOptions = loadTemplates();

  // Render the canvas on which everything will be drawn
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  // Load requested template
  const templateInfo = templateOptions[template];
  const templateImg = new Image();
  templateImg.onload = () => {
    canvas.width = templateImg.width;
    canvas.height = templateImg.height;
    ctx.drawImage(templateImg, 0, 0);
  }
  templateImg.src = templatesUrl + templateInfo.src;

  // Load requested artwork
  const artworkInfo = exhibits.find((a) => a.account.toLowerCase() === account.toLowerCase());
  if (artworkInfo) {
    const artworkImg = new Image();
    artworkImg.onload = () => {
      renderArtwork(
        {
          image: artworkImg,
          isLandscape: artworkImg.width > artworkImg.height
        }, 
        templateInfo.frames, 
        exhibits
      );
    }
    artworkImg.crossOrigin = 'Anonymous';
    artworkImg.src = `${rootUrl}${project}/thumb/${account}.jpg`;  
  }


  function renderArtwork(artwork, frames, exhibits) {

    let done = false;
    let imagesLoaded = 1;
    frames.forEach((frame) => {
      if ((frame.isLandscape === artwork.isLandscape) && (!done) && (frame.featured === true)) {
        // Match for target artwork
        drawPerspective(ctx, artwork.image, frame);
        done = true;
        if (imagesLoaded == frames.length) {
          renderImage();
        }
      } else {
        let subset = exhibits.filter((a) => a.isLandscape === frame.isLandscape && !a.isVideo);
        let index = Math.floor(Math.random() * subset.length);
        let altImage = new Image();
        altImage.onload = () => {
          drawPerspective(ctx, altImage, frame);
          imagesLoaded++;
          if (imagesLoaded == frames.length) {
            renderImage();
          }
        }
        altImage.crossOrigin = 'Anonymous';console.log(index)
        altImage.src = `${rootUrl}${project}/thumb/${subset[index].account}.jpg`;
      }
    });
  }

  function renderImage() {
    const finalImage = document.getElementById('artwork');
    finalImage.src = canvas.toDataURL('image/jpg');
  }
  
  function drawPerspective(ctx, img, frame) {
    const p = new perspective(ctx, img);
    p.draw([
      [frame.left + frame.offsets[0], frame.top + frame.offsets[1]],
      [frame.left + frame.width + frame.offsets[2], frame.top + frame.offsets[3]],
      [frame.left + frame.width + frame.offsets[4], frame.top + frame.height + frame.offsets[5]],
      [frame.left + frame.offsets[6], frame.top + frame.height + frame.offsets[7]]
    ]);
  }


  function loadTemplates() {
    return {
      foundry1: {
        frames: [
          {
            isLandscape: false,
            featured: true,
            left: 50,
            top: 212,
            height: 585,
            width: 270,
            offsets: [0, 0, 0, 45, 0, -60, 0, 0]
          },
          {
            isLandscape: true,
            featured: true,
            left: 588,
            top: 395,
            height: 210,
            width: 182,
            offsets: [0, 0, 0, 15, -2, -20, 0, 0]
          }           
        ],
        src: 'foundry1.jpg'
      },
      foundry2: {
        frames: [
          {
            isLandscape: false,
            left: 40,
            top: 450,
            height: 255,
            width: 160,
            offsets: [0, 0, 0, 5, 9, -6, 14, 0]
          },
          {
            isLandscape: true,
            featured: true,
            left: 1035,
            top: 505,
            height: 158,
            width: 217,
            offsets: [0, 0, 0, -12, 0, 18, -2, 0]
          },
          {
            isLandscape: false,
            featured: true,
            left: 1592,
            top: 382,
            height: 390,
            width: 250,
            offsets: [0, 0, 20, -26, -5, 30, -12, 0]
          },
          {
            isLandscape: false,
            featured: false,
            left: 335,
            top: 457,
            height: 243,
            width: 153,
            offsets: [0, 0, 0, 0, 3, 0, 8, 0]
          },
          {
            isLandscape: false,
            featured: false,
            left: 808,
            top: 470,
            height: 220,
            width: 76,
            offsets: [0, 0, 0, -9, 3, 9, 0, 0]
          }              
        ],
        src: 'foundry2.jpg'
      },
      foundry3: {
        frames: [
          {
            isLandscape: false,
            featured: true,
            left: 155,
            top: 81,
            height: 950,
            width: 550,
            offsets: [0, 0, 0, 70, 15, -70, 24, 0]
          },
          {
            isLandscape: true,
            featured: true,
            left: 1295,
            top: 375,
            height: 384,
            width: 450,
            offsets: [0, 0, 0, 35, 0, 0, 0, 0]
          }           
        ],
        src: 'foundry3.jpg'
      }
    }
  }
})();