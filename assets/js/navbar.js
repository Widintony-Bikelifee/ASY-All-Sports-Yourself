export function loadNavbar() {
  fetch("./components/navbar.html")
    .then((res) => res.text())
    .then((data) => {
      document.getElementById("navbar").innerHTML = data;

      initNavbar();
    })
    .catch((err) => {
      console.error("Error cargando navbar:", err);
    });
}

/* FEATURE NAVBAR */
function initNavbar() {
  const hamburgerBtn = document.getElementById("navbar-hamburger");
  const mobileMenu = document.getElementById("navbar-mobile-menu");

  if (hamburgerBtn && mobileMenu) {
    hamburgerBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
      if (!hamburgerBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove("open");
      }
    });
  }
}
