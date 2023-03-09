const AWS_BUCKET_URL = 'https://nfty-artworks.s3-us-west-1.amazonaws.com';
const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

const account = params.a || null;
const twitter = params.t || null;
const country = params.c || null;

export async function loadArtworks(randomize) {

  const resp = await fetch(`${AWS_BUCKET_URL}/metadata/projects.json`);
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
    } else if (country) {
      const filtered = exhibits.filter(f => f.country.toLowerCase() === country.toLowerCase());
      artworks.push(...filtered);
    }  
    else {
      artworks.push(...exhibits);
    }
  };

  if (randomize) {
    return {
      rootUrl: AWS_BUCKET_URL,
      artworks: shuffle(artworks)
    }
  } else {
    return {
      rootUrl: AWS_BUCKET_URL,
      artworks
    }
  }
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
