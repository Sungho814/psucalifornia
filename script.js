// 네비게이션 스크롤 효과
window.addEventListener("scroll", function () {
  const header = document.querySelector("header");
  if (window.scrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

// 부드러운 스크롤
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    target.scrollIntoView({
      behavior: "smooth"
    });
  });
});

// 연구 카드 애니메이션 (Intersection Observer)
const cards = document.querySelectorAll(".card");
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, { threshold: 0.2 });

cards.forEach(card => {
  observer.observe(card);
});

// Footer에 현재 연도 자동 표시
document.addEventListener("DOMContentLoaded", () => {
  const yearSpan = document.querySelector("#year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});
📌 CSS에 추가 (애니메이션용)
css
코드 복사
/* header 스크롤 시 색상 변화 */
header.scrolled {
  background-color: #600000; /* 더 진한 색 */
  transition: background-color 0.3s;
}

/* 카드 애니메이션 */
.card {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}

.card.visible {
  opacity: 1;
  transform: translateY(0);
}