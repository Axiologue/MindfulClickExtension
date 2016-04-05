
var productSnippet = 
  '<div id="product">' +
    '<h1 class="center"></h1>' +
  '</div>' +
  '<div id="personalized"></div>' +
  '<div id="scores">' +
    '<div id="overall">' +
    '</div>' +
    '<div class="subScores left">' +
     '<ul id="companyScores-left" class="companyScores">' +
     '</ul>' +
    '</div>' +
    '<div class="subScores right">' +
     '<ul id="companyScores-right" class="companyScores">' +
     '</ul>' +
    '</div>' +
  '</div>' +
  '<hr>' +
  '<div id="linkDiv">' +
  '</div>';

var wrongSiteHTML = 
  '<h1 class="center">Unsupported Site</h1>' +
  '<hr >' +
  '<p>Currently, <strong>Mindful Click</strong> only supports looking up athletic shoes at amazon.com and zappos.com.</p>' +
  'If you have any questions or comments, we\'d love to hear from you.  You can send us your comments or suggestions at <a class="email" href="MAILTO:info@axiologue.org">info@axiologue.org</a>.</p>';

var noProductSnippet = 
  '<h1 class="center">No Product Found</h1>' +
  '<hr >' +
  '<p>You don\'t appear to be on a page with any product. If you think this is an error, you can drop us a line at <a class="email" href="MAILTO:info@axiologue.org">info@axiologue.org</a>. In the meantime, keeping on browsing!</p>';

var productNotFoundSnippet =
  '<h1 class="center">No Product Match</h1>' +
  '<hr >' +
  '<p>We couldn\'t find <span id="productName"></span> in our servers.  If the requested product is an athletic shoe and you think this is a mistake, send us an <a class="email" href="MAILTO:info@axiologue.org">email</a> or considering <a class="link" href="http://data.axiologue.org">adding it</a>.<p>';

var categoryIcons = {
  'Animal Welfare': 'paw',
  'Consumer Health': 'ambulance',
  'Corporate Finances': 'dollar',
  'Environment': 'leaf',
  'Labor': 'suitcase', 
  'Public Engagement': 'bullhorn'
};

var explanationText = 
  '<h1 class="center">What Your Score Means</h1>' +
  '<hr>' +
  '<div id="Explanation">' +
    '<ul>' +
      '<li>A <span class="positive"><strong>Positive</strong></span> score means the product is in line with your ethics!</li>' +
      '<li>A <span class="negative"><strong>Negative</strong></span> score means the product is contrary to your ethics!</li>' +
      '<li>A <span class="neutral"><strong>Zero</strong></span> score means no opinion! (It could also mean we need more data.)</li>' +
    '</ul>' +
    '<p>Your score is determined by matching your ethics with the data we have on each product.  Your ethical profile was set by answering the set of simple questions we asked when you signed up.  Want to make tweaks or refine your ethics?  You can adjust your ethical profile at any point <a class="link" href="http://data.axiologue.org/#/ethicsProfile">here</a>.</p>' +
    '<p>If you want to see our raw data, you can check that out <a class="link" href="http://data.axiologue.org/#/articles/tagged">here</a> or learn how to <a class="link" href="http://data.axiologue.org/#/text/tagging">contribute</a> to help make Axiologue better and more comprehensive!</p>' +
  '</div>' +
  '<hr >' +
  '<div>' +
    '<button id="backButton" class="btn btn-full btn-footer">Back To Product</button>' +
  '</div>';

// Login info

var loggedIn = false;
var errorMsg = "";
var token = "";

// First load

window.onload = function () {
  // Attempt to get the auth token from storage
  chrome.storage.local.get('token',function (item) {
    // if the Token is available, retrieve it and set loggedIn to true
   if(item.token) {
     token = item.token;
     loggedIn = true;
    }

    loggedIn ? loadMain() : loadLogin();
  }); 
  
};


// Main Content Page
function loadMain() {
  loadLogout();

  // See if profile setting questions have been answer
  apiCall({
    method: 'GET',
    url: 'profile/meta/answered/'
  })
  .done(function (data) {
      // redirect to proper page, based on whether the questions have been answered
      data.answered ? loadContent() : loadQuestions();
  })
  .fail(function(xhr) {
    // 401 means token is expired
    // Redirect to login
    if(xhr.status === 401) {
      loggedIn = false;
      chrome.storage.local.remove('token');
      token = "";
      loadLogin();
    }
  });
}

function loadContent() {
  $('#content').html(productSnippet);

  $('#product h1').html('<i class="fa fa-spinner fa-pulse fa-2x text-orange"></i>');

  // Make sure the url is amazon or zappos
  // If it is, initiate content scripts to extract relevant information
  chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
      var url = tabs[0].url;

      if(url.indexOf('amazon.com')>=0) {
        getProduct('amazon');  
      } else {
        if (url.indexOf('zappos.com')>=0) {
          getProduct('zappos');
        } else {
          loadEmailSnippet('#product',wrongSiteHTML);
          $('#scores').empty();
        }
      }
  });

  // enable listener to get product information
  chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) { 
          if (request.product) {
            apiCall({
              method: 'GET',
              url: 'profile/scores/product/?use_generics=false&name=' + request.product.replace(' ', '%20'),
              data: request
            })
            .done(function (data) {
              if(data.error) {
                loadEmailSnippet('#product',productNotFoundSnippet);

                $('#scores').empty();

                // Add product name
                $('#productName').html(request.product);

                // Make sure links open in new tab
                activateLinks();

              } else {
                
                $('#product h1').html(data.Product.company + ": " + data.Product.name); 
                
                $('.companyScores').empty();

                $('#personalized').html('<h3>Your Personal Ethical Score:</h3>');

                var sum = 0, counted=0;
                $.each(data.scores[0].categories, function (i, val) {
                  var plural = val.count != 1 ? 's' : '';
                  var li = '<li data-toggle="tooltip" data-placement="top" title="' + val.category + '">' +
                    '<div class="category ' + (i%2===0 ? 'left' : 'right') + ' ">' +
                      '<span class="fa-stack">' +
                        '<i class="fa fa-stack-2x fa-circle"></i>' +
                        '<i class="fa fa-stack-1x fa-inverse fa-' + categoryIcons[val.category] + '"></i> ' +
                      '</div>' +
                   '</span><svg id="' + val.category.replace(' ','-') + '"></svg>' + 
                  '<br />' +
                  '<div class="text-light text-small score-count">(from ' + val.count + ' data point' + plural + ')</div>' +
                  '</li>';

                  i%2===0 ? $('#companyScores-left').append(li) : $('#companyScores-right').append(li);

                  scoreSlider({
                    'svg': val.category.replace(' ','-'),
                    'showRange': false,
                    'score': val.score,
                    'width': 180,
                    'margin': 10,
                    'showPointer': false
                  });

                });

                $('#overall').html('<svg id="overall-slider"></svg>');

                scoreSlider({
                  'svg': 'overall-slider',
                  'showRange': true,
                  'score': data.scores[0].overall
                });

                $('#overall').append('<h3>Individual Category Scores:</h3>');

                // Add link to scoring info
                $('#linkDiv').html('<button id="scoreExplanation" class="btn btn-full btn-footer">Learn More about Scoring</btn>');
                $('#scoreExplanation').on('click',loadExplanation);

                // Make sure links open in new tab
                activateLinks();
                
                $('li').tooltip();
              }
            })
            .fail(function (xhr) {
              console.log(xhr.JSONResponse);
            });
          } else {
            loadEmailSnippet('#product',noProductSnippet);
            $('#scores').empty();
          }
  });

  function scoreText (score) {
    return '<span class="score ' + scoreClass(score) + '">' + (Math.round(score*10)/10).toFixed(1) + '</span>';
  }
}

function scoreClass (score) {
  if (score < 0) {
    return "negative";
  } else {
    if (score > 0) {
      return "positive";
    } else {
      return "neutral";
    }
  }
}

function loadExplanation () {
  $('#content').html(explanationText);

  $('#backButton').on('click',loadContent);

  activateLinks();
}

// API Call framework
function apiCall(args) {
  // Set AJAX parameters
  var params = {
    method: args.method || "GET",
    contentType: 'application/json; charset=UTF-8',
    url: "https://api.axiologue.org/" + args.url,
    data: JSON.stringify(args.data) || {},
    headers: {
      'Access-Control-Allow-Credentials': 'true',
    },
  };

  // Add the auth token, if logged in
  if(token) {
    params.headers.Authorization = 'Token ' + token;
  }

  return $.ajax(params);
}


// Launch product scraping
function getProduct (site) {
  if (site === 'amazon') {
    chrome.tabs.executeScript(null, {file: 'js/amazon.js'});
  } 
  if(site === 'zappos') {
    chrome.tabs.executeScript(null, {file: 'js/zappos.js'});
  }
}

function loadEmailSnippet(div, snippet) {
  // Load the Wrong site html
  $(div).html(snippet);

  // Add functional mailto link
  $('.email').click(function(){
      var hrefString = $(this).attr('href');
      var myWindow = window.open(hrefString, "Opening mail client", "width=200, height=100");
          myWindow.document.write("<p>Opening mail client.Please wait!!</p>");
          setTimeout(function(){ myWindow.close(); }, 2000);
      });

}

function activateLinks() {
  $('.link').on('click', function(){
       chrome.tabs.create({url: $(this).attr('href')});
       return false;
     });
}  
