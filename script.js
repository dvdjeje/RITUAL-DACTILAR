const touchArea = document.getElementById("touch-area");
const fingerImage = document.getElementById("imagen");


const images = {
  1: "assets/1 calvo.jpg",
  2: "assets/2 calvos.webp",
  3: "assets/3.jpg",
  4: "assets/4 calvos.jpg",
  5: "assets/5 calvos.jpg",
  6: "assets/6 calvos.jpg",
  7: "assets/7 calvos.jpg",
  8: "assets/8 calvos.jpg",
  9: "assets/9 calvos.jpg",
};


function updateImage(event) {
  const fingers = event.touches.length;

  if (images[fingers]) {
    fingerImage.src = images[fingers];
    fingerImage.style.display = "block";
  } else {
    fingerImage.src = "";
    fingerImage.style.display = "none";
  }
}

touchArea.addEventListener("touchstart", updateImage, {
  passive: false
});

touchArea.addEventListener("touchmove", updateImage, {
  passive: false
});

touchArea.addEventListener("touchend", updateImage);

touchArea.addEventListener("touchcancel", updateImage);