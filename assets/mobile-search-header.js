(() => {
  const mobileQuery = window.matchMedia('(max-width: 768px)')
  let lockedHeader = null

  const updateViewportTop = () => {
    if (!lockedHeader) return
    const viewportTop = window.visualViewport?.offsetTop || 0
    lockedHeader.style.setProperty('--mobile-search-viewport-top', `${viewportTop}px`)
  }

  const lockHeader = (input) => {
    if (!mobileQuery.matches || !input.matches('.site-header .search__input')) return

    const wrapper = input.closest('#HeaderWrapper')
    if (!wrapper?.classList.contains('header-wrapper--compressed') && window.scrollY <= 10) return

    lockedHeader = input.closest('.header-section') || document.querySelector('.header-section')
    if (!lockedHeader) return

    lockedHeader.classList.add('mobile-search-header-lock')
    updateViewportTop()
  }

  const unlockHeader = () => {
    window.setTimeout(() => {
      if (document.activeElement?.matches('.site-header .search__input')) return
      lockedHeader?.classList.remove('mobile-search-header-lock')
      lockedHeader?.style.removeProperty('--mobile-search-viewport-top')
      lockedHeader = null
    }, 100)
  }

  document.addEventListener('pointerdown', (event) => lockHeader(event.target))
  document.addEventListener('focusin', (event) => lockHeader(event.target))
  document.addEventListener('focusout', unlockHeader)
  window.visualViewport?.addEventListener('resize', updateViewportTop)
  window.visualViewport?.addEventListener('scroll', updateViewportTop)
})()
