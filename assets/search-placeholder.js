(() => {
  const selector = 'input[data-animated-placeholders]'

  const animate = (input) => {
    if (input.dataset.placeholderAnimationReady === 'true') return
    input.dataset.placeholderAnimationReady = 'true'

    const phrases = input.dataset.animatedPlaceholders.split('|').filter(Boolean)
    if (!phrases.length) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      input.placeholder = phrases[0]
      return
    }

    let index = 0
    let phraseIndex = 0
    let deleting = false

    const tick = () => {
      const text = phrases[phraseIndex]
      index += deleting ? -1 : 1
      input.placeholder = text.slice(0, index)

      let delay = deleting ? 55 : 105

      if (!deleting && index === text.length) {
        deleting = true
        delay = 1800
      } else if (deleting && index === 0) {
        deleting = false
        phraseIndex = (phraseIndex + 1) % phrases.length
        delay = 450
      }

      window.setTimeout(tick, delay)
    }

    input.placeholder = ''
    window.setTimeout(tick, 350)
  }

  const initialize = (root = document) => {
    root.querySelectorAll(selector).forEach(animate)
  }

  initialize()

  new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return
        if (node.matches(selector)) animate(node)
        initialize(node)
      })
    })
  }).observe(document.documentElement, { childList: true, subtree: true })
})()
