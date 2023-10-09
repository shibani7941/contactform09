// Function to enable or disable the download buttons based on admin decision
function updateDownloadButtons(decision) {
  const downloadButtons = document.querySelectorAll(".download-button");
  if (decision === "allow") {
    // If the admin allows, enable all download buttons
    downloadButtons.forEach((button) => {
      button.removeAttribute("disabled");
    });
    alert("Download enabled for all brochures.");
  } else if (decision === "deny") {
    // If the admin denies, disable all download buttons
    downloadButtons.forEach((button) => {
      button.setAttribute("disabled", "disabled");
    });
    alert("Download denied for all brochures.");
  }
}

// Function to check the status of the download request from the server
function checkDownloadStatus(requestId) {
  fetch(`/server-test/status/${requestId}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "allow") {
        // Update the download buttons if the admin has allowed the request
        updateDownloadButtons("allow");
      } else if (data.status === "deny") {
        // Update the download buttons if the admin has denied the request
        updateDownloadButtons("deny");
      } else {
        // If the status is still pending, continue checking after a delay
        setTimeout(() => checkDownloadStatus(requestId), 3000); // Check again after 3 seconds
      }
    })
    .catch((error) => {
      console.log(error);
      alert("Error checking download status.");
    });
}

// Get the request ID from the URL
const urlParams = new URLSearchParams(window.location.search);
const requestId = urlParams.get("requestId");

if (requestId) {
  // If there is a request ID in the URL, start checking the status
  checkDownloadStatus(requestId);
}

// Function to submit the contact form on home and other pages (except test.html)
function submitContactForm(formData) {
  fetch("/", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        alert("Email sent");
        // Optionally, you can reset the form fields after successful submission
        const contactForm = document.querySelector(".contact-form");
        contactForm.reset();
      } else {
        alert("Something went wrong!");
      }
    })
    .catch((error) => {
      console.log(error);
      alert("Something went wrong!");
    });
}

// Submit the contact form and handle response
const contactForm = document.querySelector(".contact-form");
const pageNameInput = document.getElementById("pageName");

contactForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const formData = new FormData(contactForm);

  // Check the value of the pageName input to determine which form to submit
  const pageName = pageNameInput.value;
  if (
    pageName === "Home" ||
    pageName === "Courses" ||
    pageName === "Teach With Us" ||
    pageName === "Plans and Subscription" ||
    pageName === "About Us" ||
    pageName === "Contact Us"
  ) {
    // If the pageName matches any of the pages, submit the contact form for home and other pages
    submitContactForm(formData);
  } else {
    // Otherwise, submit the form for test.html
    fetch("/test", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          alert("Email sent");
          contactForm.reset();
        } else {
          alert("Something went wrong!");
        }
      })
      .catch((error) => {
        console.log(error);
        alert("Something went wrong!");
      });
  }
});

// Handle the admin's response to the download request
const contactModal = document.getElementById("contactModal");
contactModal.addEventListener("click", (e) => {
  if (e.target.classList.contains("admin-decision")) {
    const requestId = e.target.dataset.requestId;
    const decision = e.target.dataset.decision;

    handleAdminDecision(requestId, decision);
  }
});

function handleAdminDecision(requestId, decision) {
  // Make a GET request to the server endpoint to update the download buttons
  fetch(`/server-test/confirm/${requestId}/${decision}`)
    .then((response) => response.text())
    .then((result) => {
      console.log(result);
      // Check if the response contains the download link
      if (result.includes("Download Brochure")) {
        // If the download link is found, redirect the user to the server-test page
        window.location.href = `/server-test/confirm/${requestId}/allow`;
      } else {
        // If not, show the response message in an alert
        alert(result);
      }
    })
    .catch((error) => {
      console.log(error);
      alert("Error updating download buttons.");
    });
}
