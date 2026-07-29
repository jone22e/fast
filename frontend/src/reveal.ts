import type { Directive } from 'vue';

/**
 * `v-reveal` — o elemento entra na tela conforme a rolagem.
 *
 * Um único IntersectionObserver atende a página inteira, e cada elemento é
 * dispensado assim que aparece: o efeito é de entrada, não de acompanhamento.
 * O valor da diretiva, quando informado, é o atraso em milissegundos — usado
 * para escalonar itens de uma mesma grade.
 *
 * Quem pediu menos movimento (prefers-reduced-motion) recebe o conteúdo já
 * visível, sem observador nenhum.
 */

let observer: IntersectionObserver | null = null;

function shared(): IntersectionObserver {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer?.unobserve(entry.target);
      }
    },
    // Dispara um pouco antes da borda inferior: o elemento já chega animado.
    { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
  );
  return observer;
}

export const vReveal: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    el.classList.add('reveal');

    const still =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (still || typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible');
      return;
    }

    if (binding.value) el.style.setProperty('--reveal-delay', `${binding.value}ms`);
    shared().observe(el);
  },

  unmounted(el) {
    observer?.unobserve(el);
  },
};
