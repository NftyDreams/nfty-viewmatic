
var map;
var markers;

export async function display(artworkInfo) {

  const resp = await fetch(`assets/js/countries.json`);
  const countries = await resp.json();

  // If only one artwork, go straight to buy page
  if (artworkInfo.artworks.length === 1) {
    location.replace(`art.html?id=${artworkInfo.artworks[0].project}/${artworkInfo.artworks[0].account}`);
  }

  // const tiles = L.tileLayer(
  //   'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  //   {
  //     maxZoom: 19,
  //     attribution:
  //       '© OpenStreetMap',
  //   },
  // ),
  const latlng = L.latLng(38, -97);

  var watercolorUrl = "https://stamen-tiles-a.a.ssl.fastly.net/watercolor/{Z}/{X}/{Y}.png";

  const url = watercolorUrl.replace(/({[A-Z]})/g, function(s) {
      return s.toLowerCase();
  });

  const layer = L.tileLayer(url, {
      subdomains: ['','a.','b.','c.','d.'],
      minZoom: 0,
      maxZoom: 20,
      type: 'png',
      attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>'
  });

  map = L.map('map', { center: latlng, zoom: 3, maxZoom: 5, layers: [layer], attribution: '© OpenStreetMap' }).addLayer(layer);
  

  markers = L.markerClusterGroup({
    spiderfyOnMaxZoom: false,
    spiderfyDistanceMultiplier: 2,
    showCoverageOnHover: true,
    zoomToBoundsOnClick: true
  })

 
  markers.on('clusterclick', function (cluster) {
    const childMarkers = cluster.layer.getAllChildMarkers();
    if (map.getZoom() === map.getMaxZoom()) {
      const country = childMarkers[0].country;
      document.getElementById('panel-title').innerText = `Artworks from ${country}`;
      document.getElementById('panel-iframe').src = `/?c=${country}&hide=true`;
      // open panel when clicking on trigger btn
      addClass(panel, 'cd-panel--is-visible');
    }    
  })

  populate(artworkInfo, countries);
  map.addLayer(markers);
  map.fitBounds(markers.getBounds());

  const panelClass = 'js-cd-panel-main';
  const panel = document.getElementsByClassName(panelClass)[0];
  //close panel when clicking on 'x' or outside the panel
  panel.addEventListener('click', function(event){
    if( hasClass(event.target, 'js-cd-close') || hasClass(event.target, panelClass)) {
      event.preventDefault();
      removeClass(panel, 'cd-panel--is-visible');
    }
  });


}

function populate(artworkInfo, countries) {

  artworkInfo.artworks.forEach((artwork) => {
    const country = countries.find(c => c.name.common === artwork.country);

    if (country && Array.isArray(country.latlng)) {
      const latLng = L.latLng(country.latlng[0], country.latlng[1]);
      const sizeAttr = artwork.isLandscape ? 'width:300px;height:200px;' : 'width:200px;height:300px;';
      const popup = L.popup({ autoPan: true, minWidth: (artwork.isLandscape ? 300 : 200) + 50}).setContent(`<a href="art.html?id=${artwork.project}/${artwork.account}" target="_new"><img src="${artworkInfo.rootUrl}/${artwork.project}/original/thumb/${artwork.account}.jpg" style="${sizeAttr}margin:0 auto"/></a><h4>${artwork.artist}</h4>`);
      const m = L.marker(latLng).bindPopup(popup);
      m.country = artwork.country;
      markers.addLayer(m);
    } else {
     // console.log('*******', artwork.country)
    }
  });

}

   // Slide In Panel - by CodyHouse.co
   //class manipulations - needed if classList is not supported
   //https://jaketrent.com/post/addremove-classes-raw-javascript/
   function hasClass(el, className) {
       if (el.classList) return el.classList.contains(className);
       else return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'));
   }

   function addClass(el, className) {
      if (el.classList) el.classList.add(className);
      else if (!hasClass(el, className)) el.className += " " + className;
   }

   function removeClass(el, className) {
       if (el.classList) el.classList.remove(className);
       else if (hasClass(el, className)) {
         var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
         el.className=el.className.replace(reg, ' ');
       }
   }
