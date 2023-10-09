const express = require("express");
const app = express();
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const axios = require("axios");
const fs = require("fs");
const bodyparser = require("body-parser");

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fetch server-hosted test.html
app.get("/server-test", async (req, res) => {
  try {
    const response = await axios.get(
      "http://123.63.97.202:81/intelliheal/test.html"
    );
    const htmlContent = response.data;
    res.send(htmlContent);

    // res.sendFile("test.html");
  } catch (error) {
    console.error("Error fetching server-hosted test.html:", error);
    res.status(500).send("Error fetching server-hosted test.html");
  }
});

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});
app.get("/courses", function (req, res) {
  res.sendFile(path.join(__dirname, "public", "courses.html"));
});

app.get("/teach", function (req, res) {
  res.sendFile(path.join(__dirname, "public", "teach.html"));
});

app.get("/plans", function (req, res) {
  res.sendFile(path.join(__dirname, "public", "plans.html"));
});

app.get("/about", function (req, res) {
  res.sendFile(path.join(__dirname, "public", "about.html"));
});

app.get("/contactform", function (req, res) {
  res.sendFile(path.join(__dirname, "public", "contactform.html"));
});

app.get("/test", function (req, res) {
  res.sendFile(path.join(__dirname, "public", "test.html"));
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({ storage });

// Handle form submission for home.html and other pages (except test.html)
app.post("/", upload.single("attachment"), function (req, res) {
  console.log(req.body);

  const transporter = nodemailer.createTransport({
    service: "hotmail",
    auth: {
      user: "shibani_scalable@outlook.com",
      pass: "wrrrcihbnbcvhnfd",
    },
  });

  const mailOptions = {
    from: "shibani_scalable@outlook.com",
    to: "shibani_scalable@outlook.com",
    subject: `Message from ${req.body.name}: ${req.body.subject}`,
    text: `Name: ${req.body.name}\nPage Name: ${req.body.pageName}\nEmail: ${req.body.email}\nMessage: ${req.body.message}\nContact No.:${req.body.contactno} `,
  };

  // Check if the uploaded attachment exists and attach it to the email
  if (req.file) {
    mailOptions.attachments = [
      {
        filename: req.file.originalname,
        path: req.file.path,
      },
    ];
  }

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.send("error");
    } else {
      console.log("Email sent: " + info.response);
      res.send("success");
    }
  });
});

// Configure transporter outside of the route handlers
const transporter = nodemailer.createTransport({
  service: "hotmail",
  auth: {
    user: "shibani_scalable@outlook.com",
    pass: "wrrrcihbnbcvhnfd",
  },
});

const brochureRequests = {}; // Store brochure requests for admin confirmation

// Handle form submission for test.html
app.post("/test", upload.single("attachment"), function (req, res) {
  console.log(req.body);
  console.log("Received form data:", req.body);

  const selectedBrochureLink = req.body.selectedBrochureLink;

  // Generate a unique ID for brochure request
  const requestId = Date.now() + "-" + Math.round(Math.random() * 1e9);

  // HTML content with the buttons
  const htmlContent = `
    <p>Dear Admin,</p>
    <p>A user has requested to download the brochure.</p>
    <p>Name: ${req.body.name}<br>
    Page Name: ${req.body.pageName}<br>
    Email: ${req.body.email}<br>
    Message: ${req.body.message}<br>
    Contact No.: ${req.body.contactno}</p>
    Selected Brochure Link: ${selectedBrochureLink}
    <p>Please click one of the following buttons to confirm or deny the download request:</p>
    <p><a href="http://localhost:5000/server-test/confirm/${requestId}/allow" target="_self">Accept</a> | <a href="http://localhost:5000/server-test/confirm/${requestId}/deny" target="_self">Deny</a></p>
    <p>Best regards,<br>The Scalable Team</p>
  `;

  const mailOptions = {
    from: "shibani_scalable@outlook.com",
    to: "shibani_scalable@outlook.com",
    subject: "Brochure Download Request",
    html: htmlContent,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).json({ status: "error" });
    } else {
      console.log("Confirmation email sent to admin: " + info.response);

      // Save the request data in a temporary object
      brochureRequests[requestId] = {
        name: req.body.name,
        brochure: selectedBrochureLink,
        contactno: req.body.contactno,
        email: req.body.email,
      };

      res.status(200).json({ status: "success", requestId }); // Send JSON response with success status
    }
  });
});

// Handle the admin's response to the download request
app.get("/server-test/confirm/:requestId/:decision", function (req, res) {
  const requestId = req.params.requestId;
  const decision = req.params.decision;

  const request = brochureRequests[requestId];

  if (!request) {
    res.send("Invalid request ID.");
    return;
  }

  if (decision === "allow") {
    // If the admin allows, the download button is enabled for the user
    console.log(`The download request has been accepted`);
    request.status = "allow";
    res.send("The download request has been allowed.");

    // Send confirmation email to the user
    const userHtmlContent = `
      <p>Dear ${request.name},</p>
      <p>Your request to download the brochure has been accepted.</p>
      <p>Please click the link below to download the brochure:</p>
      <p><a href="${request.brochure}" target="_blank">Download Brochure</a></p>
      <p>Best regards,<br>The Scalable Team</p>
    `;

    const userMailOptions = {
      from: "shibani_scalable@outlook.com",
      to: "shibanimo1@outlook.com",
      subject: "Brochure Download Request Accepted",
      html: userHtmlContent,
    };

    transporter
      .sendMail(userMailOptions)
      .then((info) => {
        console.log("Confirmation email sent to user:", info.response);
      })
      .catch((error) => {
        console.error("Error sending confirmation email to user:", error);
      });
  } else if (decision === "deny") {
    // If the admin denies, the download button remains disabled for the user
    console.log(`The download request has been denied`);
    request.status = "deny";
    res.send("The download request has been denied.");
  } else {
    console.log(`Invalid decision: ${decision}`);
    res.send("Invalid decision. Please specify 'allow' or 'deny'.");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
