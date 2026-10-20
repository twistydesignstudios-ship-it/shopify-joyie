(() => {
class MegaPredictiveSearch extends HTMLElement {
  connectedCallback() {
    this.abortController = new AbortController()
    this.input = this.querySelector('input[type="search"]')
    this.results = this.querySelector('[data-mega-search-results]')
    this.closeButton = this.querySelector('[data-mega-search-close]')
    this.timer = null

    this.input.addEventListener('input', () => this.handleInput(), { signal: this.abortController.signal })
    this.closeButton.addEventListener('click', () => this.close(), { signal: this.abortController.signal })
    this.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.close()
    }, { signal: this.abortController.signal })
    document.addEventListener('click', (event) => {
      if (!this.contains(event.target)) this.close(false, false)
    }, { signal: this.abortController.signal })
  }

  handleInput() {
    clearTimeout(this.timer)
    const term = this.input.value.trim()
    if (!term) {
      this.close(false)
      return
    }
    this.classList.add('is-active')
    this.timer = setTimeout(() => this.fetchResults(term), 300)
  }

  async fetchResults(term) {
    const params = new URLSearchParams({
      q: term,
      'resources[type]': 'query,product,page',
      'resources[limit]': '3',
      'resources[limit_scope]': 'each',
      'resources[options][unavailable_products]': 'last'
    })

    try {
      const predictiveUrl = (this.dataset.predictiveUrl || '/search/suggest').replace(/\.json$/, '')
      const response = await fetch(`${predictiveUrl}.json?${params}`)
      if (!response.ok) throw new Error(response.status)
      const data = await response.json()
      if (term !== this.input.value.trim()) return
      this.renderResults(data.resources?.results || {}, term)
      this.results.style.display = 'block'
    } catch (error) {
      this.close(false)
    }
  }

  renderResults(data, term) {
    const wrapper = document.createElement('div')
    wrapper.className = 'joyie-mega-results'

    this.addTextGroup(wrapper, 'Suggestions', data.queries || [])
    this.addTextGroup(wrapper, 'Pages', data.pages || [])

    if (data.products?.length) {
      const group = document.createElement('div')
      group.className = 'joyie-mega-results__group joyie-mega-results__products'
      group.appendChild(this.heading('Products'))
      data.products.forEach((product) => {
        const link = document.createElement('a')
        link.className = 'joyie-mega-results__product'
        link.href = product.url
        const imageUrl = typeof product.image === 'string'
          ? product.image
          : product.image?.url || product.featured_image?.url
        if (imageUrl) {
          const image = document.createElement('img')
          image.src = imageUrl
          image.alt = ''
          image.loading = 'lazy'
          link.appendChild(image)
        }
        const title = document.createElement('span')
        title.textContent = product.title
        link.appendChild(title)
        group.appendChild(link)
      })
      wrapper.appendChild(group)
    }

    const footer = document.createElement('a')
    footer.className = 'joyie-mega-results__footer'
    footer.href = `/search?q=${encodeURIComponent(term)}`
    footer.textContent = `Show all results for “${term}” →`
    wrapper.appendChild(footer)
    this.results.replaceChildren(wrapper)
  }

  addTextGroup(wrapper, label, items) {
    if (!items.length) return
    const group = document.createElement('div')
    group.className = 'joyie-mega-results__group'
    group.appendChild(this.heading(label))
    items.forEach((item) => {
      const link = document.createElement('a')
      link.href = item.url
      link.textContent = item.text || item.title
      group.appendChild(link)
    })
    wrapper.appendChild(group)
  }

  heading(text) {
    const heading = document.createElement('h3')
    heading.textContent = text
    return heading
  }

  close(clear = true, retainFocus = true) {
    clearTimeout(this.timer)
    this.results.style.display = 'none'
    this.results.innerHTML = ''
    this.classList.remove('is-active')
    if (clear) this.input.value = ''
    if (retainFocus) this.input.focus({ preventScroll: true })
  }

  disconnectedCallback() {
    this.abortController.abort()
  }
}

if (!customElements.get('mega-predictive-search')) {
  customElements.define('mega-predictive-search', MegaPredictiveSearch)
}
})()
