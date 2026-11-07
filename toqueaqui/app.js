const scene = document.querySelector('.scene');
const psyduck = document.querySelector('#psyduck');
const tapButton = document.querySelector('#tapButton');
const message = document.querySelector('#message');
let started = false;

function revealLove() {
  if (started) return;
  started = true;
  psyduck.classList.add('confused');
  tapButton.textContent = 'Psyduck está pensando...';
  window.setTimeout(() => {
    scene.classList.add('revealed');
    message.setAttribute('aria-hidden', 'false');
    psyduck.setAttribute('aria-label', 'Psyduck diz: eu te amo');
  }, 3600);
}

psyduck.addEventListener('click', revealLove);
tapButton.addEventListener('click', revealLove);
psyduck.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    revealLove();
  }
});


