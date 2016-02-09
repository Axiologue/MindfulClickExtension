// HTML SNIPPETS

var questionSnippet =
  '<h3 class="center">Profile setting questions</h3>' +
  '<hr >' +
  '<div id="questions">' + 
    '<p>Answer the following questions to help us set your default ethical preferences. These preferences allow us to tailor our rankings specifically to your own personal beliefs.  You can adjust these preferences at any point by going to your profile page at data.axiologue.org</p>' +
    '<p>Note: these answers will never be shared with anyone, and are solely used to set your initial profile</p>' +
    '<button id="startQuestions" class="btn btn-full btn-main">Get Started</button>' +
  '</div>';

var thankYouSnippet = 
  '<h1 class="center">Thank You For Signing Up!</h1>' +
  '<hr>' +
  '<div>Find a product on amazon.com or zappos.com to get your personalized score!  When you\'re on a product page, click on the extension button to see your score!</div>';

// Question setting view
function loadQuestions() {
  $('#content').html(questionSnippet);

  // variable to hold the questions
  var questions = [];
  var answers = [];
  var currentAnswer = 0;

  // Start questions
  $('#startQuestions').on('click',function () {
    // Get the List of questions from the server
    apiCall({ 
      url:'profile/question/all-answers/',
      method:'GET'
    })
    .done(function (data) {
      questions = data;
      loadNext(); 
    })
    .fail(function (xhr) {
      $('#questions').html('<p>We\'re having trouble getting the data from the server.  Please try again later.</p>');
    });

  });

  // function to iterate through the questions
  function loadNext() {
    // Get the next question
    question = questions[currentAnswer];

    // Add the question text and base form
    var questionHTML =
      '<div id="error"></div>' +
      '<h3 class="answer">' + question.question + "</h3>" + 
      '<h4 class="supplement">' + question.supplement + '</h4>'; 

    // Add the Answers
    for (var i=0; i < question.answers.length; i++) {
      var answer = question.answers[i];

      var answerHTML = 
       '<input type="radio" id="answer' + i + '" value="' + answer.id + '" name="answers">' +
        '<label for="answer' + i +'">' + answer.answer + '</label>';

      questionHTML += answerHTML;
    }

    questionHTML += '<div class="answerButtons">';

    if(currentAnswer !== 0) {
      questionHTML += '<button id="previous" class="btn btn-half btn-main left"><i class="fa fa-arrow-left"></i> Previous question</button>';
    }

    if(currentAnswer < questions.length-1) {
      questionHTML += '<button id="next" class="btn btn-half btn-main right">Next Question <i class="fa fa-arrow-right"></i></button>';
    } else {
      questionHTML += '<button id="submit" class="btn btn-half btn-main right">Submit Answers <i class="fa fa-check"></i></button>';
    }

    questionHTML += '</div>';

    $('#questions').html(questionHTML);

    // Add listener to next button
    // If clicked and answer exists, add answer to set of answers
    $('#next').on('click',function (e) {
      if (checkAnswer()) {
        answers[currentAnswer] = +$("input:radio[name=answers]:checked").val(); 
        currentAnswer++;

        loadNext(currentAnswer);
      }
    });

    // Go Back a question
    $('#previous').on('click', function(e) {
      currentAnswer--;
      loadNext(currentAnswer);
    });

    // On last question, if answered, submit answers
    $('#submit').on('click', function(e) {
      if (checkAnswer()) {
        answers[currentAnswer] = +$("input:radio[name=answers]:checked").val(); 

        data = {'answers': answers};

        // send selected answers to server
        apiCall({
          data: data,
          method: 'POST',
          url: 'profile/question/answers/set/'
        })
        // if successful, load main content
        .done(loadThankYou)
        .fail(function (xhr) {
          $('#error').html = xhr.responseJSON;
        });
      }
    });
  }

  // Ensure that an answer is selected before moving to next question
  function checkAnswer() {
    if ($("input:radio[name=answers]:checked").val()) {
      return true;
    } else {
      errorMsg = '<h3 class="error">Please select an answer</h3>';
      $('#error').html(errorMsg);

      return false;
    }
  }

}

function loadThankYou () {
  $('#content').html(thankYouSnippet);
}
