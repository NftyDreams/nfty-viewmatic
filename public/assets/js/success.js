const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});
let globals = {};
let exhibit = null;

function renderPage(exhibit, flag) {
  document.getElementById('artwork').src = `${globals.AWS_BUCKET_URL}${exhibit.originalUrl.replace('original', 'original/thumb').replace('.png','.jpg')}`;
  document.getElementById('artwork').style.display = 'block';
  document.getElementById('artwork_large').href = `${globals.AWS_BUCKET_URL}${exhibit.originalUrl}`;
  document.getElementById('artwork_title').innerText = exhibit.title;
  // document.getElementById('artwork_description').innerText = exhibit.description;
  // document.getElementById('artist_name').innerText = exhibit.artist;
  // document.getElementById('artist_country').innerText = (flag ? flag.emoji + ' ': '') + exhibit.country;
  // document.getElementById('artist_profile').href = exhibit.profileUrl;

}


export async function processRequest() {

  if (params.id) {
    const project = params.id.split('_')[0];
    const account = params.id.split('_')[1];

    const resp1 = await fetch('assets/js/globals.json');
    globals = await resp1.json();

    const resp2 = await fetch(`${globals.AWS_BUCKET_URL}/${project}/${project}-exhibits.json`);
    const exhibits = await resp2.json();
    exhibit = exhibits.find(e => e.id === `${project}/${account}`);
    
    if (exhibit) {
      const resp2 = await fetch('assets/js/flags.json');
      const flags = await resp2.json();
      const flag = flags.find(f => f.name === exhibit.country);
      renderPage(exhibit, flag);
    }

    const sessionId = params.session_id;
    if (sessionId) {
      const resp3 = await fetch(`/api/checkout-session?sessionId=${sessionId}${params?.mode === 'test' ? '&mode=test' : ''}`);
      const session = await resp3.json();
      // const sessionJSON = JSON.stringify(session, null, 2);
      // document.querySelector('pre').textContent = sessionJSON;
    }
    
  }

}
