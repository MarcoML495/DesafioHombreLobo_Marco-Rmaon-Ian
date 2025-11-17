import "../style.css";

const HOME_VIEW_PATH = "/src/views/home.html";

const redirectToHome = () => {
  const alreadyInHome = window.location.href.includes("/src/views/home.html");
  if (alreadyInHome) return;
  window.location.href = HOME_VIEW_PATH;
};

if (document.readyState === "complete") {
  redirectToHome();
} else {
  window.addEventListener("load", redirectToHome, { once: true });
}
