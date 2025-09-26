import { useEffect, useCallback, useRef } from 'react'

// Debounce hook
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return debouncedValue
}

// Intersection Observer for lazy loading
export function useIntersectionObserver(
    options?: IntersectionObserverInit
) {
    const [isIntersecting, setIsIntersecting] = useState(false)
    const targetRef = useRef<HTMLElement | null>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setIsIntersecting(entry.isIntersecting),
            options
        )

        const element = targetRef.current
        if (element) {
            observer.observe(element)
        }

        return () => {
            if (element) {
                observer.unobserve(element)
            }
        }
    }, [options])

    return { targetRef, isIntersecting }
}

// Virtual Scroll for long message lists
export function useVirtualScroll<T>(
    items: T[],
    itemHeight: number,
    containerHeight: number
) {
    const [scrollTop, setScrollTop] = useState(0)

    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight)
    const visibleItems = items.slice(startIndex, endIndex)

    const totalHeight = items.length * itemHeight
    const offsetY = startIndex * itemHeight

    return {
        visibleItems,
        totalHeight,
        offsetY,
        onScroll: (e: React.UIEvent<HTMLElement>) => {
            setScrollTop(e.currentTarget.scrollTop)
        }
    }
}

// Optimize re-renders
export function useMemoizedCallback<T extends (...args: any[]) => any>(
    callback: T,
    deps: React.DependencyList
): T {
    const ref = useRef<T>(callback)

    useEffect(() => {
        ref.current = callback
    }, [callback])

    return useCallback(
        ((...args) => ref.current(...args)) as T,
        deps
    )
}