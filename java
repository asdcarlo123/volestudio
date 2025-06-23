const images = document.querySelectorAll(".center-image");
const galeria = document.getElementById("galeria");
const menuBtn = document.querySelector(".menu-btn");
const menuContainer = document.querySelector(".menu-container");
const menu = document.getElementById("menu");

const slideToImage = {
  "inicio": 0,
  "proyectos": 1,
  "tecnologia": 2,
  "contacto": 0,
  "nosotros": 1
};

let autoIndex = 0;
let autoInterval = setInterval(autoRotate, 5000);

function autoRotate() {
  if (document.getElementById('inicio-content').classList.contains('active')) {
    images[autoIndex].classList.remove("active");
    autoIndex = (autoIndex + 1) % images.length;
    images[autoIndex].classList.add("active");
  }
}

document.addEventListener("mousemove", function (event) {
  const activeImage = document.querySelector(".center-image.active");
  if (!activeImage) return;
  const moveX = (0.5 - event.clientX / window.innerWidth) * 50;
  const moveY = (0.5 - event.clientY / window.innerHeight) * 50;
  activeImage.style.transform = `translate(${moveX}px, ${moveY}px)`;
});

document.querySelectorAll(".menu a").forEach(link => {
  link.addEventListener("click", function (e) {
    e.preventDefault();
    clearInterval(autoInterval);

    const slideId = this.getAttribute("data-slide");

    document.getElementById("inicio-content").classList.toggle("active", slideId === "inicio");
    document.querySelectorAll(".slide-container").forEach(slide => {
      slide.classList.remove("active");
    });
    if (slideId !== "inicio") {
      const slide = document.getElementById("slide-" + slideId);
      if (slide) slide.classList.add("active");
    }

    galeria.classList.toggle("active", slideId === "proyectos");

    images.forEach((img, idx) => {
      img.classList.remove("active");
      img.style.transform = "translate(0, 0)";
      if (idx === slideToImage[slideId]) img.classList.add("active");
    });

    menu.classList.remove("show");
  });
});

menuContainer.addEventListener("mouseenter", () => {
  menu.classList.add("show");
});

menuContainer.addEventListener("mouseleave", () => {
  menu.classList.remove("show");
});
