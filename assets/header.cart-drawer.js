import CartForm from 'module.cart-form'
import { EVENTS } from 'util.events'

class HeaderCart extends HTMLElement {
  constructor() {
    super()

    this.form = this.querySelector('form')
    this.cartType = this.getAttribute('cart-type')
  }

  disconnectedCallback() {
    this.abortController.abort()
  }

  connectedCallback() {
    this.abortController = new AbortController()

    this.cartForm = new CartForm(this.form)
    this.cartForm.buildCart()

    this.querySelector('[data-cart-drawer-close]')?.addEventListener(
      'click',
      () => document.dispatchEvent(new CustomEvent(EVENTS.cartClose)),
      { signal: this.abortController.signal }
    )

    document.addEventListener(EVENTS.ajaxProductAdded, this.handleCartChange.bind(this), {
      signal: this.abortController.signal
    })

    // The newer product-form component uses its own lifecycle events instead
    // of ajaxProductAdded. Bridge both systems so every add-to-cart flow
    // refreshes and opens the same drawer.
    document.addEventListener('product-form:submit:success', this.handleProductFormSuccess.bind(this), {
      signal: this.abortController.signal
    })

    document.addEventListener('product-form:cart:navigate', (evt) => evt.preventDefault(), {
      signal: this.abortController.signal
    })

    document.addEventListener('product-form:message:success', (evt) => evt.preventDefault(), {
      signal: this.abortController.signal
    })

    // Personalized-product apps (including Teeinblue) complete their own
    // cart request and then expose this event without Shopify section markup.
    document.addEventListener('teeinblue-event-after-cart-added', this.handleExternalCartAdd.bind(this), {
      signal: this.abortController.signal
    })
  }

  handleProductFormSuccess() {
    return this.handleCartChange()
  }

  handleExternalCartAdd(evt) {
    evt.preventDefault()
    return this.handleCartChange()
  }

  async handleCartChange(evt) {
    this.setAttribute('aria-busy', 'true')

    try {
      // Standard and quick-add requests return bundled section HTML. App
      // integrations may only announce that the cart changed, so fetch the
      // section in that case instead of silently ignoring the event.
      const bundledMarkup = evt?.detail?.product?.sections?.['cart-ajax']
      const markup = bundledMarkup || (await this.cartForm.getCartProductMarkup())
      if (!markup) throw new Error('Cart drawer markup was empty')

      this.cartForm.cartMarkup(markup)

      // Always publish the rendered section so the header count and any
      // other cart UI stay in sync, including app-driven additions.
      document.dispatchEvent(
        new CustomEvent(EVENTS.cartUpdated, {
          detail: {
            cart: {
              sections: {
                'cart-ajax': markup
              }
            }
          }
        })
      )

      if (!evt?.detail?.preventCartOpen && this.cartType === 'dropdown') {
        this.dispatchEvent(new CustomEvent(EVENTS.cartOpen, { bubbles: true }))
      }
    } catch (error) {
      console.error('Unable to refresh the cart drawer:', error)
    } finally {
      this.removeAttribute('aria-busy')
    }

    // Resets cart property so that the form submit button can work
    if (this.cartForm.cartItemsUpdated) {
      this.cartForm.cartItemsUpdated = false
    }
  }
}

customElements.define('header-cart-drawer', HeaderCart)
