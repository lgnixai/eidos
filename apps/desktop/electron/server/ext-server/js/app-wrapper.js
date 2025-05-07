import React from "react"
import { createRoot } from "react-dom/client"

import { Toaster } from "@/components/ui/toaster"

let retryCount = 0
const maxRetries = 3

const executeCode = async () => {
  try {
    const moduleExports = await import("/app.js")
    // URL.revokeObjectURL('/app.js')

    let MyComponent = moduleExports.default

    if (!MyComponent) {
      MyComponent = Object.values(moduleExports).find(
        (exported) => typeof exported === "function"
      )
    }

    if (!MyComponent) {
      throw new Error("Make sure to export a default component or a function")
    }

    const rootElement = document.getElementById("root")
    if (!rootElement) {
      throw new Error("Root element not found")
    }

    const root = createRoot(rootElement)

    root.render(
      React.createElement(React.StrictMode, null, [
        React.createElement(MyComponent, {}),
        React.createElement(Toaster),
      ])
    )

    document.getElementById("loading").style.opacity = "0"
    setTimeout(() => {
      document.getElementById("loading").style.display = "none"
    }, 200)
  } catch (err) {
    console.error("Execution error:", err)
    console.error("Error stack:", err.stack)
    if (retryCount < maxRetries) {
      retryCount++
      console.log(`Retrying... Attempt ${retryCount} of ${maxRetries}`)
      const loadingEl = document.getElementById("loading")
      loadingEl.style.opacity = "1"
      loadingEl.style.display = "flex"
      setTimeout(executeCode, 1000)
      return
    }

    const errorElement = document.createElement("div")
    errorElement.style.color = "red"
    errorElement.style.padding = "1rem"
    errorElement.style.fontFamily = "monospace"
    errorElement.textContent = `\${err.message}\n${err.stack}`
    document.body.appendChild(errorElement)

    document.getElementById("loading").style.display = "none"
  }
}

executeCode().catch((err) => {
  console.error("Top level error:", err)
  document.getElementById("loading").style.display = "none"
})
