
function processRedirectRequest() {
    const params = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, prop) => searchParams.get(prop),
      });
    
      let id = params.id;
    
      if (id) {
       
        const project = id.split('/')[0];
        const account = id.split('/')[1];

        fetch(`./${project}/${project}-exhibits.json`)
          .then((response) => response.json())
          .then((exhibits) => {

                const exhibit = exhibits.find(e => e.account === account);
                if (exhibit) {
                    location.replace('go.html', 'artwork.html');
                }
          });
        } else {
          location.replace('https://nftydreams.com/go/')
        }
}