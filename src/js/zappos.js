var banner = document.getElementsByClassName('banner')[0];

if (banner) {
  var anchors = banner.getElementsByTagName('a');
  var product = anchors[1].innerText;
  var brand = anchors[0].innerText;
} else {
  var product = undefined;
}

chrome.runtime.sendMessage({product: product,brand: brand});
