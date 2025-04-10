
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useMobile() {
  const isMobile = useIsMobile()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  
  const toggleMenu = React.useCallback(() => {
    setIsMenuOpen(prev => !prev)
  }, [])
  
  return {
    isMobile,
    isMenuOpen,
    toggleMenu
  }
}
