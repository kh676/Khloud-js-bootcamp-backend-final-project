const express = require("express");
const app = express();
app.set("view engine", "ejs");
const instructor = require("./model/instructorModel");
const course = require("./model/courseModel");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
mongoose
  .connect(process.env.DB_URL)
  .then(() => {
    console.log("connected");
  })
  .catch(() => {
    console.log(" not connected");
  });
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const bcrypt = require("bcrypt");
const saltRounds = 10;
const cookieParser = require("cookie-parser");
const session = require("express-session");
const student = require("./model/studentModel");

require("dotenv").config();

app.use(
  session({
    secret: "my secret",
  })
);
app.use(cookieParser());
//============================================
app.get("/register", (req, res) => {
  res.render("register.ejs");
});
app.post("/register", (req, res) => {
  const name = req.body.name;
  const password = req.body.psaaword;
  bcrypt.hash(password, saltRounds).then((encrptedPassword) => {
    instructor
      .create({
        name: name,
        psaaword: encrptedPassword,
      })
      .then((saved) => {
        req.session.currentUser = saved._id;
        if (name == "admin") {
          req.session.role = "admin";
          res.redirect("/allinstructor");
        } else {
          req.session.role = "instructor";
          res.redirect("/oneuser");
        }
      })
      .catch((error) => {
        res.send(error);
      });
  });
});
//==============================================
app.get("/login", (req, res) => {
  res.render("login.ejs");
});
app.post("/login", (req, res) => {
  const name = req.body.name;
  const psaaword = req.body.psaaword;
  instructor
    .findOne({ name })
    .select("+psaaword")
    .then((foundUser) => {
      if (!foundUser) {
        res.send("user not found....!!");
        return;
      }

      const encryptedPassword = foundUser.psaaword;

      bcrypt
        .compare(psaaword, encryptedPassword)
        .then((response) => {
          if (response == true) {
            req.session.currentUser = foundUser._id;
            if (name == "admin") {
              req.session.role = "admin";
              res.redirect("/allinstructor");
              return;
            } else {
              req.session.role = "instructor";
              res.redirect("/oneuser");
            }
          } else {
            res.send("incorrect password");
          }
        })
        .catch((err) => {
          res.send(err);
        });
    })
    .catch((err) => {
      res.send(err);
    });
});
app.get("/oneuser", (req, res) => {
  if (req.session.currentUser) {
    const id = req.session.currentUser;
    instructor.findById(id).then((i) => {
      res.render("oneuser.ejs", { i });
    });
  } else {
    res.redirect("/login");
  }
});
//========all with course=============
app.get("/allinstructor", (req, res) => {
  if (req.session.currentUser) {
    instructor
      .find()
      .populate("course")
      .then((instructor) => {
        res.render("allinstructor.ejs", { instructor });
      });
  } else {
    res.render("login.ejs");
  }
});
///=================course============
app.get("/createcourse/:id", (req, res) => {
  const id = req.params.id;
  instructor.findById(id).then((s) => {
    if (s._id == req.session.currentUser || req.session.role == "admin") {
      res.render("newcourse.ejs", { s });
    } else {
      if (req.session.role == "admin") {
        res.redirect("/allinstructor");
      } else {
        res.redirect("/oneuser");
      }
    }
  });
});
app.post("/createcourse/:id", (req, res) => {
  const id = req.params.id;
  const name = req.body.name;
  const description = req.body.description;
  const code = req.body.code;
  instructor.findById(id).then((user) => {
    course
      .create({
        name: name,
        description: description,
        code: code,
        instructor: user._id,
      })
      .then((saved) => {
        //عشان اقدر احط اكثر من قيمه فيه
        user.course.push(saved);
        user.save().then(() => {
          if (req.session.role == "admin") {
            res.redirect("/allinstructor");
          } else {
            res.redirect("/oneuser");
          }
        });
      })
      .catch((error) => {
        res.send(error);
      });
  });
});
//============================course detils==============
app.get("/delete/:id", (req, res) => {
  const id = req.params.id;
  course.findById(id).then((saved) => {
    if (
      saved.instructor == req.session.currentUser ||
      req.session.role == "admin"
    ) {
      course.findByIdAndDelete(id);
      if (req.session.role == "admin") {
        res.redirect("/allinstructor");
      } else {
        res.redirect("/oneuser");
      }
    } else {
      res.redirect("/oneuser");
    }
  });
});
app.get("/course/:id", (req, res) => {
  const id = req.params.id;
  instructor
    .findById(id)
    .populate("course")
    .then((saved) => {
      res.render("onecourse.ejs", { saved });
    });
});
app.get("/update/:id", (req, res) => {
  const id = req.params.id;
  instructor.findById(id).then((saved) => {
    if (saved._id == req.session.currentUser || req.session.role == "admin") {
      res.render("update.ejs", { saved });
    } else {
      res.redirect("/oneuser");
    }
  });
  app.post("/update/:id", (req, res) => {
    const id = req.params.id;
    const name = req.body.name;
    instructor.findByIdAndUpdate(id, { name: name }).then((saved) => {
      res.redirect("/oneuser");
    });
  });
});
app.get("/edit/:id", (req, res) => {
  const id = req.params.id;

  course.findById(id).then((s) => {
    if (
      s.instructor == req.session.currentUser ||
      req.session.role == "admin"
    ) {
      res.render("updateco.ejs", { s });
    } else {
      if (req.session.role == "admin") {
        res.redirect("/allinstructor");
      } else {
        res.redirect("/oneuser");
      }
    }
  });
});
app.post("/edit/:id", (req, res) => {
  const id = req.params.id;
  const name = req.body.name;
  const description = req.body.description;
  const code = req.body.code;

  course
    .findByIdAndUpdate(id, {
      name: name,
      description: description,
      code: code,
    })
    .then(() => {
      if (req.session.role == "admin") {
        res.redirect("/allinstructor");
      } else {
        res.redirect("/oneuser");
      }
    });
});
//========================api part=========================
app.post("/api/login", (req, res) => {
  const name = req.body.name;
  const psaaword = req.body.psaaword;
  student
    .findOne({ name })
    .select("+psaaword")
    .then((foundUser) => {
      if (!foundUser) {
        res.json({ message: "user not found....!!" });
        return;
      }
      const encrptedPassword = foundUser.psaaword;
      bcrypt
        .compare(psaaword, encrptedPassword)
        .then((response) => {
          if (response == true) {
            const token = jwt.sign(
              {
                foundUser,
              },

              process.env.JWT_SECRET,
              {
                expiresIn: "1h",
              }
            );
            res.json({ token: token });
          } else {
            res.json({ error: "incurect password" });
          }
        })
        .catch((error) => {
          res.send(error);
        })
        .catch((error) => {
          res.send(error);
        });
    });
});
const islogin = (req, res, next) => {
  try {
    const authheader = req.headers.authorization;
    const token = authheader.split(" ")[1];
    const object = jwt.verify(token, process.env.JWT_SECRET);
    res.locals.object = object;
    next();
  } catch (err) {
    res.json({ errorMessage: "you most log in ^-^" });
  }
};
app.get("/api/CreateStudent", (req, res) => {
  const name = req.body.name;
  const psaaword = req.body.psaaword;
  bcrypt
    .hash(psaaword, saltRounds)

    .then((encrptedPassword) => {
      student.create({
        name: name,
        psaaword: encrptedPassword,
      });
    })
    .then((foundUser) => {
      const token = jwt.sign(
        {
          foundUser,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );
      res.json({ token: token });
    })
    .catch((error) => {
      res.json(error);
    });
});
app.get("/api/registercourses/:id", islogin, (req, res) => {
  const id = req.params.id;
  object = res.locals.object;

  course
    .findById(id)
    .then((foundcours) => {
      foundcours.student.push(object.foundUser._id);
      foundcours.save().then(() => {
        student.findById(object.foundUser._id).then((user) => {
          user.course.push(foundcours);
          user.save().then((u) => {
            res.send(u);
          });
        });
        //res.json({ message: "complete" });
      });
    })
    .catch((error) => {
      res.json(error);
    });
});
app.get("/api/allcourses", islogin, (req, res) => {
  const object = res.locals.object;

  student.findById(object.foundUser._id).then((user) => {
    user.populate("course").then((saved) => {
      res.json(saved);
    });
  });
});
app.get("/api/delete/:id", islogin, (req, res) => {
  const id = req.params.id;
  course
    .findByIdAndDelete(id)
    .then((course) => {
      res.json({ deleted: course });
    })
    .catch((error) => {
      res.json({ error });
    });
});
app.listen(9000, (req, res) => {
  console.log("listening");
});
