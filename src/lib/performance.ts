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
                    const fid = entry.processingStart - entry.startTime
                    console.log('FID:', fid)
                }
            }).observe({ type: 'first-input', buffered: true })

            // Cumulative Layout Shift
            let cls = 0
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!(entry as any).hadRecentInput) {
                        cls += (entry as any).value
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