

(async () => {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });

  const project = params.p ?? 'foundry-g2';
  const account = params.a ?? '0xf2a0d70B63b9f87925d753EdcEb13d03B529f7e5';
  const rootUrl = 'https://nfty-artworks.s3-us-west-1.amazonaws.com/';
  const templatesUrl = 'assets/images/templates/';

  const DEBUG = false;
  let debugImg = new Image();
  if (DEBUG) {
    debugImg.src = templatesUrl + 'debug.jpg';
  }


  document.getElementById('project').value = project;
  document.getElementById('account').value = account;

  // Fetch all exhibits for project
  const resp = await fetch(`${rootUrl}${project}/${project}-exhibits.json`)
  const exhibits = await resp.json();

  // Fetch alternate exhibits in case
  const resp2 = await fetch(`${rootUrl}foundry-g1/foundry-g1-exhibits.json`)
  const altExhibits = await resp2.json();


  // Load all templates
  const templateOptions = loadTemplates();
  let frameCount = 0;

  // Load requested artwork
  const artworkInfo = exhibits.find((a) => a.account.toLowerCase() === account.toLowerCase());
  if (artworkInfo) {
    templateOptions.forEach((template) => {
      renderTemplate(artworkInfo, template);
    });
  }


  function renderTemplate(artworkInfo, templateInfo) {

    if ((templateInfo.frames.filter((a) => a.isLandscape === artworkInfo.isLandscape)).length === 0) {
      return;
    }

    frameCount++;

    // Render the canvas on which everything will be 
    const canvas = document.createElement("canvas");
    const slides = document.getElementById('slides');

    const slide = document.createElement('div');
    slide.className = 'slides';

    const finalImage = document.createElement('img');
    finalImage.className = 'cursor';
    finalImage.alt = templateInfo.name;
    finalImage.style = 'height:500px';
    slide.append(finalImage);
    slides.append(slide);

    const col = document.createElement('div');
    col.className = 'column';

    const thumbImage = document.createElement('img');
    thumbImage.style = 'width:100%;';
    thumbImage.className = 'view cursor';
    thumbImage.alt = frameCount;
    thumbImage.onclick = (e) => {
      currentSlide(parseInt(e.target.alt));
    }
    col.append(thumbImage);

    document.getElementById('row').append(col);

    const templateImg = new Image();
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    templateImg.onload = () => {
      canvas.width = templateImg.width;
      canvas.height = templateImg.height;
      ctx.drawImage(templateImg, 0, 0);
      renderView(canvas, finalImage, thumbImage, templateInfo.frames);
    }
    templateImg.src = templatesUrl + templateInfo.src;
  }

  function renderView(canvas, finalImage, thumbImage, frames) {

    const artworkImg = new Image();
    artworkImg.onload = () => {
      renderArtwork(
        canvas,
        finalImage,
        thumbImage,
        {
          image: artworkImg,
          isLandscape: artworkImg.width > artworkImg.height
        },
        frames,
        exhibits
      );
    }
    artworkImg.crossOrigin = 'Anonymous';
    artworkImg.src = `${rootUrl}${project}/thumb/${account}.jpg`;

  }



  function renderArtwork(canvas, finalImage, thumbImage, artwork, frames, exhibits) {

    let done = false;
    let imagesRendered = 0;
    let imagesToRender = 1;
    const ctx = canvas.getContext("2d");
    frames.forEach((frame) => {
      if ((frame.isLandscape === artwork.isLandscape) && (!done) && (frame.featured === true)) {
        // Match for target artwork
        drawPerspective(ctx, artwork.image, frame);
        imagesRendered++;
        done = true;
        if (frames.length === 1) {
          renderFinal(canvas, finalImage, thumbImage);
        }
      } else {
        let subset = exhibits.filter((a) => a.isLandscape === frame.isLandscape && !a.isVideo);
        if (subset.length === 0) {
          subset = altExhibits.filter((a) => a.isLandscape === frame.isLandscape && !a.isVideo);
        }
        let index = Math.floor(Math.random() * subset.length);
        let altImage = new Image();
        imagesToRender++;
        altImage.onload = () => {
          drawPerspective(ctx, altImage, frame);
          imagesRendered++;
          if (imagesRendered == imagesToRender) {
            renderFinal(canvas, finalImage, thumbImage);
          }
        }
        const artwork = subset[index];
        altImage.crossOrigin = 'Anonymous';
        altImage.src = `${rootUrl}${artwork.project}/thumb/${artwork.account}.jpg`;
      }
    });
  }

  function renderFinal(canvas, finalImage, thumbImage) {
    finalImage.src = canvas.toDataURL('image/jpg');
    thumbImage.src = finalImage.src;
    showSlides(1);
  }

  function drawPerspective(ctx, img, frame) {
    const p = new perspective(ctx, DEBUG === true ? debugImg : img);
    p.draw([
      [frame.left + frame.offsets[0], frame.top + frame.offsets[1]],
      [frame.right + frame.offsets[2], frame.top + frame.offsets[3]],
      [frame.right + frame.offsets[4], frame.bottom + frame.offsets[5]],
      [frame.left + frame.offsets[6], frame.bottom + frame.offsets[7]]
    ]);
  }


  function loadTemplates() {
    return [
      {
        name: 'foundry00',
        src: 'foundry00.jpg',
        frames: [
          {
            isLandscape: true,
            featured: true,
            left: 0,
            top: 0,
            right: 1920,
            bottom: 1080,
            offsets: [0, 0, 0, 0, 0, 0, 0, 0]
          }
        ]
      },
      {
        name: 'foundry01',
        src: 'foundry01.jpg',
        frames: [
          {
            isLandscape: false,
            featured: true,
            left: 0,
            top: 0,
            right: 1080,
            bottom: 1920,
            offsets: [0, 0, 0, 0, 0, 0, 0, 0]
          }
        ]
      },
      {
        name: 'foundry5',
        src: 'foundry5.jpg',
        frames: [
          {
            isLandscape: false,
            featured: true,
            left: 102,
            top: 409,
            right: 770,
            bottom: 1505,
            offsets: [0, 0, 0, 64, 0, 0, 12, 95]
          }
        ]
      },
      {
        name: 'foundry1',
        src: 'foundry1.jpg',
        frames: [
          {
            isLandscape: false,
            featured: true,
            left: 48,
            top: 212,
            right: 319,
            bottom: 811,
            offsets: [0, 0, 0, 49, 0, -64, 4, 0]
          },
          {
            isLandscape: true,
            featured: true,
            left: 588,
            top: 395,
            right: 771,
            bottom: 608,
            offsets: [0, 0, 0, 17, -2, -27, 0, 0]
          }
        ]
      },
      {
        name: 'foundry2',
        src: 'foundry2.jpg',
        frames: [
          {
            isLandscape: false,
            featured: false,
            left: 42,
            top: 451,
            right: 199,
            bottom: 704,
            offsets: [0, 0, 0, 2, 10, -1, 13, 0]
          },
          {
            isLandscape: false,
            featured: false,
            left: 335,
            top: 457,
            right: 488,
            bottom: 702,
            offsets: [0, 0, -4, 4, 3, 0, 8, 0]
          },
          {
            isLandscape: false,
            featured: false,
            left: 808,
            top: 470,
            right: 884,
            bottom: 690,
            offsets: [0, 0, 0, -7, 3, 9, 2, 0]
          },
          {
            isLandscape: true,
            featured: true,
            left: 1034,
            top: 507,
            right: 1258,
            bottom: 662,
            offsets: [0, 0, 0, -12, -3, 17, -1, 0]
          },
          {
            isLandscape: false,
            featured: true,
            left: 1593,
            top: 382,
            right: 1840,
            bottom: 777,
            offsets: [0, 0, 20, -28, -2, 30, -12, 0]
          }
        ]
      },
      {
        name: 'foundry3',
        src: 'foundry3.jpg',
        frames: [
          {
            isLandscape: false,
            featured: true,
            left: 155,
            top: 81,
            right: 705,
            bottom: 1031,
            offsets: [0, 0, 0, 70, 10, -68, 24, 0]
          },
          {
            isLandscape: true,
            featured: true,
            left: 1296,
            top: 376,
            right: 1752,
            bottom: 758,
            offsets: [0, 0, 0, 33, -8, -31, -4, 0]
          }
        ]
      },
      {
        name: 'foundry4',
        src: 'foundry4.jpg',
        frames: [
          {
            isLandscape: false,
            featured: false,
            left: 11,
            top: 253,
            right: 205,
            bottom: 589,
            offsets: [0, 0, -10, 3, 0, 0, 12, -7]
          },
          {
            isLandscape: false,
            featured: true,
            left: 360,
            top: 260,
            right: 554,
            bottom: 605,
            offsets: [0, 0, -1, 5, 0, 0, 3, -8]
          },
          {
            isLandscape: false,
            featured: false,
            left: 974,
            top: 271,
            right: 1073,
            bottom: 650,
            offsets: [0, 0, 10, -24, 0, 0, -9, -32]
          },
          {
            isLandscape: true,
            featured: true,
            left: 1338,
            top: 311,
            right: 1900,
            bottom: 730,
            offsets: [0, 0, 30, -55, 0, 0, -14, -113]
          },

        ]
      }
    ]
  }
})();