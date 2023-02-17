
let globals = {};
let exhibit = null;

function renderPage(project, account, exhibit, flag) {
  document.getElementById('artwork').src = `${globals.AWS_BUCKET_URL}${exhibit.originalUrl.replace('original', 'original/thumb').replace('.png','.jpg')}`;
  document.getElementById('artwork_large').href = `${globals.AWS_BUCKET_URL}${exhibit.originalUrl}`;
  document.getElementById('artwork_title').innerText = exhibit.title;
  document.getElementById('artwork_description').innerText = exhibit.description;
  document.getElementById('artist_name').innerText = exhibit.artist;
  document.getElementById('artist_country').innerText = (flag ? flag.emoji + ' ': '') + exhibit.country;
  document.getElementById('artist_profile').href = exhibit.profileUrl;

  let itemHtml = '';
  globals.PRICE_DATA.forEach((item) => {
    const width = exhibit.isLandscape ? item.width : item.height;
    const height = exhibit.isLandscape ? item.height : item.width;
    const suffix = item.sku === 'dc-none' ? ' pixels' : ' cm';
    itemHtml += `<li class="mb-2"><input type="radio" name="variant" onclick="Art.switchItem('${item.sku}')" id="radio_${item.sku}"> ${item.title}<br />&nbsp;&nbsp;&nbsp; (${width}x${height}${suffix})</input></li>`;
  });
  document.getElementById('variants').innerHTML = itemHtml;
  Art.switchItem('dc-small');
}

export function switchItem(sku) {
  const priceItem = globals.PRICE_DATA.find(f => f.sku === sku);
  document.getElementById(`radio_${sku}`).checked = true;
  document.getElementById('price_aed').innerText = `AED ${priceItem.aed_price[exhibit.level]}`;
  document.getElementById('price_usd').innerText = `  USD ${priceItem.usd_price[exhibit.level]}`;
  document.getElementById('form').action = `/api/create-checkout-session?id=${exhibit.project}_${exhibit.account}_${sku}`;
}

export async function processRequest() {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });

  if (params.id) {
    const project = params.id.split('/')[0];
    const account = params.id.split('/')[1];

    const resp1 = await fetch('assets/js/globals.json');
    globals = await resp1.json();

    const resp2 = await fetch(`${globals.AWS_BUCKET_URL}/${project}/${project}-exhibits.json`);
    const exhibits = await resp2.json();
    exhibit = exhibits.find(e => e.id === params.id);
    if (exhibit) {
      const resp2 = await fetch('assets/js/flags.json');
      const flags = await resp2.json();
      const flag = flags.find(f => f.name === exhibit.country);
      renderPage(project, account, exhibit, flag);
    }
        
  } else {
    location.replace('https://nftydreams.com/go/');
  }
}
