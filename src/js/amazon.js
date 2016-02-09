var product = document.getElementById('productTitle');
var brand = document.getElementById('brand');

if (product) {
  product = product.innerText;
  brand = brand.innerText;
}

chrome.runtime.sendMessage({product: product, brand: brand});
