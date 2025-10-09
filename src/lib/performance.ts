// Extend Window interface for gtag
declare global {
    interface Window {
        gtag?: (
            command: 'event',
            eventName: string,
            eventParams?: Record<string, any>
        ) => void
    }
}

// Extend PerformanceEntry for FID
interface FIDEntry extends PerformanceEntry {
    processingStart: number
}

// Extend PerformanceEntry for CLS
interface CLSEntry extends PerformanceEntry {
    hadRecentInput: boolean
    value: number
}

// Performance monitoring
export class PerformanceMonitor {
    private marks: Map<string, number> = new Map()

    mark(name: string) {
        this.marks.set(name, performance.now())
    }

    measure(name: string, startMark: string, endMark?: string) {
        const start = this.marks.get(startMark)
        const end = endMark ? this.marks.get(endMark) : performance.now()

        if (start && end) {
            const duration = end - start
            console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`)

            // Send to analytics if needed
            if (typeof window !== 'undefined' && window.gtag) {
                window.gtag('event', 'timing_complete', {
                    name,
                    value: Math.round(duration),
                })
            }
        }
    }

    // Core Web Vitals
    static reportWebVitals() {
        if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
            // Largest Contentful Paint
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    console.log('LCP:', entry.startTime)
                }
            }).observe({ type: 'largest-contentful-paint', buffered: true })

            // First Input Delay
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    const fidEntry = entry as FIDEntry
                    const fid = fidEntry.processingStart - fidEntry.startTime
                    console.log('FID:', fid)
                }
            }).observe({ type: 'first-input', buffered: true })

            // Cumulative Layout Shift
            let cls = 0
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    const clsEntry = entry as CLSEntry
                    if (!clsEntry.hadRecentInput) {
                        cls += clsEntry.value
                        console.log('CLS:', cls)
                    }
                }
            }).observe({ type: 'layout-shift', buffered: true })
        }
    }
}

// Initialize monitoring
if (typeof window !== 'undefined') {
    PerformanceMonitor.reportWebVitals()
}