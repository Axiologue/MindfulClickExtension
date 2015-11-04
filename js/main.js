// HTML SNIPPETS

var loginSnippet = '<h3>Login</h3><div id="errorMessage"></div><form id="loginForm"><label for="username">Username:</label><input type="text" id="username" name="username" placeholder="username"><label for="password">Password:</label><input type="password" name="password" id="password" placeholder="password"><button name="Submit" value="Submit" type="submit">Submit</button></form>';

var companySnippet = '<h3>Get Company Score</h3><form id="getCompanyForm"><label for="company">Company:</label><select id="company" name="company"><option value-"">------- Select Company --------</option></select><button type="submit" value="Submit" name="Submit">Get Company Score</button></form><hr><div id="results"><ul id="companyScores"></ul></div><button id="logout">Logout</button>';
// Login info

var loggedIn = false;
var errorMsg = "";
var token = "";

// First load

window.onload = function () {
  // Attempt to get the auth token from storage
  chrome.storage.local.get('token',function (item) {
    // if the Token is aviable, retrieve it and set loggedIn to true
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
  $('#content').append(loginSnippet);
  
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

        $('#content').empty();

        loadMain();
      })
      .fail(function (xhr, textStatus, error) {
        // Clear any error message
        if(errorMsg) {
          $('#errorMessage').empty();
        }

        // Add new error message
        errorMsg = "<h3>" + xhr.responseJSON.non_field_errors[0] + " </h3>";
        $("#errorMessage").append(errorMsg);
        
      });
    }
    // Stop form submission
    e.preventDefault();
  });
}

// Main Content Page
function loadMain() {
  $('#content').append(companySnippet);

  $('#logout').click(logout);

  // get the list of companies and populate the company selector
  apiCall({
    method: 'GET',
    url: 'articles/companies/all/'
  }).done(function (data) {
    $.each(data, function (i, val) {
      var option = "<option value=" + val.id + ">" + val.name + "</option>";
      $('#company').append(option);
    });
  });

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

