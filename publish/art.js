
function processRequest() {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });

  if (params.id) {
    const project = params.id.split('_')[0];
    const account = params.id.split('_')[1];

    fetch(`./${project}/${project}-exhibits.json`)
          .then((response) => response.json())
          .then((exhibits) => {

                const exhibit = exhibits.find(e => e.id === params.id);
                if (exhibit) {
                  document.getElementById('form').action = `/create-checkout-session?id=${params.id}`;
                  document.getElementById('artwork').src = exhibit.displayUrl;
                }
          });
        
  } else {
    location.replace('https://nftydreams.com/go/');
  }
}