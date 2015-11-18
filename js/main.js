// HTML SNIPPETS

var loginSnippet = 
  '<h3>Login</h3>' +
  '<div id="errorMessage">' +
  '</div>' +
  '<form id="loginForm">' +
    '<label for="username">Username:</label>' +
    '<input type="text" id="username" name="username" placeholder="username">' + 
    '<label for="password">Password:</label>' +
    '<input type="password" name="password" id="password" placeholder="password">' +
    '<button name="Submit" value="Submit" type="submit">Submit</button>' +
  '</form>';

var companySnippet = 
  '<div id="product">' +
  '</div>' +
  '<div id="score">' +
   '<h3>Get Company Score</h3>' + 
     '<form id="getCompanyForm">' + 
      '<label for="company">Company:</label>' +
      '<select id="company" name="company">' +
        '<option value-"">------- Select Company --------</option>' +
      '</select>' +
      '<button type="submit" value="Submit" name="Submit">Get Company Score</button>' +
     '</form>' +
     '<hr>' +
    '<div id="results">' +
     '<ul id="companyScores">' +
     '</ul>' +
    '</div>' +
  '</div>' +
  '<button id="logout">Logout</button>';

var wrongSiteHTML = '<p>Unfortunately, this extension currently only supports looking up shoes at Amazon.com and Zappos.com.  If you\'re looking for additional functionality, please <a href="MAILTO:info@axiologue.org">reach out</a> with your suggestions.</p>';

var rightSiteHTML = "<p>This is amazon or zappos!</p>";


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
  
}

// Switch To Login Page
function loadLogin() {
  // Load the login HTML
  $('#content').html(loginSnippet);
  
  // Add the submit function
  $('#loginForm').on('submit', function (e) {
    var un = $('input[name="username"]').val();
    var pass = $('input[name="password"]').val();

    // Simple form validation
    if (!un || !pass) {
      // Check to see if an error message has already been given
      if(errorMsg) {
        $('#errorMessage').empty();
      }
      
      errorMsg = "<h3>Please Enter Your Username and Password</h3>";
      // Load existing error message
      $('#errorMessage').append(errorMsg);
      
    } else {
      // Login API call   
      apiCall({
        method: 'POST',
        url: 'rest-auth/login/',
        data: {
          username: un,
          password: pass
        }
      })
      .done(function (data, textStatus, xhr) {
        chrome.storage.local.set({'token':data.key});
        token = data.key;
        loadMain();
      })
      .fail(function (xhr, textStatus, error) {
        // Clear any error message
        if(errorMsg) {
          $('#errorMessage').empty();
        }

        // Add new error message
        errorMsg = "<h3>" + xhr.responseJSON + " </h3>";
        $("#errorMessage").append(errorMsg);
        
      });
    }
    // Stop form submission
    e.preventDefault();
  });
}

// Main Content Page
function loadMain() {
  $('#content').html(companySnippet);

  // get the list of companies and populate the company selector
  apiCall({
    method: 'GET',
    url: 'articles/companies/all/'
  })
  .done(function (data) {
    $.each(data, function (i, val) {
      var option = "<option value=" + val.id + ">" + val.name + "</option>";
      $('#company').append(option);
    })
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
          $('#product').html(wrongSiteHTML);
        }
      }
  });

  // enable listener to get product information
  chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) { 
          if (request.product) {
            //$('#product').html('<p>You are looking at: ' + request.product + ' by ' + request.brand + '.<p>');
            apiCall({
              method: 'POST',
              url: 'articles/products/fetch/',
              data: request
            })
            .done(function (data) {
              if(data.error) {
                $('#product').html('<p>We couldn\'t find that product in our servers.  If you think this is a mistake, send us an <a href="MAILTO:info@axiologue.org">email</a> or considering <a href="http://data.axiologue.org">adding it</a>.<p>');
              } else {
                
                $('#product').html('<p>product is: ' + data.name + '</p>'); 
                //$('#product').html('<p>You are looking at: ' + data.name + '.<p>');
              }
            })
            .fail(function (xhr) {
              console.log(xhr.JSONResponse);
            });
          } else {
            $('#product').html('<p>Hmmm.  We weren\'t able to find a product on this page.</p>');
          }
  });

  // enable logout function
  $('#logout').click(logout);


  // add ability to get company-wide scores
  $('#getCompanyForm').on('submit', function (e) {
    var id = $('#company').val();

    // Get personalized scores if an option was selected
    if (id) {
      apiCall({
        method: 'GET',
        url: 'profile/scores/company/' + id + '/'
      })
      .done(function (data) {
        $('#companyScores').empty();

        $.each(data, function (i, val) {
          var li = "<li>" + val.category + ": " + val.score + "</li>";

          $('#companyScores').append(li);
          
        });
      });
    }

    // Stop form submission
    e.preventDefault();
  });
}

// API Call framework
function apiCall(args) {
  // Set AJAX parameters
  var params = {
    method: args.method || "GET",
    url: "http://api.axiologue.org/" + args.url,
    data: args.data || {},
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

// Function to logout of of Axiologue API
function logout () {
  apiCall({
    method: 'POST',
    url: 'rest-auth/logout/'
  })
  .done(function () {
    // Remove all login credentials
    loggedIn = false;
    token = ""
    chrome.storage.local.remove('token');

    // Reset to login page
    $('#content').empty();
    loadLogin();
  })
  .fail(function (xhr) {
    console.log(xhr);
  });
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
