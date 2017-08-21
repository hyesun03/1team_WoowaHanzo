// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /messages/:pushId/original
exports.addMessage = functions.https.onRequest((req, res) => {
  // Grab the text parameter.
  const original = req.query.text;
  // Push the new message into the Realtime Database using the Firebase Admin SDK.
  admin.database().ref('/messages').push({original: original}).then(snapshot => {
    // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
    res.redirect(303, snapshot.ref);
  });
});

// Listens for new messages added to /messages/:pushId/original and creates an
// uppercase version of the message to /messages/:pushId/uppercase
exports.makeUppercase = functions.database.ref('/messages/{pushId}/original')
    .onWrite(event => {
      // Grab the current value of what was written to the Realtime Database.
      const original = event.data.val();
      console.log('Uppercasing', event.params.pushId, original);
      const uppercase = original.toUpperCase();
      // You must return a Promise when performing asynchronous tasks inside a Functions such as
      // writing to the Firebase Realtime Database.
      // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
      return event.data.ref.parent.child('uppercase').set(uppercase);
    });


exports.getTagQuery = functions.database.ref("/tagQuery/{queryId}/tag")
  .onCreate(event => {
    var original = event.data.val();
    original = original.substring(1, original.length);
    var uppercase = original.toUpperCase();

    var key = event.data.ref.parent.key;
    return admin.database().ref("/tagQuery/" + key).once("value").then(snapshot => {
      var ret = [1];
      var updates = {};
      updates["/tagQuery/" + key + "/queryResult"] = ret;
      console.log(snapshot.key);
      //return admin.database().ref().update(updates);
      return admin.database().ref("/posts").orderByChild("time").once("value").then(snapshot => {
        var childList = [];
        snapshot.forEach(function(item) {
          childList.push(item);
        });

        childList.forEach(child => {
          console.log(child.val().tags);
          console.log(original);
          if(child.val().tags.indexOf(original) >= 0) {
            ret.push(child.key);
          }
        });
        return event.data.ref.parent.child("queryResult").set(ret);
      });
      console.log(ret);

    });

    event.tag = original;

  });

exports.handlePostUpload = functions.database.ref("/posts/{postId}")
  .onCreate(event => {
    var key = event.data.key;
    var original = event.data.val();
    var promises = [];
    promises.push(admin.database().ref("/postLikes/" + key + "/userList").set([1]));
    promises.push(admin.database().ref("/postLikes/" + key + "/likes").set(0));
    return Promise.all(promises);
  });

exports.handleLikeRequest = functions.database.ref("/likeRequest/{likeId}")
  .onCreate(event => {
    var key = event.data.key;
    var value = event.data.val();

    var postId = value.postId;
    var uid = value.uid;
    return admin.database().ref("/postLikes/" + postId).once("value").then(snapshot => {
      var promises = [];
      var update = {};
      var userList = snapshot.val().userList.slice();
      if(!userList || userList.length == 0) {
        userList = [1];
      }

      console.log(1, userList.indexOf(uid));
      console.log(3, userList);
      console.log(2, uid);
      console.log(4, Object.keys(userList).length);
      // inside userList
      if(userList.indexOf(uid) >= 0) {
        var index = userList.indexOf(uid);
        //userList = userList.splice(index, 1);
        console.log(userList);
        promises.push(admin.database().ref("/postLikes/" + postId + "/userList/" + index).remove());//.set(userList));
        promises.push(admin.database().ref("/postLikes/" + postId + "/likes").set(Object.keys(userList).length - 2));
        promises.push(admin.database().ref("/likeRequest/" + key + "/result/count").set(Object.keys(userList).length - 2));
        promises.push(admin.database().ref("/likeRequest/" + key + "/result/state").set("false"));
      } else {
        userList.push(uid);
        promises.push(admin.database().ref("/postLikes/" + postId + "/userList").set(userList));
        promises.push(admin.database().ref("/postLikes/" + postId + "/likes").set(Object.keys(userList).length - 1));
        promises.push(admin.database().ref("/likeRequest/" + key + "/result/count").set(Object.keys(userList).length - 1));
        promises.push(admin.database().ref("/likeRequest/" + key + "/result/state").set("true"));
      }
      return Promise.all(promises);
    });
  });
