const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const multer = require("multer");

const app = express();

//Mysql connnection
const upload = multer();

//Body Parser
app.use(bodyParser.urlencoded({ extended: true }));

//Database connection
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "PROJECT",
});

//Establishing connection
con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

//====================================================
//defining the port number
const port = 4000;
app.use(express.static("public"));

//====================================================
//GET METHOD START
//====================================================

//working perfectly
app.get("/", (req, res) => {
  try {
    con.query("SELECT * FROM CLUBS_SOCIETY", (err, result, field) => {
      if (err) {
        console.log(err);
      } else {
        res.render("index.ejs", { elements: result });
      }
    });
  } catch (error) {
    res.redirect("/error");
  }
});

//working perfectly
app.get("/about", (req, res) => {
  res.render("about_us.ejs");
});

//working perfectly
app.get("/FAQ", (req, res) => {
  res.render("FAQ.ejs");
});

//working
app.get("/individual/:id", (req, res) => {
  const clubId = req.params.id;

  const clubQuery = "SELECT * FROM CLUBS_SOCIETY WHERE C_S_ID = ?";

  try {
    con.query(clubQuery, [clubId], (err, clubResult) => {
      if (err) {
        console.error("Error retrieving club details:", err);
        return res.render("error.ejs", { error: 500 });
      }

      if (!clubResult || clubResult.length === 0) {
        return res.render("error.ejs", { error: 404 });
      }

      const clubName = clubResult[0].club_name;
      console.log(clubName);

      const achievementsQuery = "SELECT * FROM ACHIVEMENTS WHERE club_name = ?";
      con.query(achievementsQuery, [clubName], (err, achievementsResult) => {
        if (err) {
          console.error("Error retrieving achievements:", err);
          res.render("error.ejs", { error: 500 });
        }

        const eventsQuery = "SELECT * FROM EVENT WHERE club_name = ?";
        con.query(eventsQuery, [clubName], (err, eventsResult) => {
          if (err) {
            console.error("Error retrieving events:", err);
            res.render("error.ejs", { error: 500 });
          }

          const noticeQuery = "SELECT * FROM NOTICE WHERE club_name = ?";

          con.query(noticeQuery, [clubName], (err, noticeResult) => {
            if (err) {
              console.log(err);
              res.render("error.ejs", { error: 500 });
            }

            res.render("individual.ejs", {
              club: clubResult[0],
              achievements: achievementsResult,
              events: eventsResult,
              notices: noticeResult,
            });
          });
        });
      });
    });
  } catch (error) {
    console.log(error);
    res.render("error.ejs", { error: 500 });
  }
});

//working perfectly
app.get("/club-registration", (req, res) => {
  res.render("club_registration_form.ejs");
});

//working perfectly
app.get("/student_registration", (req, res) => {
  res.render("student_registration.ejs");
});

//working perfectly
app.get("/admin/auth", (req, res) => {
  res.render("auth.ejs");
});

//working perfectly exceptions are handled
app.get("/admin/dashboard/:id", (req, res) => {
  const adminId = req.params.id;

  try {
    con.query(
      `SELECT s.roll_no, s.first_name, s.last_name, s.email, s.phone, s.department, s.club_name
     FROM student s
     JOIN clubs_society c ON s.club_name = c.club_name
     JOIN admin_info a ON c.admin_id = a.admin_id
     WHERE a.admin_id = ?`,
      [adminId],
      (err, result, fields) => {
        if (err) {
          console.log(err);

          res.render("error.ejs", { error: 500 });
        } else {
          // Render admin dashboard with student information

          res.render("admin.ejs", {
            elements: result,
            adminId: adminId,
            club_name: result,
          });
        }
      }
    );
  } catch (error) {
    console.log(error);
    res.render("error.ejs", { error: 500 });
  }
});

app.get("/error", (req, res) => {
  res.render("error.ejs");
});

//====================================================
//GET METHOD END
//====================================================

//==================================================================
//POST METHOD
//==================================================================

//working perfectly
app.post("/student_registration", (req, res) => {
  const fName = req.body.name;
  const lName = req.body.lname;
  const rollno = req.body.rollno;
  const email = req.body.email;
  const phone = req.body.phone;
  const department = req.department;
  const club = req.body.club;

  const value = [fName, lName, email, phone, department, club, rollno];

  const sqlInsertQuery =
    "INSERT INTO STUDENT VALUES (? , ? , ? , ? , ? , ? , ?)";

  try {
    con.query(sqlInsertQuery, value, (err, result, feild) => {
      if (err) {
        console.log("error in inserting the data " + err);
        res.render("error.ejs", { error: 500 });
      } else {
        console.log("Hurray! Inserted sucessfully");

        res.redirect("/student_registration");
      }
    });
  } catch (error) {
    res.render("error.ejs", { error: 500 });
  }
});

//post method

//working perfectly
app.post("/club-registration", upload.single("image"), async (req, res) => {
  const {
    cname,
    description,
    Aname,
    course,
    rollno,
    phone,
    email,
    password,
    cpassword,
  } = req.body;
  const imgData = req.file.buffer;
  const adminID = rollno + Aname;
  let name = cname.split(" ").join("");
  const club_id = name + Math.round(Math.random() * 100 + 1);
  const query1 = "INSERT INTO CLUBS_SOCIETY VALUES(?, ?, ?, ?, ?)";
  const query2 = "INSERT INTO ADMIN_INFO VALUES(?, ?, ?, ?, ?, ?, ?)";
  const value1 = [club_id, cname, description, imgData, adminID];
  const value2 = [adminID, Aname, phone, email, course, rollno, cpassword];

  try {
    await new Promise((resolve, reject) => {
      con.query(query1, value1, (err, result, field) => {
        if (err) {
          reject(err);
        } else {
          console.log("Successfully inserted into CLUBS_SOCIETY");
          resolve();
        }
      });
    });

    await new Promise((resolve, reject) => {
      con.query(query2, value2, (err, result, field) => {
        if (err) {
          console.error("Error inserting into ADMIN_INFO:", err);
          reject(err);
        } else {
          console.log("Successfully inserted into ADMIN_INFO");
          resolve();
        }
      });
    });

    res.redirect("/");
  } catch (err) {
    console.error("Error:", err);
    res.render("error.ejs", { error: 500 });
  }
});

//need to implement Json Web Tokken
app.post("/admin/auth", (req, res) => {
  const { roll, password } = req.body;

  const passwordTologin = "1234";

  console.log(roll, password);

  con.query(
    "SELECT * FROM ADMIN_INFO WHERE ADMIN_ID = ?",
    [roll],
    (err, result, field) => {
      if (err) {
        res.render("error.ejs", { error: 500 });
      } else if (result.length == 0) {
        res.render("error.ejs", { error: 401 });
      } else if (passwordTologin != password) {
        res.render("error.ejs", { error: 401 });
      } else {
        const adminId = result[0].ADMIN_ID;

        res.redirect(`/admin/dashboard/${adminId}`);
      }
    }
  );
});

// POST method for submitting notice
app.post("/admin/dashboard/:id/notice", (req, res) => {
  const { clubName, title, date, description } = req.body;

  const value = [title, description, date, clubName];
  const sqlQuery =
    "INSERT INTO NOTICE(title, description, date, club_name) VALUES(?, ?, ?, ?)";

  try {
    con.query(sqlQuery, value, (err, result, field) => {
      if (err) {
        res.render("error.ejs", { error: 500 });
      }

      res.redirect(`/admin/dashboard/${req.params.id}`);
    });
  } catch (error) {
    res.render("error.ejs", { error: 500 });
  }
});

// POST method for submitting achievements
app.post("/admin/dashboard/:id/achievements", (req, res) => {
  const { clubName, title, date, description } = req.body;

  const value = [title, description, clubName, date];
  const sqlQuery =
    "INSERT INTO ACHIVEMENTS(title, description, club_name, date) VALUES(?, ?, ?, ?)";

  try {
    con.query(sqlQuery, value, (err, result, fields) => {
      if (err) {
        res.render("error.ejs", { error: 500 });
      }
      res.redirect(`/admin/dashboard/${req.params.id}`);
    });
  } catch (error) {
    res.render("error.ejs", { error: 500 });
  }
});

// POST method for submitting event
app.post("/admin/dashboard/:id/event", (req, res) => {
  const { clubName, title, date, description } = req.body;

  const value = [title, description, date, clubName];
  const sqlInsertQuery =
    "INSERT INTO EVENT(title, description, date, club_name) VALUES(?, ?, ?,?)";

  try {
    con.query(sqlInsertQuery, value, (err, result, field) => {
      if (err) {
        res.render("error.ejs", { error: 500 });
      }
      res.redirect(`/admin/dashboard/${req.params.id}`);
    });
  } catch (error) {
    res.render("error.ejs", { error: 500 });
  }
});

// Node.js route for deleting selected items
app.post("/admin/dashboard/:id/delete", (req, res) => {
  const adminId = req.params.id;
  const studentIds = req.body.studentIds;

  // Check if any checkboxes were checked
  if (!studentIds || studentIds.length === 0) {
    return res.redirect(`/admin/dashboard/${adminId}`);
  }

  // Perform deletion for each selected student
  const sqlQuery = "DELETE FROM student WHERE roll_no IN (?)";

  con.query(sqlQuery, [studentIds], (err, result) => {
    if (err) {
      console.error("Error deleting students:", err);
      res.render("error.ejs", { error: 500 });
    }
    console.log("Students deleted successfully");
    res.redirect(`/admin/dashboard/${adminId}`);
  });
});

//==================================================================
//POST METHOD
//==================================================================

//listening port
app.listen(port, () => {
  console.log("Our server is running on " + port);
});
