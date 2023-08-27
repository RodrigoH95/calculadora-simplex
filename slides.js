class SlideManager {
  constructor() {
    this.btnNext = document.getElementById("btn-sig");
    this.btnPrev = document.getElementById("btn-prev");
    this.currentIndex = 0;
    this.slides = [];
  }

  start() {
    this.btnNext.addEventListener("click", () => {
      this.showSlide(1);
    });

    this.btnPrev.addEventListener("click", () => {
      this.showSlide(-1);
    });
  }

  addSlide(slide) {
    this.slides.push(slide);
    if (this.getCantSlides() == 1) {
      this.btnNext.style.display = "block";
      this.btnPrev.style.display = "block";
      this.showSlide();
    }
  }

  showSlide(n = 0) {
    if (this.currentIndex + n >= this.getCantSlides() || this.currentIndex + n < 0) return;
    this.hideSlides();
    this.currentIndex += n;
    this.slides[this.currentIndex].style.display = "block";
  }

  hideSlides() {
    this.slides[this.currentIndex].style.display = "none";
  }

  getCantSlides() {
    return this.slides.length;
  }

  reset() {
    this.slides = [];
    this.currentIndex = 0;
    this.btnPrev.style.display = "none";
    this.btnNext.style.display = "none";
  }
}
