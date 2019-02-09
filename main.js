
'use strict';


// Shortcuts to DOM Elements.
var signInButton = document.getElementById('sign-in-button');
var signOutButton = document.getElementById('sign-out-button');
var addFileButton = document.getElementById('add-file');
var fileButton = document.getElementById('fileButton');
var splashPage = document.getElementById('page-splash');
var listeningFirebaseRefs = [];

var ref = firebase.database().ref('files');
var file = null;
var lines =0;

/**
 * Starts listening for new posts and populates posts lists.
 */
function startDatabaseQueries() {
  
}
/**
 * Writes the user's data to the database.
 */
// [START basic_write]
function writeUserData(userId, name, email, imageUrl) {
    firebase.database().ref('users/' + userId).set({
      username: name,
      email: email,
      profile_picture : imageUrl
    }).then(() =>
      firebase.database().ref('logins').push().set({
            userId: userId,
            email: email,
            logindate : Date()
        }) 
    );
  }
  // [END basic_write]

/**
 * The ID of the currently signed-in User. We keep track of this to detect Auth state change events that are just
 * programmatic token refresh but not a User status change.
 */
var currentUID;

/**
 * Triggers every time there is a change in the Firebase auth state (i.e. user signed-in or user signed out).
 */
function onAuthStateChanged(user) {
  // We ignore token refresh events.
  if (user && currentUID === user.uid) {
    return;
  }

  if (user) {
    currentUID = user.uid;
    splashPage.style.display = 'none';
    writeUserData(user.uid, user.displayName, user.email, user.photoURL);
    startDatabaseQueries();
  } else {
    // Set currentUID to null.
    currentUID = null;
    // Display the splash page where you can sign-in.
    splashPage.style.display = '';
  }
}


// Bindings on load.
window.addEventListener('load', function() {
  // Bind Sign in button.
  signInButton.addEventListener('click', function() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider);
  });

  // Bind Sign out button.
  signOutButton.addEventListener('click', function() {
    firebase.auth().signOut();
  });

  addFileButton.addEventListener('click', function() {
    if (currentUID!=null && file!=null) {
      var storageRef = firebase.storage().ref('fm/' + file.name);
      var task = storageRef.put(file);
      task.on('state_changed',
        function progress(snapshot) {    },
        function error(err) {    },
        function complete() {
          storageRef.getDownloadURL().then(url=>{
            var varFile = {
              name: file.name,
              size: file.size,
              type: file.type,
              dateModified : formatedToday(),
              urlDownload: url
            };
            ref.push(varFile).then(snapshot => {
              addFileOnScreen(varFile, snapshot.key);
            });
          })
        }
      );
    }
  });

  // Initialize Firebase
  fileButton.addEventListener('change', function(e) {
    file = e.target.files[0];
  });
  // Listen for auth state changes
  firebase.auth().onAuthStateChanged(onAuthStateChanged);
  lines =0;
  ref.on('value', snapshot => {
    snapshot.forEach(value => {
      addFileOnScreen(value.val(), value.key);
    });
    ref.off('value');
  }, err => {
    console.log('erro no on', err);
  });
}, false);


function deleteFile(name, key) {
  ref.child(key).remove().then(() => {
    firebase.storage().ref('fm/' + name).delete().then(() =>{
      document.getElementById(key).style.display = 'none';
    });
  });
   
}

function addFileOnScreen(data, key) {
  let tbody = document.getElementById("fileTable");
  var tr = document.createElement("tr");
  tr.setAttribute('id', key);

  tr.appendChild(createTD(data.name));
  tr.appendChild(createTD(data.size));
  tr.appendChild(createTD(data.type));
  tr.appendChild(createTD(data.dateModified));
  var td = document.createElement("td");
  var btnDelete = document.createElement('button');
  btnDelete.className = "mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab mdl-button--accent";
  btnDelete.setAttribute('onclick', 'deleteFile("'+data.name+'","'+key+'");');
  btnDelete.appendChild(createIcon("delete"));
  td.appendChild(btnDelete);
  var btnDownload = document.createElement('button');
  btnDownload.className = "mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab mdl-button--colored";
  btnDownload.appendChild(createIcon("cloud_download"));
  btnDownload.setAttribute('onclick', 'window.open("'+data.urlDownload+'","_blank");');
  td.appendChild(btnDownload);

  tr.appendChild(td);
  tbody.appendChild(tr);
}

function createIcon(icon) {
  var i = document.createElement("i");
  i.className="material-icons";
  var t = document.createTextNode(icon);
  i.appendChild(t);
  return i;
}

function createTD(txt) {
  var td = document.createElement("td");
  td.appendChild(document.createTextNode(txt));
  return td;
}

function formatedToday() { 
  var d = new Date();
  return  d.getDate()  + "/" + (d.getMonth()+1) + "/" + d.getFullYear() + " " + d.getHours() + ":" + d.getMinutes();
}
