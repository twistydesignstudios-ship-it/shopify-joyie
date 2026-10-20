import { prepareTransition } from 'util.misc'
import { disableBodyScroll, clearAllBodyScrollLocks } from 'vendor.body-scroll-lock'
import { trapFocus, removeTrapFocus, focusable } from 'util.a11y'
import { EVENTS } from 'util.events'

const isIOS =
  /iP(ad|hone|od)/.test(navigator.platform) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

class HeaderDrawer extends HTMLElement {
  constructor() {
    super()
    this.isOpen = false
    this.isClosing = false
    this.scrollBeforeOpen = null
    this.abortController = new AbortController()
  }
  connectedCallback() {
    if (!this.getAttribute('open') || !this.getAttribute('close')) return
    document.addEventListener(this.getAttribute('open'), this.open.bind(this), { signal: this.abortController.signal })
    document.addEventListener(this.getAttribute('close'), this.close.bind(this), {
      signal: this.abortController.signal
    })
  }

  open(evt) {
    if (this.isOpen || this.isClosing) return

    this.activeElement = evt.target

    this.dispatchEvent(new CustomEvent(EVENTS.sizeDrawer, { bubbles: true }))

    prepareTransition(
      this,
      function () {
        this.classList.add('is-active')
      }.bind(this)
    )

    const _scrollX = window.scrollX
    const _scrollY = window.scrollY

    // Keep the page at its current visual position while the drawer is open.
    // Moving the window to the top after iOS has fixed the body makes Safari's
    // visual viewport jump/appear zoomed when the cart is closed.
    this.scrollBeforeOpen = { x: _scrollX, y: _scrollY }

    // The cart drawer opts out of JS body locking. On iOS, body-scroll-lock
    // pins the body with position: fixed, which can change Safari's visual
    // viewport scale when the drawer closes. The cart is intentionally left
    // out of the document-level CSS lock too, avoiding Safari repaint glitches.
    this.skipScrollLock = this.hasAttribute('no-scroll-lock')

    if (!this.skipScrollLock) {
      disableBodyScroll(this, {
        reserveScrollBarGap: true,
        // Explicitly allow touch events within drawer for iOS scroll support
        allowTouchMove: (el) => this === el || this.contains(el),
      });
    }


    // Trap focus within the drawer
    trapFocus(this)

    // Enforce focus wrapping on Tab/Shift+Tab inside the drawer
    this.addEventListener('keydown', this.handleKeydown, { signal: this.abortController.signal })

    // Esc key closes the drawer
    window.addEventListener('keyup', this.handleWindowKeyup, { signal: this.abortController.signal })

    this.dispatchEvent(new CustomEvent(EVENTS.headerOverlayRemoveClass, { bubbles: true }))
    this.dispatchEvent(new CustomEvent(EVENTS.headerDrawerOpened, { bubbles: true }))
    this.dispatchEvent(new CustomEvent('drawerOpen', { bubbles: true }))

    this.isOpen = true

    // Clicking out of the drawer closes it
    setTimeout(() => {
      window.addEventListener('click', this.handleWindowClick, { signal: this.abortController.signal })
    }, 0)
  }

  close(evt, noAnimate) {
    // Do not close if click event came from inside drawer
    if (evt && evt.target.closest && evt.target.closest('.site-header__drawer')) {
      return
    }

    if (!this.isOpen || this.isClosing) {
      return
    }

    this.isClosing = true

    if (noAnimate) {
      this.classList.remove('is-active')

      this.dispatchEvent(new CustomEvent(EVENTS.headerDrawerClosed, { bubbles: true }))

      window.removeEventListener('keyup', this.handleWindowKeyup)
      window.removeEventListener('click', this.handleWindowClick)
      this.removeEventListener('keydown', this.handleKeydown)

      this.isOpen = false
      this.isClosing = false

      // Remove focus trap
      if (this.activeElement) removeTrapFocus(this.activeElement)

      this.releaseScrollLock()
    } else {
      let closeFallback
      const onClosed = (transitionEvent) => {
        if (transitionEvent && transitionEvent.target !== this) return

        window.clearTimeout(closeFallback)
        this.removeEventListener('transitionend', onClosed)

        this.dispatchEvent(new CustomEvent(EVENTS.headerDrawerClosed, { bubbles: true }))

        window.removeEventListener('keyup', this.handleWindowKeyup)
        window.removeEventListener('click', this.handleWindowClick)
        this.removeEventListener('keydown', this.handleKeydown)

        this.isOpen = false
        this.isClosing = false

        // Remove focus trap
        if (this.activeElement) removeTrapFocus(this.activeElement)

        this.releaseScrollLock()
      }

      this.addEventListener('transitionend', onClosed)

      prepareTransition(
        this,
        function () {
          this.classList.remove('is-active')
        }.bind(this)
      )

      // Safari may not emit transitionend if a bubbling child transition
      // removes the shared is-transitioning class first. Always finish the
      // close state so header icons cannot remain hidden behind `.cart-open`.
      closeFallback = window.setTimeout(() => onClosed(), 350)
    }
  }

  // On iOS the scroll lock works by pinning the body, so clearing it restores the scroll position
  // as a side effect. Everywhere else the lock is just `overflow: hidden` and has no position of
  // its own to give back, so put the shopper back where they were.
  releaseScrollLock() {
    if (!this.skipScrollLock) {
      clearAllBodyScrollLocks()
    }

    const scrollBeforeOpen = this.scrollBeforeOpen
    this.scrollBeforeOpen = null

    if (!scrollBeforeOpen) return

    // body-scroll-lock already restores both axes when it unpins the body on
    // iOS. A second window.scrollTo can disturb Safari's visual viewport.
    if (!this.skipScrollLock && isIOS) return
    if (window.scrollX === scrollBeforeOpen.x && window.scrollY === scrollBeforeOpen.y) return

    window.scrollTo(scrollBeforeOpen.x, scrollBeforeOpen.y)
  }

  handleWindowKeyup = (evt) => {
    if (evt.keyCode === 27) {
      this.close()
    }
  }

  handleWindowClick = (evt) => {
    this.close(evt)
  }

  handleKeydown = (evt) => {
    const isTab = evt.key === 'Tab' || evt.keyCode === 9
    if (!isTab) return

    let elements = []
    try {
      elements = focusable(this) || []
    } catch (e) {
      elements = []
    }
    if (!elements.length) return

    const first = elements[0]
    const last = elements[elements.length - 1]
    const active = document.activeElement

    if (!evt.shiftKey && active === last) {
      evt.preventDefault()
      first && first.focus()
      return
    }

    if (evt.shiftKey && (active === first || active === this)) {
      evt.preventDefault()
      last && last.focus()
      return
    }
  }

  disconnectedCallback() {
    this.abortController.abort()
  }
}

customElements.define('header-drawer', HeaderDrawer)
