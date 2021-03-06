// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.getTagQuery = functions.database.ref("/tagQuery/{queryId}/tag")
  .onCreate(event => {
    var original = event.data.val();
    original = original.substring(1, original.length);
    var uppercase = original.toUpperCase();

    var key = event.data.ref.parent.key;
    return admin.database().ref("/tagQuery/" + key).once("value").then(snapshot => {
      var ret = ["1"];
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
          if(child.val().tags && child.val().tags.indexOf(original) >= 0) {
            ret.push(child.key);
          }
        });
        return event.data.ref.parent.child("queryResult").set(ret);
      });
      console.log(ret);

    });

    event.tag = original;

  });

exports.getUserQuery = functions.database.ref("/userQuery/{queryId}/uid")
  .onCreate(event => {
    var original = event.data.val();
    var key = event.data.ref.parent.key;
    var ret = ["1"];
    return admin.database().ref("/posts").orderByChild("time").once("value").then(snapshots => {
      var childList = [];
      snapshots.forEach(function(item) {
        if(item.val().uid == original) {
          ret.push(item.key);
        }
      });
      return event.data.ref.parent.child("queryResult").set(ret);
    });
  });

exports.handlePostUpload = functions.database.ref("/posts/{postId}")
  .onCreate(event => {
    var key = event.data.key;
    var original = event.data.val();
    var promises = [];
    promises.push(admin.database().ref("/postLikes/" + key + "/userList").set(["1"]));
    promises.push(admin.database().ref("/postLikes/" + key + "/likes").set(0));
    if(event.data.val().tags) {
      var tagList = event.data.val().tags;
      for(var i = 0; i < tagList.length; ++i) {
        promises.push(admin.database().ref("/tagCounter/" + tagList[i]).once("value").then(snapshot => {
          console.log(tagList[i]);
          return admin.database().ref("/tagCounter/" + snapshot.key + "/time").set(-Date.now());
        }));
      }
    }
    return Promise.all(promises);
  });

exports.handleLikeRequest = functions.database.ref("/likeRequest/{likeId}")
  .onCreate(event => {
    var key = event.data.key;
    var value = event.data.val();
    var promises = [];

    var postId = value.postId;
    var uid = value.uid;
    return admin.database().ref("/postLikes/" + postId).once("value").then(snapshot => {

      var update = {};
      var userList = snapshot.val().userList.slice();
      if(!userList || userList.length == 0) {
        userList = ["1"];
      }

      // inside userList
      if(userList.indexOf(uid) >= 0) {
        var index = userList.indexOf(uid);
        //userList = userList.splice(index, 1);
        console.log(userList);
        promises.push(admin.database().ref("/postLikes/" + postId + "/userList/" + index).remove());//.set(userList));
        promises.push(admin.database().ref("/postLikes/" + postId + "/likes").set(Object.keys(userList).length - 2));
        promises.push(admin.database().ref("/likeRequest/" + key + "/result/count").set(Object.keys(userList).length - 2));
        promises.push(admin.database().ref("/likeRequest/" + key + "/result/state").set("false"));
        admin.database().ref("/posts/" + postId).once("value").then(snapshot => {
          var authorId = snapshot.val().uid;
          admin.database().ref("/users/" + authorId).once("value").then(snapshot => {
            var userData = snapshot.val();
            if(!userData.likes) {
              promises.push(admin.database().ref("/users/" + authorId + "/likes").set(0));
            } else {
              promises.push(admin.database().ref("/users/" + authorId + "/likes").set(userData.likes - 1));
            }
          });
          return Promise.all(promises);
        });
      } else {
        userList.push(uid);
        promises.push(admin.database().ref("/postLikes/" + postId + "/userList").set(userList));
        promises.push(admin.database().ref("/postLikes/" + postId + "/likes").set(Object.keys(userList).length - 1));
        promises.push(admin.database().ref("/likeRequest/" + key + "/result/count").set(Object.keys(userList).length - 1));
        promises.push(admin.database().ref("/likeRequest/" + key + "/result/state").set("true"));
        admin.database().ref("/posts/" + postId).once("value").then(snapshot => {
          var authorId = snapshot.val().uid;
          admin.database().ref("/users/" + authorId).once("value").then(snapshot => {
            var userData = snapshot.val();
            if(!userData.likes) {
              promises.push(admin.database().ref("/users/" + authorId + "/likes").set(1));
            } else {
              promises.push(admin.database().ref("/users/" + authorId + "/likes").set(userData.likes + 1));
            }
          });
          return Promise.all(promises);
        });
      }

    }).then(() => {
      return admin.database().ref("/users/").orderByChild("likes").once("value").then(snapshots => {
        var userList = [];
        snapshots.forEach(function(child) {
          userList.push(child);
        });

        userList.reverse();
        for(var i = 0; i < userList.length; ++i) {
          console.log(i, userList[i].val().username, userList[i].val().likes);
          var rankName = "";
          if(i < 1) {
            rankName = "신선";
          } else if(i < 3) {
            rankName = "임금";
          } else if (i < 10) {
            rankName = "왕족";
          } else if (i < 50) {
            rankName = "양반";
          } else {//(i < 100) {
            rankName = "평민";
          }
          promises.push(admin.database().ref("/users/" + userList[i].key + "/rankName").set(rankName));
        }

      });
    });

  });

exports.handleDeleteRequest = functions.database.ref("/deleteRequest/{deleteId}")
  .onCreate(event => {
    var key = event.data.key;
    var promises = [];
    return admin.database().ref("/posts").orderByChild("time").once("value").then(snapshots => {
      var curPost;
      snapshots.forEach(function(child) {
        if(child.key == key) {
          curPost = child;
        }
      });
      var tags = curPost.val().tags;
      var tagsFound = {};
      for(var i = 0; i < tags.length; ++i) {
        tagsFound[tags[i]] = false;
      }

    });
  });
