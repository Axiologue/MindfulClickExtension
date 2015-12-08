// HTML SNIPPETS

var loginSnippet = 
  '<h2 class="center">Welcome!</h2>' +
  '<p><strong>Mindful Click</strong> is an extension to help you buy the products that match your personal ethics.  Our current focus is on athletic shoes. Sign in below to get started!</p>' +
  '<hr>' +
  '<div id="errorMessage" class="error">' +
  '</div>' +
  '<form id="loginForm">' +
    '<label for="username" class="sr-only">Username:</label>' +
    '<input type="text" id="username" name="username" placeholder="Username">' + 
    '<label for="password" class="sr-only">Password:</label>' +
    '<input type="password" name="password" id="password" placeholder="Password">' +
    '<button class="btn btn-full btn-main" name="Submit" value="Submit" type="submit">Login</button>' +
  '</form>' +
  '<hr>' +
  '<button class="btn btn-full btn-main" id="signUp">Sign Up</button>';

var signUpSnippet =
  '<h2 class="center">Sign Up!</h2>' +
  '<div id="errorMessage" class="error">' +
  '</div>' +
  '<form id="signUpForm">' +
    '<label for="first_name" class="sr-only">First Name (optional):</label>' +
    '<input id="first_name" name="first_name" type="first_name" placeholder="First Name (optional)">' +
    '<label for="last_name" class="sr-only">Last Name (optional):</label>' +
    '<input id="last_name" name="last_name" type="last_name" placeholder="Last Name (optional)">' +
    '<div id="emailError" class="error"></div>' +
    '<label for="email" class="sr-only">Email:</label>' +
    '<input id="email" name="email" type="email" placeholder="Email">' +
    '<div id="usernameError" class="error"></div>' +
    '<label for="username" class="sr-only">Username (minimum 6 characters):</label>' +
    '<input id="username" name="username" type="username" placeholder="Username (minimum 6 characters)">' +
    '<div id="password1Error" class="error"></div>' +
    '<label for="password1" class="sr-only">Password (minimum 8 characters):</label>' +
    '<input id="password1" name="password1" type="password" placeholder="Password (minimum 8 characters)">' +
    '<div id="password2Error" class="error"></div>' +
    '<label for="password2" class="sr-only">Confirm Password:</label>' +
    '<input id="password2" name="password2" type="password" placeholder="Confirm Password">' +
    '<button class="btn btn-full btn-main" type="submit" value="Submit" name="Submit">Sign Up</button>' +
  '</form>';

// Switch to Signup Page
function loadSignup() {
  // Load Signup HTML
  $('#content').html(signUpSnippet);

  // Handle form submissions
  $('#signUpForm').on('submit',function(e) {
    $('.error').empty();
    errorMsg = ''

    // Get data from form
    var data = {
      first_name: $('input[name="first_name"]').val(),
      last_name: $('input[name="last_name"]').val(),
      email: $('input[name="email"]').val(),
      username: $('input[name="username"]').val(),
      password1: $('input[name="password1"]').val(),
      password2: $('input[name="password2"]').val()
    };

    // Check for required fields
    if (!data.username || !data.password1 || !data.password2 || !data.email) {
      
      errorMsg = "<h3>Please Enter Your Username and Password</h3>";
      // Load existing error message
      $('#errorMessage').append(errorMsg);
      
    } else {
      // Sign Up API call
      apiCall({
        method: 'POST',
        url: 'rest-auth/registration/',
        data: data
      })
      .done(function (data, textStatus, xhr) {
        // Add placeholder to wait for email
        $('#content').html('<h3>Please Wait for the Confirmation email</h3>');
      })
      .fail(function (xhr, textStatus, error) {
        var fields = ['email','username','password1','password2'];

        // Add any field spefici errors
        for (var i = 0; i < fields.length; i++) {
          if (xhr.responseJSON[fields[i]]) {
            for (var j = 0; j < xhr.responseJSON[fields[i]].length; j++) {
              // construct errorMsg
              errorMsg = '<h4>' + xhr.responseJSON[fields[i]][j] + '</h4>';
              // get error div ID;
              var errorId = '#' + fields[i] + 'Error';
              console.log(errorId + " " + errorMsg);
              // add error field 
              $(errorId).append(errorMsg);
            }
          }
        }

        // Add any non-field errors
        fields = ['non_field_errors','__all__'];
        
        for(var j = 0; j < fields.length; j++) {
          if (xhr.responseJSON[fields[j]]) {
            for (i = 0; i < xhr.responseJSON[fields[j]].length; i++) {
              errorMsg = "<h3>" + xhr.responseJSON[fields[j]][i] + " </h3>";
              $("#errorMessage").append(errorMsg);
            }
          }
        }

      });
    }

    // Stop form submission
    e.preventDefault();
  });
}

// Switch To Login Page
function loadLogin() {
  // Load the login HTML
  $('#content').html(loginSnippet);
  
  // Add the submit function
  $('#loginForm').on('submit', function (e) {
    // Clear any error messages
    $(".error").empty();

    var un = $('input[name="username"]').val();
    var pass = $('input[name="password"]').val();

    // Simple form validation
    if (!un || !pass) {
      
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
        
        // Add new error message
        for (var i = 0; i < xhr.responseJSON.non_field_errors.length; i++) {
          errorMsg = "<h3>" + xhr.responseJSON.non_field_errors[i] + " </h3>";
          $("#errorMessage").append(errorMsg);
        }
        
      });
    }
    // Stop form submission
    e.preventDefault();
  });

  // Add button click to signUp button
  $('#signUp').on('click',loadSignup);
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

    // Remove logout button
    $('#logoutWrap').empty();

    // Reset to login page
    $('#content').empty();

    loadLogin();
  })
  .fail(function (xhr) {
    console.log(xhr);
  });
}

function loadLogout() {
  $('#logoutWrap').html('<button class="btn btn-footer" id="logout">Logout <i class="fa fa-fw fa-power-off"></i></button>');

  // enable logout function
  $('#logout').click(logout);
}
