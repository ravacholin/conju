import { useState, useEffect } from 'react';

// Mobile detection utility
export const isMobile = () => {
  // Check for mobile device using user agent and screen size
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
  const isSmallScreen = window.innerWidth <= 768;
  
  return isMobileUA || isSmallScreen;
};

export const isTablet = () => {
  return window.innerWidth > 768 && window.innerWidth <= 1024;
};

export const isDesktop = () => {
  return window.innerWidth > 1024;
};

// Responsive breakpoints
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1025
};

// Hook for responsive design
export const useResponsive = () => {
  const [isMobileDevice, setIsMobileDevice] = useState(isMobile());
  const [isTabletDevice, setIsTabletDevice] = useState(isTablet());
  const [isDesktopDevice, setIsDesktopDevice] = useState(isDesktop());

  useEffect(() => {
    const handleResize = () => {
      setIsMobileDevice(isMobile());
      setIsTabletDevice(isTablet());
      setIsDesktopDevice(isDesktop());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile: isMobileDevice,
    isTablet: isTabletDevice,
    isDesktop: isDesktopDevice
  };
}; 