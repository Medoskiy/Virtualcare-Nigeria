import { openBookingModal, openBookingWithSpecialty, requireAuthForBooking } from './bookingModal.js';

function scrollContentTop() {
  const contentArea = document.querySelector('.dash-content')
    || document.querySelector('.dashboard-content')
    || document.querySelector('#dashContent');
  if (contentArea) contentArea.scrollTo({ top: 0, behavior: 'smooth' });
}

function setBookNavActive() {
  const navItems = document.querySelectorAll('.sidebar-nav a, #mobile-bottom-nav a');
  navItems.forEach((n) => n.classList.remove('active'));
  navItems.forEach((n) => {
    if (n.hasAttribute('data-book-flow')) n.classList.add('active');
  });
}

export function registerBookingFlowGlobals() {
  window.openBookingFlow = function () {
    // Clear any stuck loading flag
    window._bookingLoading = false;

    requireAuthForBooking(() => {
      setBookNavActive();
      openBookingModal();
      scrollContentTop();
    });
  };

  window.openBookingFlowWithSpecialty = function (specialty) {
    // Clear any stuck loading flag
    window._bookingLoading = false;

    requireAuthForBooking(() => {
      setBookNavActive();
      openBookingWithSpecialty(specialty);
      scrollContentTop();

      setTimeout(() => {
        const specialtyCards = document.querySelectorAll('.specialty-card, .spec-option, [data-specialty]');
        specialtyCards.forEach((card) => {
          const cardSpecialty = card.dataset.specialty || card.dataset.spec || card.textContent.trim();
          if (cardSpecialty.includes(specialty)) card.click();
        });
      }, 500);
    });
  };
}

export function bindBookFlow(root) {
  root.querySelectorAll('[data-book-flow]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.openBookingFlow?.();
    });
  });
}
