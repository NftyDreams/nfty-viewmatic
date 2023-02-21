const AWS_BUCKET_URL = 'https://nfty-artworks.s3-us-west-1.amazonaws.com';
const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

const account = params.a || null;
const twitter = params.t || null;

export async function processRequest() {

  const resp = await fetch(`${AWS_BUCKET_URL}/projects.json`);
  const projects = await resp.json();
  let artworks = [];

  for(let p=0;p<projects.length;p++) {
    const resp2 = await fetch(`${AWS_BUCKET_URL}/${projects[p]}/${projects[p]}-exhibits.json`);
    const exhibits = await resp2.json();
    if (account) {
      const filtered = exhibits.filter(f => f.account.toLowerCase() === account.toLowerCase());
      artworks.push(...filtered);
    } else if (twitter) {
      if (!twitter.startsWith('@')) {
        twitter = '@' + twitter;
      }
      const filtered = exhibits.filter(f => f.twitter.toLowerCase() === twitter.toLowerCase());
      artworks.push(...filtered);
    } 
    else {
      artworks.push(...exhibits);
    }
  };

  // If only one artwork, go straight to buy page
  if (artworks.length === 1) {
    location.replace(`art.html?id=${artworks[0].project}/${artworks[0].account}`);
  }

  let newArtworks = shuffle(artworks);
  const gallery = document.getElementById('gallery');
  let html = '';
  newArtworks.forEach((artwork) => {
    html += `<li class="js-masonry-elm"><a href="art.html?id=${artwork.project}/${artwork.account}" target="_new">`;
    if (artwork.originalUrl.indexOf('png') > -1) {
      html += `<img 
          src="${AWS_BUCKET_URL}${artwork.originalUrl.replace('/original/','/original/thumb/').replace('.png','.jpg')}" 
          width="${artwork.isLandscape ? 300 : 200}" 
          height="${artwork.isLandscape ? 200 : 300}" 
      />`;
    } else {

      html += `<img
          src="${AWS_BUCKET_URL}${artwork.originalUrl.replace('/original/','/original/thumb/').replace('.mp4','.jpg')}" 
          width="${artwork.isLandscape ? 300 : 200}" 
          height="${artwork.isLandscape ? 200 : 300}"       
        />`
    }
    html += '</a></li>';
  });  
  gallery.innerHTML = html;

  masonry({
    target: '.js-masonry-list',  
    column: 4,  
    columnGap: 0,  
    rowGap: 0,  
    responsive: [  
      {
        breakpoint: 1024, 
        column: 3
      },
      {
        breakpoint: 800,
        column: 2
      },
      {
        breakpoint: 600,
        column: 1
      }
    ]
  });

  
}

function shuffle(array) {
  var m = array.length, t, i;
  while (m) {
    i = Math.floor(Math.random() * m--);
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
}
