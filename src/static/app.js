document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section (rendered as a bulleted list)
        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsTitle = document.createElement("p");
        participantsTitle.className = "participants-title";
        participantsTitle.textContent = "Participants:";
        participantsSection.appendChild(participantsTitle);

        const ul = document.createElement("ul");
        ul.className = "participants";

        if (Array.isArray(details.participants) && details.participants.length > 0) {
            details.participants.forEach((p) => {
              const li = document.createElement("li");
              li.className = "participant-item";

              const emailSpan = document.createElement("span");
              emailSpan.className = "participant-email";
              emailSpan.textContent = p;

              const deleteBtn = document.createElement("button");
              deleteBtn.className = "delete-btn";
              deleteBtn.type = "button";
              deleteBtn.title = "Unregister participant";
              deleteBtn.innerHTML = "&#128465;"; // trash can emoji

              deleteBtn.addEventListener("click", async () => {
                try {
                  const resp = await fetch(
                    `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(p)}`,
                    { method: "DELETE" }
                  );

                  const resJson = await resp.json();
                  if (resp.ok) {
                    // remove li
                    li.remove();

                    // if no participants left, show placeholder
                    const remaining = ul.querySelectorAll(".participant-item");
                    if (remaining.length === 0) {
                      const placeholder = document.createElement("li");
                      placeholder.className = "no-participants";
                      placeholder.textContent = "No participants yet";
                      ul.appendChild(placeholder);
                    }

                    messageDiv.textContent = resJson.message || "Participant unregistered";
                    messageDiv.className = "success";
                    messageDiv.classList.remove("hidden");
                    setTimeout(() => messageDiv.classList.add("hidden"), 4000);
                  } else {
                    messageDiv.textContent = resJson.detail || "Failed to unregister";
                    messageDiv.className = "error";
                    messageDiv.classList.remove("hidden");
                  }
                } catch (err) {
                  console.error("Unregister error:", err);
                  messageDiv.textContent = "Failed to unregister. Please try again.";
                  messageDiv.className = "error";
                  messageDiv.classList.remove("hidden");
                }
              });

              li.appendChild(emailSpan);
              li.appendChild(deleteBtn);
              ul.appendChild(li);
            });
        } else {
          const li = document.createElement("li");
          li.className = "no-participants";
          li.textContent = "No participants yet";
          ul.appendChild(li);
        }

        participantsSection.appendChild(ul);
        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
          // Refresh activities to show the newly registered participant
          fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
