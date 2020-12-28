function login() {
    let userName = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    if(!userName||!password) {
      alert("Please enter a username and password");
      return;
   }
 
    let obj = {userName: userName, password: password};
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
       if (this.readyState == 4 && (this.status == 200 || this.status == 401)) {
         if(this.status == 200) {
            window.location.href = "/users/"+this.responseText;
            return;
         }

         alert(this.responseText);
      }
    };
    xhttp.open("POST", "/login", true);
    xhttp.setRequestHeader("content-type", "application/json")
    xhttp.send(JSON.stringify(obj));
 }

 function signup() {
   let userName = document.getElementById("username").value;
   let password = document.getElementById("password").value;

   if(!userName||!password) {
      alert("Please enter a username and password");
      return;
   }

   let obj = {userName: userName, password: password};
   let xhttp = new XMLHttpRequest();
   xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && (this.status == 200 || this.status == 401)) {
         if(this.status == 200) {
            window.location.href = "/users/"+this.responseText;
            return;
         }
         alert(this.responseText);
      }
   };
   xhttp.open("POST", "/signup", true);
   xhttp.setRequestHeader("content-type", "application/json")
   xhttp.send(JSON.stringify(obj));
 }

 function logout() {
   let xhttp = new XMLHttpRequest();
   xhttp.open("POST", "/logout", true);
   xhttp.send();
 }

function changeContribution() {
   let checkbox = document.getElementById("contributionCheckbox")
   let userName = document.getElementById("username").innerText;
   let xhttp = new XMLHttpRequest();
   xhttp.onreadystatechange = function () {
      if(this.readyState == 4 && this.status == 200) {
         alert("You have successfully changed your contribution status.")
      }
   };
   xhttp.open("PUT","/users/"+userName,true)
   xhttp.setRequestHeader("content-type", "application/json")
   xhttp.send(JSON.stringify({isContributing: checkbox.checked}));
}

function followPerson(userName) {
   let pName = document.getElementById("actor-page-name").innerText;

   let xhttp = new XMLHttpRequest();
   xhttp.onreadystatechange = function () {
      if(this.readyState == 4 && this.status == 200) {
         location.reload();
      }
      if(this.readyState == 4 && this.status == 406) {
         alert(this.responseText)
      }
   };
   xhttp.open("PUT","/users/"+userName,true)
   xhttp.setRequestHeader("content-type", "application/json")
   xhttp.send(JSON.stringify({followPerson: true, pName: pName}));
}

function unfollowPerson(userName) {
   let followDiv = document.getElementById("follow-list")
   let inputs = followDiv.getElementsByTagName("input");

   let targetPersonName = null;

   for(let i = 0; i < inputs.length; i++) {
      if(inputs[i].checked) {
         targetPersonName = inputs[i].value;
         break;
      }
   }

   if(targetPersonName === null) {
      alert("Select a person to unfollow")
      return;
   }

   let xhttp = new XMLHttpRequest();
   xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
            window.location.href = "/users/"+userName;
            return;
      }
   };

   xhttp.open("PUT","/users/"+userName,true)
   xhttp.setRequestHeader("content-type", "application/json")
   xhttp.send(JSON.stringify({followPerson: false, pName: targetPersonName})); 
}

function followUser(userName) {
   let uName = document.getElementById("username").innerText;

   let xhttp = new XMLHttpRequest();
   xhttp.onreadystatechange = function () {
      if(this.readyState == 4 && this.status == 200) {
         location.reload();
      }
      if(this.readyState == 4 && this.status == 406) {
         alert(this.responseText)
      }
   };
   xhttp.open("PUT","/users/"+userName,true)
   xhttp.setRequestHeader("content-type", "application/json")
   xhttp.send(JSON.stringify({followUser: true, uName: uName}));
}

function unfollowUser(userName) {
   let followDiv = document.getElementById("user-follow-list")
   let inputs = followDiv.getElementsByTagName("input");

   let targetUserName = null;

   for(let i = 0; i < inputs.length; i++) {
      if(inputs[i].checked) {
         targetUserName = inputs[i].value;
         break;
      }
   }

   if(targetUserName === null) {
      alert("Select a user to unfollow")
      return;
   }

   let xhttp = new XMLHttpRequest();
   xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
            window.location.href = "/users/"+userName;
            return;
      }
   };

   xhttp.open("PUT","/users/"+userName,true)
   xhttp.setRequestHeader("content-type", "application/json")
   xhttp.send(JSON.stringify({followUser: false, uName: targetUserName})); 
}

function addReview() {
   let reviewScore = document.getElementById("new-review-score").value;
   let reviewSummary = document.getElementById("new-review-summary").value;
   let reviewText = document.getElementById("new-review-text").value;
   let reviewType = "basic"

   if(!reviewScore) {
      alert("Must include a score at minimum")
      return;
   }

   if(isNaN(reviewScore) || reviewScore > 10 || reviewScore < 0) {
      alert("Invalid review score");
      return;
   }

   if((reviewSummary === "" && reviewText !== "") || (reviewSummary !== "" && reviewText === "")) {
      alert("To create a full review both text fields must be full. If you want to create a basic review only include the score.");
      return;
   }

   if(reviewSummary !== "" && reviewText !== "") {
      reviewType = "full"
   }

   let xhttp = new XMLHttpRequest();
   xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
         location.reload();
         return;
      }
   };

   xhttp.open("PUT", window.location.href, true)
   xhttp.setRequestHeader("content-type", "application/json")
   xhttp.send(JSON.stringify({score: reviewScore, summary: reviewSummary, text: reviewText, type: reviewType}))
}

function clearNotifications() {
   let userName = document.getElementById("username").innerText;

   let xhttp = new XMLHttpRequest();
   xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
         location.reload();
      }
   };

   xhttp.open("PUT","/users/"+userName,true)
   xhttp.setRequestHeader("content-type", "application/json")
   xhttp.send(JSON.stringify({userName: userName, clearingNotifications: true})); 
}

function updateMovie() {
   let newDirector = document.getElementById("newDirectorInput").value;
   let newWriter = document.getElementById("newWriterInput").value;
   let newActor = document.getElementById("newActorInput").value;

   let xhttp = new XMLHttpRequest();
   xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
         location.reload();
      }
   };

   xhttp.open("PUT",window.location.href,true);
   xhttp.setRequestHeader("content-type", "application/json")
   xhttp.send(JSON.stringify({editingCast: true,newDirector,newActor,newWriter}))
}

function changePage(change) {
   let url = window.location.href;
   if(url.indexOf("page=") === -1) {
      if(change === "increment") {
      window.location.href = url+"&page=1";
      } else if(change === "decrement") {
      window.location.href = url+"&page=0";
      }
      return;
   }
   let newUrl = url.substring(0, url.indexOf("page="));

   let queryList = location.search.split("&");
   let pageNum = 0;
   queryList.forEach(q => {
      if(q.includes("page=")) {
         pageNum = q.split("=")[1];
      }
   });

   if(!parseInt(pageNum)) {
      pageNum = 0;
   }

   if(change === "increment") {
      pageNum++;
   } else if(change === "decrement") {
      pageNum--;
   }

   if(pageNum < 0) pageNum = 0;
   newUrl = newUrl + "page=" + pageNum;
   window.location.href = newUrl;
}