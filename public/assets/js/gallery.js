
export async function display(artworkInfo) {

  if (location.href.indexOf('hide=') > -1) {
    document.getElementById('info-row').style.display = 'none';
    document.getElementById('header-row').style.display = 'none';
  }
  // If only one artwork, go straight to buy page
  if (artworkInfo.artworks.length === 1) {
    location.replace(`art.html?id=${artworkInfo.artworks[0].project}/${artworkInfo.artworks[0].account}`);
  }

  const gallery = document.getElementById('gallery');
  let html = '';
  artworkInfo.artworks.forEach((artwork) => {
    html += `<li class="js-masonry-elm"><a href="art.html?id=${artwork.project}/${artwork.account}" target="_new">`;
    if (artwork.originalUrl.indexOf('png') > -1) {
      html += `<img 
          src="${artworkInfo.rootUrl}${artwork.originalUrl.replace('/original/','/original/thumb/').replace('.png','.jpg')}" 
          width="${artwork.isLandscape ? 300 : 200}" 
          height="${artwork.isLandscape ? 200 : 300}" 
      />`;
    } else {

      html += `<img
          src="${artworkInfo.rootUrl}${artwork.originalUrl.replace('/original/','/original/thumb/').replace('.mp4','.jpg')}" 
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

