class SlideManager {
  constructor() {
    this.btnNext = document.getElementById("btn-sig");
    this.btnPrev = document.getElementById("btn-prev");
    this.btnResult = document.getElementById("btn-resultado");
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

    this.btnResult.addEventListener("click", () => {
      this.showLastSlide();
    });
  }

  addSlide(slide) {
    this.slides.push(slide);
    if (this.getCantSlides() == 1) {
      this.btnNext.style.display = "block";
      this.btnPrev.style.display = "block";
      this.btnResult.style.display = "block";
      this.showSlide();
    }
  }

  showSlide(n = 0) {
    if (this.currentIndex + n >= this.getCantSlides() || this.currentIndex + n < 0) return;
    this.hideSlides();
    this.currentIndex += n;
    this.slides[this.currentIndex].style.display = "block";
  }

  showLastSlide() {
    this.currentIndex = this.slides.length - 1;
    this.showSlide();
  }

  hideSlides() {
    for (const slide of this.slides) {
      slide.style.display = "none";
    }
  }

  getCantSlides() {
    return this.slides.length;
  }

  reset() {
    this.slides = [];
    this.currentIndex = 0;
    this.btnPrev.style.display = "none";
    this.btnNext.style.display = "none";
    this.btnResult.style.display = "none";
  }
}
