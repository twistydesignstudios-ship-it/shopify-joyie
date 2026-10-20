document.addEventListener('click', (event) => {
  const showAllButton = event.target.closest('[data-mega-browse]')
  const backButton = event.target.closest('[data-mega-back]')
  if (!showAllButton && !backButton) return

  const megaMenu = (showAllButton || backButton).closest('.megamenu')
  if (!megaMenu) return

  const curatedView = megaMenu.querySelector('[data-mega-curated]')
  const allStatesView = megaMenu.querySelector('[data-mega-all]')
  if (!curatedView || !allStatesView) return

  event.preventDefault()

  const navDetails = megaMenu.closest('details')
  if (navDetails) {
    navDetails.setAttribute('open', '')
    navDetails.querySelector(':scope > summary')?.setAttribute('aria-expanded', 'true')
  }

  if (backButton) {
    curatedView.hidden = false
    curatedView.querySelector('[data-mega-browse]')?.focus({ preventScroll: true })
    allStatesView.hidden = true
    megaMenu.classList.remove('is-showing-all-states')
    return
  }

  allStatesView.hidden = false
  // Move focus before hiding the clicked button; otherwise focusout closes the dropdown.
  allStatesView.querySelector('[data-mega-back]')?.focus({ preventScroll: true })
  curatedView.hidden = true
  megaMenu.classList.add('is-showing-all-states')

  if (navDetails && navDetails.dataset.megaStatesReset !== 'true') {
    navDetails.dataset.megaStatesReset = 'true'
    navDetails.addEventListener('toggle', () => {
      if (navDetails.open) return
      curatedView.hidden = false
      allStatesView.hidden = true
      megaMenu.classList.remove('is-showing-all-states')
    })
  }
})
