// Seasonal accent color — auto-switches on the first day of each astronomical season.
// Boundaries: Spring Mar 20, Summer Jun 21, Autumn Sep 22, Winter Dec 21.
function getCurrentSeason(date){
  var year   = date.getFullYear();
  var spring = new Date(year, 2, 20);
  var summer = new Date(year, 5, 21);
  var autumn = new Date(year, 8, 22);
  var winter = new Date(year, 11, 21);
  if(date >= winter || date < spring) return 'winter';
  if(date >= spring && date < summer) return 'spring';
  if(date >= summer && date < autumn) return 'summer';
  return 'autumn';
}
document.documentElement.setAttribute('data-season', getCurrentSeason(new Date()));

// Seasonal favicon — drawn in SVG from the same accent/paper vars set above,
// so the tab icon can never drift out of sync with the page.
function setSeasonalFavicon(){
  var css    = getComputedStyle(document.documentElement);
  var accent = css.getPropertyValue('--accent').trim();
  var paper  = css.getPropertyValue('--paper').trim();

  // Six-spoke asterisk: three bars through the centre at 0deg, 60deg, 120deg.
  var svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
      '<rect width="32" height="32" fill="' + paper + '"/>' +
      '<g stroke="' + accent + '" stroke-width="5">' +
        '<line x1="16" y1="4" x2="16" y2="28"/>' +
        '<line x1="5.6" y1="10" x2="26.4" y2="22"/>' +
        '<line x1="5.6" y1="22" x2="26.4" y2="10"/>' +
      '</g>' +
    '</svg>';

  // favicon.ico stays in the page as the Safari fallback.
  var link = document.createElement('link');
  link.rel  = 'icon';
  link.type = 'image/svg+xml';
  link.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
  document.head.appendChild(link);
}
setSeasonalFavicon();
