// Next.js 16 instrumentation-client.ts
// Runs once on the client before React hydration.

if (typeof window !== 'undefined') {
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason
    const message = reason instanceof Error ? reason.message : String(reason ?? '')
    const name = reason instanceof Error ? reason.name : ''

    if (
      name === 'AbortError' ||
      message.includes('AbortError') ||
      message.includes('user aborted a request') ||
      message.includes('Database is closing/hidden') ||
      message.includes('closing/hidden')
    ) {
      // Firebase internally cancels requests and closes IndexedDB connections when pages change/hide
      event.preventDefault()
      if (typeof event.stopImmediatePropagation === 'function') {
        event.stopImmediatePropagation()
      }
    }
  }

  window.addEventListener('unhandledrejection', handleUnhandledRejection, { capture: true })
}
