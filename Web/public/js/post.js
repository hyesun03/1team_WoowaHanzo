document.addEventListener("DOMContentLoaded", function(event) {
  console.log("DOM fully loaded and parsed");

  autosize($("textarea"));

  $(".tags_holder").append('<span class="tagger tag_holder">' +
                '<span class="starting_sharp">#</span>' +
                '<input type="text" class="tagger_input" placeholder="" spellcheck="false" />' +
              '</span>');

  $(".tagger_input").autoGrowInput({minWidth:1,comfortZone:3});
  $(".tagger_input").trigger("input");
  $(".tagger_input").last().on("keyup", function(evt) {
    taggerKeyup(evt);
  });

  $(".tagger_input").last().on("keydown", function(evt) {
    taggerKeyDown(evt);
  });

  $(".tagger_input").last().on("focus", function(evt){

  });



  $(".tag_holder").on("click", function(evt) {
    $(this).children(".tagger_input").focus();
  });

});

var keyCodes = [13, 32];

function taggerKeyup(evt) {
  var $curElem = $(evt.target);

  var buffer = $curElem.val().trim(" ");
  var actual = $curElem.last().val();

  console.log(evt.target.text);
  if(evt.target.text != undefined) {
    if(evt.target.text.length == 0 && evt.keyCode == 8 && actual.length == 0 && $(".tagger_input").length > 1) {
      if($(evt.target.parentElement).prev()) {
        $(evt.target.parentElement).prev().children(".tagger_input").focus();
      } else {
        $(evt.target.parentElement).next().children(".tagger_input").focus();
      }
      $(evt.target.parentElement).remove();
      return;
    }
  }



  if(buffer.length == 0) {
    $curElem.last().val(buffer);
  }

  console.log(buffer);
  if((buffer.length > 0 && (buffer.length < actual.length || keyCodes.indexOf(evt.keyCode) >= 0))) {

    buffer = buffer.split(" ").join("");
    $curElem.val(buffer);

    if(!isLastTaggerEmpty()) {
      $curElem.addClass("tagger_complete");
      //$(".tagger_input").last().prop("readonly", true);
      $(".tags_holder").append('<span class="tagger tag_holder">' +
                    '<span class="starting_sharp">#</span>' +
                    '<input type="text" class="tagger_input" placeholder="" spellcheck="false" />' +
                  '</span>');
      $(".tagger_input").last().autoGrowInput({minWidth:1,comfortZone:3});
      $(".tagger_input").last().trigger("update");
      $(".tagger_input").last().focus();

      $(".tagger_input").last().on("keyup", function(evt) {
        taggerKeyup(evt);
      });

      $(".tagger_input").last().on("keydown", function(evt) {
        taggerKeyDown(evt);
      });
    }
  }
}

function taggerKeyDown(evt) {
  var $curElem = $(evt.target);


  var buffer = $curElem.val().trim(" ");
  var actual = $curElem.last().val();

  evt.target.text = buffer;
}

function isLastTaggerEmpty() {
  var buffer = $(".tagger_input").last().val().trim(" ");
  if(buffer.length == 0) {
    return true;
  }
  return false;
}


function uploadPost() {

}

function writeNewPost(uid, username, picture, title, body) {
  // A post entry.
  var postData = {
    author: username,
    uid: uid,
    body: body,
    title: title,
    starCount: 0,
    authorPic: picture
  };

  // Get a key for a new Post.
  var newPostKey = firebase.database().ref().child('posts').push().key;

  // Write the new post's data simultaneously in the posts list and the user's post list.
  var updates = {};
  updates['/posts/' + newPostKey] = postData;
  updates['/user-posts/' + uid + '/' + newPostKey] = postData;

  return firebase.database().ref().update(updates);
}
