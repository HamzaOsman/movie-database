const express = require('express');
let app = express();
const session = require('express-session');

app.set("view engine", "pug");
app.use(express.static('public'));
app.use(session({ secret: 'secret'}));
app.use(express.urlencoded({extended: true}))

//Objects
let users = {
   'testUser1' : {
      userName: "testUser1",
      password: "123",
      avatar: "/img/defaultAvatar.png",
      reviews: [],
      contributingUser: false,
      peopleFollowed: ["Tom Hanks", "Tim Allen"],
      usersFollowed: ["testUser3"],
      usersFollowingUser: ["testUser3"],
      recommendedMovies: ["Toy Story_(1995)", "Aladdin_(1992)"],
      notifications: [],
      moviesWatched: new Set()
   }, 
   'testUser2' : {
      userName: "testUser2",
      password: "123",
      avatar: "/img/defaultAvatar.png",
      reviews: [],
      contributingUser: false,
      peopleFollowed: ["Rowan Atkinson", "Jim Cummings"],
      usersFollowed: [],
      usersFollowingUser: ["testUser3"],
      recommendedMovies: ["Toy Story_(1995)", "Aladdin_(1992)"],
      notifications: [],
      moviesWatched: new Set()
   },
   'testUser3' : {
      userName: "testUser3",
      password: "123",
      avatar: "/img/defaultAvatar.png",
      reviews: [],
      contributingUser: false,
      peopleFollowed: [],
      usersFollowed: ["testUser1", "testUser2"],
      usersFollowingUser: ["testUser1"],
      recommendedMovies: ["Toy Story_(1995)", "Aladdin_(1992)"],
      notifications: [],
      moviesWatched: new Set()
   }
};

console.log("Reading files...")
let people = require("./movie-materials/people-data.json");
let movies = require("./movie-materials/movie-data-updated.json");
console.log("Done...")

app.use(express.json());
app.use(function(req,res,next) {
   //console.log(req.session);
   next();
})
app.get("/", randomMovieList, loadHomePage);
app.get("/homepage", randomMovieList, loadHomePage);

app.get("/people", searchPeople, loadPeopleSearchPage);
app.get("/people/:personID", loadPeoplePage);
app.get("/createPerson/", loadCreatePersonPage)


app.get("/movies/", searchMovies, loadMovieSearchPage);
app.get("/movies/:movieID", loadMoviePage);
app.get("/createMovie/", loadCreateMoviePage)

app.get("/users", searchUser, loadUserSearchPage);
app.get("/users/:userID", loadUserPage);

app.get("/login", loadLoginPage);
app.get("/signup", loadLoginPage);


// POST REQUESTS
app.post("/login", login);
app.post("/signup", signup);
app.post("/logout", auth, logout);
app.post("/movies", createMovie)
app.post("/people", createPeople)


//PUT REQUESTS
app.put("/users/:userID", updateUser)
app.put("/movies/:movieID", updateMovie)



//creating some reviews for initialisation
createRandomReviews() 
function createRandomReviews() {
   let movieID = "Toy Story_(1995)";
   let reviewObj = {score: 10, summary: "random test summary", text: "random test text", type: "full"};
   addReview(movieID, "testUser1", reviewObj)
   reviewObj = {score: 6, type: "basic"};
   addReview(movieID, "testUser1", reviewObj)
}


function loadHomePage(req,res) {
   res.render("pages/homepage.pug", {session: req.session, movieList: req.movieList})
}

function randomMovieList(req,res,next) {
   req.movieList = [];
   let count = 0;

   while(count < 3) {
      let keys = Object.keys(movies);
      let randInt = parseInt(Math.random() * keys.length)
      let tempMovie =  movies[keys[randInt]];
      if(!req.movieList.includes(tempMovie)) {
         req.movieList.push(tempMovie);
         count++;
      }
   }
   next()
}

function loadMoviePage(req,res) {
   let movieID = decodeURI(req.params.movieID); //Send 404 if doesnt exist
   
   if(movies.hasOwnProperty(movieID)) {
      similarMovieList = similarMovies(movies[movieID], 4)

      res.format({
         "application/json": function () {
            res.send({movie: movies[movieID], similarList: similarMovieList})
         },

         "text/html": function() {
            res.render("pages/moviepage.pug", {session: req.session, movie: movies[movieID], similarMovieList, user: users[req.session.userName]})
         }
      })
   } else { 
      res.status(404).send('Movie not found');
   }
}

function loadMovieSearchPage(req,res) {
   res.format({
      "application/json" : function() {
         if(!Object.keys(req.query).length > 0) {
            req.searchResults = movies;
         }
         res.send(req.searchResults)
      },

      "text/html": function() {
         res.render("pages/movie-search-page.pug", {session: req.session, searched: req.searched, movies: req.searchResults})
      }
   })
}

function loadCreateMoviePage(req,res) {
   if(req.session.userName && users[req.session.userName].contributingUser) {
      res.render("pages/createMoviePage.pug", {session: req.session})
   } else {
      res.status(401).send("You must be logged in and a contributing user.")
   }
}

function searchMovies(req, res, next) {
   let query = req.query;
   req.searchResults = []
   //If no queries
   if(!Object.keys(query).length > 0) {
      req.searched = false;
      next();
      return;
   } 
   req.searched = true;

   for(let movie in movies){
      let failed = false;
      let movieObj = movies[movie];

      if(query.title && query.title !== "") {
         if(!movieObj.Title.toLowerCase().includes(query.title.toLowerCase())) {
            continue;
         }
      }

      if(query.year && query.year !== "") {
         if(query.year !== movieObj.Year) {
            continue;
         }
      }

      if(query.minrating && query.minrating !== "") {
         let rating;
         if(movieObj.Reviews.length == 0){
            rating = 0
         } else {
            rating = movieObj.TotalScore / movieObj.Reviews.length
         }

         if(query.minrating > rating) {
            continue;
         }
      }

      if(query.genre && !Array.isArray(query.genre)) {
         query.genre = query.genre.split();
      }

      if(query.genre) {
         for(let j = 0; j < query.genre.length && failed == false; j++) {
            if(!movieObj.Genre.includes(query.genre[j])) {
               failed = true;
            }
         }

         if(failed) continue;
      }

      req.searchResults.push(movieObj);
   }

   req.searchResults.sort(function(a,b) {
      if (a.Title < b.Title) return -1;
      if (a.Title > b.Title) return 1;
      return 0;   
   })

   if(!req.query.page) {
      req.query.page = 0;
   }

   let first = 9*req.query.page;
   let last = Math.min(first+9, req.searchResults.length);
   req.searchResults = req.searchResults.slice(first,last)
   next();
}

//When loading movie page
function similarMovies(movieObj, num) {
   let movieGenres = movieObj.Genre;
   let similarMovies = [];
   let max = movieGenres.length/2 + 1;

   for(m in movies) {
      if(m === movieObj.ID) {
         continue;
      }

      let count = 0;

      for(let i = 0; i < movieGenres.length; i++) {
         if(movies[m].Genre.includes(movieGenres[i]))
            count++;
      }

      if(count === movieGenres.length || count >= max)
         similarMovies.push(movies[m])

      if(similarMovies.length >= num) {
         return similarMovies;
      }
   }
   return similarMovies;
}

function updateMovie(req,res){
   let movieID = decodeURI(req.params.movieID)
   let userName;

   if(!req.session.loggedin) {
      res.status(404).send("Not logged in")
      return;
   }

   userName = req.session.userName;

   if(!isValidMovie(movieID)) {
      res.status(404).send("Unknown movie");
      return;
   }

   if(!isValidUser(userName)) {
      res.status(404).send("Unknown user");
      return;
   }

   if(req.body && req.body.editingCast) {
      let resCode = editCast(movieID, req.body);
      res.status(resCode).send();
   }

   addReview(movieID, userName, req.body)
   
   res.status(200).send();
   return;
}

function editCast(movieID, newCast) {
   if(newCast.newDirector) {
      let personName = newCast.newDirector;
      if(!people.hasOwnProperty(personName.toLowerCase()))
         createPerson(personName);
      
      addPersontoMovie(movieID, "Director", personName) //update movie
      updatePerson(personName, movies[movieID]); //update person
      return 200;
   }

   if(newCast.newWriter) {
      let personName = newCast.newWriter;
      if(!people.hasOwnProperty(personName.toLowerCase()))
         createPerson(personName);
      addPersontoMovie(movieID, "Writer", personName) //update movie
      updatePerson(personName, movies[movieID]); //update person
      return 200;
   }

   if(newCast.newActor) {
      let personName = newCast.newActor;
      if(!people.hasOwnProperty(personName.toLowerCase()))
         createPerson(personName);

      addPersontoMovie(movieID, "Actors", personName) //update movie
      updatePerson(personName, movies[movieID]); //update person
      return 200;
   }

   return 404;   
}

function isValidMovie(movieID){
   if(!movieID){
     return false;
   }

   if(!movies.hasOwnProperty(movieID)){
     return false;
   }

   return true;
}

function createMovie(req, res) {
   let newMovie = req.body;

   if(!newMovie || !newMovie.Title || !newMovie.Year || !newMovie.Plot || !newMovie.Runtime) {
      res.status(400).send("Bad request")
      return;
   }

   newMovie.ID = newMovie.Title+"_("+newMovie.Year +")";

   if(movies.hasOwnProperty(newMovie.ID)) {
      res.status(400).send("This movie already exists")
      return;
   }

   if(req.session.loggedin) {
      if(!isValidUser(req.session.userName) || !users[req.session.userName].contributingUser) {
         res.status(401).send("You must be a contributing user to create a movie");
         return;
      }
   }

   newMovie.Runtime = newMovie.Runtime + " min"
   if(!newMovie.Rated)
      newMovie.Rated = "N/A";
   
   if(!newMovie.Genre)
      newMovie.Genre = [];

   if(!newMovie.Director)
      newMovie.Director = []

   if(!newMovie.Writer) {
      newMovie.Writer = []
   }

   if(!newMovie.Actors)
      newMovie.Actors = []

   if(!newMovie.Poster)
      newMovie.Poster = "/img/noPhoto.png";
   parsePeople(newMovie);

   newMovie.Reviews = [];
   newMovie.ID = newMovie.Title+"_("+newMovie.Year +")";
   newMovie.TotalScore = 0;
   movies[newMovie.ID] = newMovie;

   res.format({
      "application/json": function () {
         res.send({movie: movies[newMovie.ID]})
      },

      "text/html": function() {
         res.redirect("/movies/"+newMovie.ID)
      }
   })
}

function addPersontoMovie(movieID, personType, personName) {
   //Movie doesnt exist
   if(!movies[movieID]) {
      return;
   }
   
   //Person doesnt exist
   if(!people[personName.toLowerCase()]) {
      return;
   }

   let unique = true;
   movies[movieID][personType].forEach(p => {
      if(p.toLowerCase() === personName.toLowerCase()) {
         unique = false;
         return;
      }
   })

   if(!unique) {
      return;
   }
   movies[movieID][personType].push(personName);
}

function recommendMovies(userObj) {
   let recommendedList = [];
   if(userObj.reviews.length === 0) {
      return ["Toy Story_(1995)", "Aladdin_(1992)"]
   }

   let points = {}
   let increment;
   //loops thorugh all reviews of a user, 
   for(let i =  0; i < userObj.reviews.length; i++) {
      let review = userObj.reviews[i];

      //Looks at the similar movie for the movie reviewed
      let similarMoviesList = similarMovies(movies[review.movieID]);
      similarMoviesList.forEach(e => {

         //Dont recommend watched movies
         if(userObj.moviesWatched.has(e.ID)) {
            return;
         }

         //Create in freq object if movie doesnt exist
         if(!points[e.ID])
            points[e.ID] = 0;

         //Reviews with higher score will give it more points
         increment = 1;
         if(review.score >= 8) {
            increment = 3;
         } else if(review.score >= 6) {
            increment = 2;
         }
         points[e.ID] += increment;
      })
   }

   count = 0;
   let pointsLength = Object.keys(points).length;
   //Repeat process 3 times
   while(count < 3 && count < pointsLength) {
      let max = -1;
      let maxMovie = "";

      //Find movie with highest points
      for(m in points) {
         if(points[m] > max) {
            max = points[m];
            maxMovie = m;
         }
      }
      recommendedList.push(maxMovie);
      delete points[maxMovie];
      count++;
   }
   
   return recommendedList;
}

function addReview(movieID, userName, newReview) {
   let movieObj = movies[movieID];
   let userObj = users[userName];
   let reviewObj = {userName: userName, score: newReview.score, summary: newReview.summary, text: newReview.text, movieID: movieID, type: newReview.type};
   movieObj.Reviews.push(reviewObj);
   movieObj.TotalScore += Number(newReview.score)
   userObj.reviews.push(reviewObj);
   userObj.moviesWatched.add(movieID);

   notifyFollowers(userObj.usersFollowingUser, userName + " has created a new review.")
   userObj.recommendedMovies = recommendMovies(userObj);
}

function loadPeoplePage(req,res) {
   let personID = decodeURI(req.params.personID);

   if(people.hasOwnProperty(personID.toLowerCase())) {
      let freqCollabObj = freqCollab(personID);
      let topCollabList = topCollab(freqCollabObj);
      let filmographyList = movieWorks(people[personID.toLowerCase()])

      res.format({
         "application/json": function() {
            res.send({personObj: people[personID.toLowerCase()], topCollabList: topCollabList})
         },

         "text/html": function() {
            res.render("pages/peoplepage.pug", {session: req.session, person : people[personID.toLowerCase()], filmographyList, topCollabList})
         }
      })
   } else {
      res.status(404).send("Person not found")
   }
}

function loadPeopleSearchPage(req, res) {
   res.format({
      "application/json": function() {
         if(!Object.keys(req.query).length > 0) {
            req.people = people;
         }
         res.send(req.people);
      },

      "text/html": function() {
         res.render("pages/search-people.pug", {session: req.session, peopleList: req.people, searched: req.searched})
      }
   })
}

function searchPeople(req,res,next) {
   req.people = []
   req.searched = false;

   if(!req.query.hasOwnProperty("name")) {
      next();
      return;
   } 

   req.searched = true;

   for(p in people) {
      if(p.includes(req.query.name.toLowerCase())) {
         req.people.push(people[p]);
      }
   }

   req.people.sort(function(a,b) {
      if(a.name < b.name) return -1;
      if(a.name > b.name) return 1;
      return 0;
   })

   if(!req.query.page) {
      req.query.page = 0;
   }

   let first = 20*req.query.page;
   let last = Math.min(first+20, req.people.length);
   req.people = req.people.slice(first,last)
   next();
}

function loadCreatePersonPage(req,res) {
   if(req.session.userName && users[req.session.userName].contributingUser) {
      res.render("pages/createPersonPage.pug", {session: req.session})
   } else {
      res.status(401).send("You must be logged in and a contributing user.")
   }
}

function parsePeople(movie) {
   let actorList = [];
   let writerList = [];
   let directorList = [];

   if(movie.Actors.length > 0) {
      actorList = movie.Actors.split(",").map(function(item) {
         return item.split("(")[0].trim();
      });
   }
 
   if(movie.Writer.length > 0) {
      writerList = movie.Writer.split(",").map(function(item) {
         return item.split("(")[0].trim();
      });
   }
 
   if(movie.Director.length > 0) {
      directorList = movie.Director.split(",").map(function(item) {
         return item.split("(")[0].trim();
      });   
   }

   movie.Actors = [];
   movie.Director = [];
   movie.Writer = [];

   actorList.forEach(e => {
      if(movie.Actors.includes(e)) 
         return;

      movie.Actors.push(e);
      updatePerson(e, movie)
   });

   directorList.forEach(e => {
      if(movie.Director.includes(e)) 
         return;

      movie.Director.push(e);
      updatePerson(e, movie)
   });

   writerList.forEach(e => {
      if(movie.Writer.includes(e)) 
         return;

      movie.Writer.push(e);
      updatePerson(e, movie)
   });
}

function createPeople(req, res) {
   if(!req.body || !req.body.name) {
      res.status(404).send("Error creating person.");
   }

   let personName = req.body.name;
   
   if(!people.hasOwnProperty(personName.toLowerCase())) {
      createPerson(personName);
   }

   res.redirect("/people/"+personName);
   return;
}

function createPerson(personName) {
   people[personName.toLowerCase()] = {}
   people[personName.toLowerCase()].name = personName;
   people[personName.toLowerCase()].filmography = [];
   people[personName.toLowerCase()].followers = [];
}

function updatePerson(personName, movie) {
   if(!people.hasOwnProperty(personName.toLowerCase())) {
      createPerson(personName)
   }
   let personObj = people[personName.toLowerCase()];

   if(movie && !personObj.filmography.includes(movie.ID)) {
      personObj.filmography.push(movie.ID);
      let message = personName + " is now in the movie " + movie.ID;
      notifyFollowers(personObj.followers, message)
   }  
}

function notifyFollowers(followerList, message) {
    //Notify followers
    for(let i = 0; i < followerList.length; i++) {
      let userName = followerList[i];
      users[userName].notifications.push(message);
   }
}

function loadUserPage(req,res) {
   let userID = decodeURI(req.params.userID);

   if(isValidUser(userID)) {
      if(req.session.userName === userID) {
         res.format({
            "application/json": function() {
               res.send(users[userID])
            }, 
            "text/html": function() {
               res.render("pages/userpage.pug", {user: users[userID], movies, session: req.session});
            }
         })
      } else {
         res.format({
            "application/json": function() {
               res.send(users[userID])
            }, 
            "text/html": function() {
               res.render("pages/otherprofile.pug", {user: users[userID], session: req.session});             
            }
         })

      }
   } else {
      res.status(404).send("User not found")
   }
}

function createUser(newUser) {  
   if(users.hasOwnProperty(newUser.userName)){
   return null;
   }
   newUser.avatar = "/img/defaultAvatar.png";
   newUser.reviews = [];
   newUser.contributingUser = false;
   newUser.peopleFollowed = [];
   newUser.usersFollowed = [];
   newUser.usersFollowingUser = [];
   newUser.recommendedMovies = recommendMovies(newUser);
   newUser.peopleFollowed = [];
   newUser.notifications = [];
   newUser.moviesWatched = new Set();
   users[newUser.userName] = newUser;
   return users[newUser.userName]
}

function isValidUser(userName){
   if(!userName){
     return false;
   }
   if(!users.hasOwnProperty(userName)){
     return false;
   }

   return true;
}

function updateUser(req, res) {
   let userID = req.params.userID;

   if(!isValidUser(userID)) {
      res.status(404).send("User does not exist")
      return;
   }

   if(req.session.userName !== userID) {
      res.status(401).send("Unauthorized")
      return;
   }
      
   if(req.body.hasOwnProperty("isContributing")) {
      users[userID].contributingUser = req.body.isContributing
      res.status(200).send("Successfully updated user")
      return
   }
   
   if(req.body.hasOwnProperty("clearingNotifications")) {
      users[userID].notifications = [];
      res.status(200).send("Successfully updated user")
      return
   }

   //Handles people follow requests
   if(req.body.hasOwnProperty("followPerson")) {
      let pObj = people[req.body.pName.toLowerCase()];
      if(req.body.followPerson) {
         if(users[userID].peopleFollowed.includes(req.body.pName)) {
            res.status(406).send("You are already following this person")
            return;
         }

         users[userID].peopleFollowed.push(req.body.pName);
         pObj.followers.push(userID);
      } else {
         let index = users[userID].peopleFollowed.indexOf(req.body.pName);
         let index2 = pObj.followers.indexOf(userID)
         if(index !== -1)
            users[userID].peopleFollowed.splice(index,1);
         if(index2 !== -1)
            pObj.followers.splice(index2,1);
      }
      res.status(200).send("Successfully updated user")
      return
   }

   //Handles user follow requests
   if(req.body.hasOwnProperty("followUser")) { 
      if(req.body.followUser) { //Trying to follow someone
         if(users[userID].usersFollowed.includes(req.body.uName)) {
            res.status(406).send("You are already following this user")
            return;
         }
         users[userID].usersFollowed.push(req.body.uName);
         users[req.body.uName].usersFollowingUser.push(userID);
      } else { //Trying to unfollow someone
         let index = users[userID].usersFollowed.indexOf(req.body.uName); //Index of follow target
         if(index !== -1) //If exists
            users[userID].usersFollowed.splice(index,1);
         index = users[req.body.uName].usersFollowingUser.indexOf(userID); //Index of you in follow target
         if(index !== -1) //If exists
            users[req.body.uName].usersFollowingUser.splice(index,1);
      }
      res.status(200).send("Successfully updated user")
      return
   }
   
   return;
}

function loadUserSearchPage(req, res) {
   res.format({
      "application/json": function() {
         if(!Object.keys(req.query).length > 0) {
            req.users = users;
         }
         res.send(req.users);
      },

      "text/html": function() {
         res.render("pages/search-users.pug", {session: req.session, userList: req.users, searched: req.searched})
      }
   })
}

function searchUser(req,res,next) {
   req.users = []
   req.searched = false;

   if(!req.query.hasOwnProperty("name")) {
      next();
      return;
   } 

   req.searched = true;
   for(u in users) {
      if(u.toLowerCase().includes(req.query.name.toLowerCase())) {
         req.users.push(users[u]);
      }
   }

   req.users.sort(function(a,b) {
      if(a.userName < b.userName) return -1;
      if(a.userName > b.userName) return 1;
      return 0;
   })

   if(!req.query.page) {
      req.query.page = 0;
   }

   let first = 15*req.query.page;
   let last = Math.min(first+15, req.users.length);
   req.users = req.users.slice(first,last)
   next();
}

function loadLoginPage(req,res) {
   if(req.session.loggedin) {
      res.redirect("/users/"+req.session.userName);
      return;
   }
   res.render("pages/login.pug", {session: req.session})
}

function auth(req, res, next) {
   if(!req.session.loggedin) {
       res.redirect("/login")
       return;
   }
   next();
}

function signup(req, res) {
   let userName = req.body.userName;
   let password = req.body.password;

   let user = {userName: userName, password: password};
   if(createUser(user) == null) {
      res.status(401).send("User already exists.");
      return;
   }
   req.session.loggedin = true;
   req.session.userName = userName;
   res.status(200).send(userName);
   return;
}

function login(req, res) {
   let userName = req.body.userName;
   let password = req.body.password;
   if(!users.hasOwnProperty(userName)) {
      res.status(401).send("Invalid username or password.");
   }
   
   if(users[userName].password == password) {
      req.session.loggedin = true;
      req.session.userName = userName;
      return res.status(200).send(userName); 
   }
   

   res.status(401).send("Invalid username or password.");
}

function logout(req,res) {
   req.session.destroy();
   res.redirect("/login")
}


//When loading person page
function freqCollab(personName) {
   let freqCollabObj = {}

   people[personName.toLowerCase()].filmography.forEach(movie => {
      movies[movie].Actors.forEach(p => {
         if(!freqCollabObj.hasOwnProperty(p)) {
            freqCollabObj[p] = 0;
         }
   
         freqCollabObj[p]++;
      })

      movies[movie].Writer.forEach(p => {
         if(!freqCollabObj.hasOwnProperty(p)) {
            freqCollabObj[p] = 0;
         }
   
         freqCollabObj[p]++;      
      })

      movies[movie].Director.forEach(p => {
         if(!freqCollabObj.hasOwnProperty(p)) {
            freqCollabObj[p] = 0;
         }
   
         freqCollabObj[p]++;
   
   })});

   delete freqCollabObj[personName]
   return freqCollabObj;
}

function topCollab(freqCollabObj) {
   let topCollab = [];
   let objLength = Object.keys(freqCollabObj).length;
   for(let i = 0; i < 5 && i<objLength; i++) {
      let max = -1;
      let maxPerson = "";

      for(p in freqCollabObj) {
         if(freqCollabObj[p] > max) {
            max = freqCollabObj[p];
            maxPerson = p;
         }
      }
      topCollab.push(maxPerson)
      delete freqCollabObj[maxPerson];
   }

   return topCollab;
}

function movieWorks(personObj) {
   let list = []
   for(let i = 0; i < personObj.filmography.length; i++) {
      list.push(movies[personObj.filmography[i]])
   }

   list.sort(function(a,b) {
      if(a.ID > b.ID) return 1;
      if(a.ID < b.ID) return -1;
      return 0;
   })
   return list;
}




app.listen(3000);
console.log("Server listening at http://localhost:3000");   