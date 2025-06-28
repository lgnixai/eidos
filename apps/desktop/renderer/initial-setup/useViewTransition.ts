import { useCallback, useRef } from "react"
import { flushSync } from "react-dom"
import { useNavigate } from "react-router-dom"

/**
 * React View Transition Hook
 * 
 * This Hook solves several key issues with the View Transition API in React:
 * 1. React's async state updates need flushSync to force synchronization
 * 2. Prevents duplicate transition calls
 * 3. Provides complete error handling and debugging information
 * 4. Deep integration with React Router
 */
export function useViewTransition() {
    const navigate = useNavigate()
    const isTransitioning = useRef(false)

    // Check if browser supports View Transition API
    const isSupported = useCallback(() => {
        return typeof document !== 'undefined' && 'startViewTransition' in document
    }, [])

    // Execute navigation with view transition
    const navigateWithTransition = useCallback((
        path: string,
        options?: {
            replace?: boolean
            state?: any
            onStart?: () => void
            onReady?: () => void
            onFinish?: () => void
            onError?: (error: Error) => void
        }
    ) => {
        // Prevent duplicate calls
        if (isTransitioning.current) {
            console.warn("View transition in progress, ignoring new navigation request")
            return
        }

        const { replace = false, state, onStart, onReady, onFinish, onError } = options || {}

        // If View Transition API is not supported, navigate directly
        if (!isSupported()) {
            console.log("Browser doesn't support View Transition API, using normal navigation")
            navigate(path, { replace, state })
            return Promise.resolve()
        }

        console.log("Starting view transition to:", path)
        isTransitioning.current = true

        // Call start callback
        onStart?.()

        // Use View Transition API
        const transition = document.startViewTransition(() => {
            // Use flushSync to ensure React's state updates are synchronous
            // This is key to using View Transition API in React
            flushSync(() => {
                navigate(path, { replace, state })
            })
        })

        // Handle transition states
        transition.ready
            .then(() => {
                console.log("View transition animation started")
                onReady?.()
            })
            .catch((error) => {
                console.error("View transition preparation failed:", error)
                onError?.(error)
            })

        transition.finished
            .then(() => {
                console.log("View transition completed")
                isTransitioning.current = false
                onFinish?.()
            })
            .catch((error) => {
                console.error("View transition execution failed:", error)
                isTransitioning.current = false
                onError?.(error)
            })

        return transition.finished
    }, [navigate, isSupported])

    // Execute state update with view transition (for same-page state changes)
    const updateWithTransition = useCallback((
        updateFn: () => void,
        options?: {
            onStart?: () => void
            onReady?: () => void
            onFinish?: () => void
            onError?: (error: Error) => void
        }
    ) => {
        const { onStart, onReady, onFinish, onError } = options || {}

        // If View Transition API is not supported, update directly
        if (!isSupported()) {
            console.log("Browser doesn't support View Transition API, updating state directly")
            updateFn()
            return Promise.resolve()
        }

        console.log("Starting state view transition")

        onStart?.()

        const transition = document.startViewTransition(() => {
            flushSync(() => {
                updateFn()
            })
        })

        transition.ready
            .then(() => {
                console.log("State transition animation started")
                onReady?.()
            })
            .catch((error) => {
                console.error("State transition preparation failed:", error)
                onError?.(error)
            })

        transition.finished
            .then(() => {
                console.log("State transition completed")
                onFinish?.()
            })
            .catch((error) => {
                console.error("State transition execution failed:", error)
                onError?.(error)
            })

        return transition.finished
    }, [isSupported])

    return {
        navigateWithTransition,
        updateWithTransition,
        isSupported: isSupported(),
        isTransitioning: isTransitioning.current
    }
}

 