document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-year]").forEach((item) => { item.textContent = new Date().getFullYear(); });
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) toggle.addEventListener("click", () => { const open = toggle.getAttribute("aria-expanded") === "true"; toggle.setAttribute("aria-expanded", String(!open)); links.classList.toggle("open", !open); });

  const form = document.getElementById("contact-form");
  if (form) form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("name").value.trim();
    const organization = document.getElementById("organization").value.trim();
    const email = document.getElementById("email").value.trim();
    const topic = document.getElementById("topic").value;
    const message = document.getElementById("message").value.trim();
    const status = document.getElementById("form-status");
    if (!name || !message) { status.textContent = "Please enter your name and a message."; return; }
    const subject = encodeURIComponent(`ShieldGuard: ${topic}`);
    const body = encodeURIComponent(`Name: ${name}\nOrganization: ${organization || "-"}\nEmail: ${email || "-"}\nTopic: ${topic}\n\nMessage:\n${message}`);
    status.textContent = "Opening your email application…";
    window.location.href = `mailto:shildguard.supp@gmail.com?subject=${subject}&body=${body}`;
  });
});
