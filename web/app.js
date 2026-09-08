const ENDPOINT =
    "https://alipour-message-link-5995-dev.twil.io/web-message";

const TWILIO_NUMBER = "+1(929)657-1402";
const DEFAULT_MESSAGE = "Hi Dr. Alipour, ";

const form = document.getElementById("messageForm");
const sendBtn = document.getElementById("sendBtn");
const status = document.getElementById("status");
const smsLink = document.getElementById("smsLink");

// Build the "Send a text" link
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const separator = isIOS ? "&" : "?";

smsLink.href =
    `sms:${TWILIO_NUMBER}${separator}body=${encodeURIComponent(DEFAULT_MESSAGE)}`;

// Handle web form submission
form.addEventListener("submit", async function(event) {
    event.preventDefault();

    const formData = new FormData(form);

    const data = {
        name: formData.get("name"),
        phone: formData.get("phone"),
        message: formData.get("message"),
        website: formData.get("website")
    };

    sendBtn.disabled = true;
    sendBtn.textContent = "Sending...";
    status.textContent = "";

    try {
        const response = await fetch(ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            status.textContent = "Message sent.";
            form.reset();
        } else {
            status.textContent =
                "Something went wrong. Please try again.";
        }

    } catch (error) {
        console.error(error);

        status.textContent =
            "Unable to send. Check your connection and try again.";

    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = "Send message";
    }
});