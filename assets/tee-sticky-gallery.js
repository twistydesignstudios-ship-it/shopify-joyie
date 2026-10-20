document.addEventListener('DOMContentLoaded', () => {
  const addPersonalizeHeading = () => {
    const customizationWrapper = document.querySelector('.tee-customization-wrapper');
    if (!customizationWrapper) return false;

    if (customizationWrapper.previousElementSibling?.classList.contains('tw-personalize-heading')) {
      return true;
    }

    document.querySelectorAll('.tw-personalize-heading').forEach(heading => heading.remove());

    const heading = document.createElement('div');
    heading.className = 'tw-personalize-heading';
    heading.innerHTML = `
      <span class="tw-personalize-heading__number" aria-hidden="true">3</span>
      <h2 class="tw-personalize-heading__text">Personalize</h2>
    `;
    customizationWrapper.before(heading);
    return true;
  };

  addPersonalizeHeading();

  const personalizeRoot = document.querySelector('.product-purchase-row') || document.body;
  const personalizeObserver = new MutationObserver(addPersonalizeHeading);
  personalizeObserver.observe(personalizeRoot, { childList: true, subtree: true });

  const fixedLivePreview = () => {
    const galleryWrapperSelector = '.grid__item';
    const $teeGallery = document.getElementById('tee-gallery');
    const $gallery = $teeGallery && $teeGallery.closest(galleryWrapperSelector);
    const $teeForm = document.getElementById('tee-artwork-form');
    const $stickyBoundary = document.querySelector('.product-purchase-row') || $teeForm;
    const $galleryContent = $gallery && $gallery.querySelector('.tee-gallery-content');

    if (!$teeGallery || !$gallery || !$teeForm || !$stickyBoundary || !$galleryContent) return false;

    const SCALE = 0.7;
    const PADDING_Y = 30;
    const SAFETY_SCROLLING_RANGE = 10;
    const STICKY_END_OFFSET = 140;

    const style = document.createElement('style');
    style.innerHTML = `
      .gallery--sticky:not(.gallery--sticky--hide) ${galleryWrapperSelector} {
        z-index: 9999;
      }
      .gallery--sticky:not(.gallery--sticky--hide) ${galleryWrapperSelector} .tee-gallery-content {
        background: #fff;
        display: flex;
        justify-content: center;
        left: 0;
        position: fixed;
        top: 0;
        width: 100vw;
        z-index: 99;
        padding: ${PADDING_Y}px 0;
      }
      .gallery--sticky:not(.gallery--sticky--hide) ${galleryWrapperSelector} #tee-gallery {
        transform: scale(${SCALE});
        transform-origin: top center;
      }
      .gallery--sticky:not(.gallery--sticky--hide) ${galleryWrapperSelector} .tee-gallery {
        width: auto;
      }
      .gallery--sticky:not(.gallery--sticky--hide) ${galleryWrapperSelector} .tee-thumbnails,
      .gallery--sticky:not(.gallery--sticky--hide) ${galleryWrapperSelector} .tee-slider__dots {
        display: none;
      }
      .gallery--sticky:not(.gallery--sticky--hide) .gallery--close-button {
        display: block;
      }
      .gallery--sticky.gallery--sticky--hide .sticky-gallery-button {
        display: flex;
      }
      .sticky-gallery-button {
        background-color: #fff;
        border: 1px solid #dedbd5;
        border-radius: 999px;
        box-shadow: 0 3px 10px rgba(0, 0, 0, .22);
        color: #17191b;
        display: none;
        align-items: center;
        gap: 6px;
        height: 40px;
        justify-content: center;
        min-width: 94px;
        padding: 5px 14px 5px 6px;
        position: fixed;
        right: 20px;
        top: 100px;
        width: auto;
        z-index: 5;
        font-size: 12px;
        font-weight: 600;
        line-height: 1;
      }
      .sticky-gallery-button::before {
        align-items: center;
        background: #222;
        border-radius: 50%;
        color: #fff;
        content: '✓';
        display: flex;
        flex: 0 0 27px;
        font-size: 14px;
        height: 27px;
        justify-content: center;
        width: 27px;
      }
      .gallery--close-button {
        background-image: url('data:image/svg+xml;utf8,<svg height="329pt" viewBox="0 0 329.26933 329" width="329pt" xmlns="http://www.w3.org/2000/svg"><path d="m194.800781 164.769531 128.210938-128.214843c8.34375-8.339844 8.34375-21.824219 0-30.164063-8.339844-8.339844-21.824219-8.339844-30.164063 0l-128.214844 128.214844-128.210937-128.214844c-8.34375-8.339844-21.824219-8.339844-30.164063 0-8.34375 8.339844-8.34375 21.824219 0 30.164063l128.210938 128.214843-128.210938 128.214844c-8.34375 8.339844-8.34375 21.824219 0 30.164063 4.15625 4.160156 9.621094 6.25 15.082032 6.25 5.460937 0 10.921875-2.089844 15.082031-6.25l128.210937-128.214844 128.214844 128.214844c4.160156 4.160156 9.621094 6.25 15.082032 6.25 5.460937 0 10.921874-2.089844 15.082031-6.25 8.34375-8.339844 8.34375-21.824219 0-30.164063zm0 0"/></svg>');
        background-position: center;
        background-repeat: no-repeat;
        background-size: 16px 16px;
        display: none;
        height: 17px;
        opacity: 0.8;
        position: fixed;
        right: 20px;
        top: 20px;
        width: 17px;
        z-index: 1000;
        padding: 13px;
        border: 2px solid #C65029;
        border-radius: 5px;
      }
      .sticky-gallery-mask {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        background: #fff;
        box-shadow: 0 2px 5px 3px rgba(0, 0, 0, .15);
        z-index: 9;
        display: none;
      }
      .gallery--sticky--hide .sticky-gallery-mask {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    let hasStickyButton = false;
    let hasCloseButton = false;
    let isSticky = false;
    let lastCheckScrollY = null;
    let maskEl = null;
    let stickyButtonEl = null;

    let originalWrapperHeight = 0;

    const stickyCondHeight = $galleryContent.offsetHeight + PADDING_Y * 2;

    const updateStickyButtonPosition = () => {
      if (!stickyButtonEl) return;

      if (window.innerWidth <= 768) {
        const header = document.querySelector('.header-section');
        const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
        stickyButtonEl.style.top = `${Math.max(12, headerBottom + 10)}px`;
      } else {
        stickyButtonEl.style.removeProperty('top');
      }
    };

    const ensureMask = () => {
      if (maskEl) return;
      maskEl = document.createElement('div');
      maskEl.className = 'sticky-gallery-mask';
      document.body.appendChild(maskEl);
    };

    const updateMaskHeight = height => {
      ensureMask();
      if (!height) {
        maskEl.style.display = 'none';
        maskEl.style.removeProperty('height');
        return;
      }
      maskEl.style.display = 'block';
      maskEl.style.height = `${height}px`;
    };

    const getOverlayHeight = () => {
      return $galleryContent.getBoundingClientRect().height || $galleryContent.offsetHeight;
    };

    const applyOverlayLayout = () => {
      const h = getOverlayHeight();
      if (!h) return;

      if (originalWrapperHeight) {
        $gallery.style.height = `${originalWrapperHeight}px`;
      }
      $gallery.style.display = 'block';
      
      updateMaskHeight(h);
    };

    const clearOverlayLayout = () => {
      $gallery.style.removeProperty('height');
      $gallery.style.removeProperty('display');
      updateMaskHeight(0);
    };

    const onScroll = () => {
      const currentY = window.scrollY || window.pageYOffset || 0;
      updateStickyButtonPosition();

      if (
        lastCheckScrollY !== null &&
        Math.abs(currentY - lastCheckScrollY) < SAFETY_SCROLLING_RANGE
      ) {
        if (isSticky) {
          const h = getOverlayHeight();
          if (h) updateMaskHeight(h);
        }
        return;
      }
      lastCheckScrollY = currentY;

      const $teeGallery = document.querySelector(
        `${galleryWrapperSelector} #tee-gallery`
      );
      if (!$teeGallery) return;

      if (!hasStickyButton) {
        const stickyButton = document.createElement('div');
        stickyButton.className = 'sticky-gallery-button';
        stickyButton.textContent = 'Preview';
        stickyButton.addEventListener('click', e => {
          e.preventDefault();
          document.body.classList.remove('gallery--sticky--hide');
          originalWrapperHeight = $galleryContent.offsetHeight + 10;
          applyOverlayLayout();
        });
        document.body.appendChild(stickyButton);
        stickyButtonEl = stickyButton;
        updateStickyButtonPosition();
        hasStickyButton = true;
        window.dispatchEvent(new Event('resize'));
      }

      if (!hasCloseButton) {
        const closeButton = document.createElement('div');
        closeButton.className = 'gallery--close-button';
        closeButton.addEventListener('click', e => {
          e.preventDefault();
          document.body.classList.add('gallery--sticky--hide');
          clearOverlayLayout();

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              lastCheckScrollY = null;
              onScroll();
              window.dispatchEvent(new Event('resize'));
            });
          });
        });
        document.body.appendChild(closeButton);
        hasCloseButton = true;
      }

      const galleryBottom = $gallery.getBoundingClientRect().bottom;
      const stickyBoundaryBottom = $stickyBoundary.getBoundingClientRect().bottom;

      if (
        galleryBottom < 0 &&
        stickyBoundaryBottom > stickyCondHeight - STICKY_END_OFFSET &&
        !isSticky
      ) {
        
        originalWrapperHeight = $galleryContent.offsetHeight + 10;

        document.body.classList.add('gallery--sticky');
        requestAnimationFrame(() => {
          applyOverlayLayout();
        });
        isSticky = true;
        window.dispatchEvent(new Event('resize'));
      }

      if (
        isSticky &&
        (stickyBoundaryBottom < stickyCondHeight - STICKY_END_OFFSET || galleryBottom > 0)
      ) {
        document.body.classList.remove('gallery--sticky');
        clearOverlayLayout();
        isSticky = false;
        window.dispatchEvent(new Event('resize'));
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateStickyButtonPosition, { passive: true });
    window.visualViewport?.addEventListener('resize', updateStickyButtonPosition, { passive: true });
    return true;
  };

  const w = window.innerWidth;
  const h = window.innerHeight;

  if (h / w > 1.5 && w < 768) {
    if (!fixedLivePreview()) {
      const observer = new MutationObserver(() => {
        if (fixedLivePreview()) observer.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => observer.disconnect(), 10000);
    }
  }
});
