

(async () => {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });

  const project = params.p ?? 'foundry-g1';
  const account = params.a ?? '0x6ad102D67e6b7E2C2bbAbad9D05593bE988a5EDb';
  const rootUrl = 'https://nfty-artworks.s3-us-west-1.amazonaws.com/';
  const templatesUrl = 'assets/images/mockups/';

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
      renderView(canvas, finalImage, thumbImage, templateImg, templateInfo.frames);
    }
    templateImg.src = templatesUrl + templateInfo.src;
  }

  function renderView(canvas, finalImage, thumbImage, templateImage, frames) {

    const artworkImg = new Image();
    artworkImg.onload = () => {
      renderArtwork(
        canvas,
        finalImage,
        thumbImage,
        templateImage,
        {
          image: artworkImg,
          isLandscape: artworkImg.width > artworkImg.height
        },
        frames,
        exhibits
      );
    }
    artworkImg.crossOrigin = 'Anonymous';
    artworkImg.src = `${rootUrl}${project}/original/${account}.jpg`;

  }



  function renderArtwork(canvas, finalImage, thumbImage, templateImage, artwork, frames, exhibits) {

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
          renderFinal(canvas, finalImage, thumbImage, templateImage);
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
            renderFinal(canvas, finalImage, thumbImage, templateImage);
          }
        }
        const artwork = subset[index];
        altImage.crossOrigin = 'Anonymous';
        altImage.src = `${rootUrl}${artwork.project}/original/${artwork.account}.jpg`;
      }
    });
  }

  function renderFinal(canvas, finalImage, thumbImage, templateImage) {
    const ctx = canvas.getContext("2d");
    ctx.drawImage(templateImage, 0, 0);
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
        name: 'kafeel01',
        src: 'kafeel1.png',
        frames: [
          {
            isLandscape: true,
            featured: true,
            left: 400,
            top: 500,
            right: 1600,
            bottom: 1166,
            offsets: [-50,420,-570,-208,-205,-450,380,200]
          }
        ]
      },
      {
        name: 'kafeel02',
        src: 'kafeel2.png',
        frames: [
          {
            isLandscape: true,
            featured: true,
            left: 390,
            top: 690,
            right: 1200,
            bottom: 1200,
            offsets: [-5, 0, -5, 0, 5, 0, 5, 0]
          }
        ]
      }
    ]
  }
})();