const images = document.querySelectorAll(".center-image");
const galeria = document.getElementById("galeria");
const menuBtn = document.querySelector(".menu-btn");
const menuContainer = document.querySelector(".menu-container");
const menu = document.getElementById("menu");
const imageContainer = document.querySelector('.image-container');


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
    //mostrar galeria solo en el proyecto
    const galeria = document.getElementById("galeria-proyectos");
    if (slideId === "proyectos") {
    galeria.style.display = "flex";
    galeria.classList.add("active");
    document.body.classList.add("proyectos-active"); 
     imageContainer.style.display = "none";
     imageContainer.style.zIndex = "-1";
  } else {
    galeria.style.display = "none";
    galeria.classList.remove("active");
    document.body.classList.remove("proyectos-active"); 
    imageContainer.style.display = "block";
    imageContainer.style.zIndex = "0";
  
  }
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
