import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Function to generate lighter and darker shades of a color
const generateShades = (baseColor) => {
  const hex = baseColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Generate lighter shade (secondary)
  const lighterR = Math.min(255, Math.round(r + (255 - r) * 0.3))
  const lighterG = Math.min(255, Math.round(g + (255 - g) * 0.3))
  const lighterB = Math.min(255, Math.round(b + (255 - b) * 0.3))
  
  // Generate darker shade
  const darkerR = Math.round(r * 0.7)
  const darkerG = Math.round(g * 0.7)
  const darkerB = Math.round(b * 0.7)
  
  // Generate light shade
  const lightR = Math.min(255, Math.round(r + (255 - r) * 0.8))
  const lightG = Math.min(255, Math.round(g + (255 - g) * 0.8))
  const lightB = Math.min(255, Math.round(b + (255 - b) * 0.8))
  
  return {
    primary: baseColor,
    secondary: `#${lighterR.toString(16).padStart(2, '0')}${lighterG.toString(16).padStart(2, '0')}${lighterB.toString(16).padStart(2, '0')}`,
    dark: `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`,
    light: `#${lightR.toString(16).padStart(2, '0')}${lightG.toString(16).padStart(2, '0')}${lightB.toString(16).padStart(2, '0')}`
  }
}

// Function to determine if a color is light or dark
const isLightColor = (color) => {
  const hex = color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Calculate brightness using standard formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128
}

export const ThemeProvider = ({ children }) => {
  const [currentColor, setCurrentColor] = useState('#BAFF39') // Default yellow-green
  const mode = 'light' // Force light mode only
  const [theme, setTheme] = useState({
    colors: generateShades('#BAFF39'),
    textColor: 'black',
    mode: 'light'
  })

  // Update theme when color changes
  useEffect(() => {
    const colors = generateShades(currentColor)
    const textColor = isLightColor(currentColor) ? 'black' : 'white'
    
    setTheme({
      colors,
      textColor,
      mode: 'light'
    })

    // Update CSS custom properties
    const root = document.documentElement
    root.style.setProperty('--color-primary', colors.primary)
    root.style.setProperty('--color-secondary', colors.secondary)
    root.style.setProperty('--color-dark', colors.dark)
    root.style.setProperty('--color-light', colors.light)
    root.style.setProperty('--text-color', textColor)
    
    // Set theme mode class on html element - always light mode
    root.classList.add('light-mode')
    root.classList.remove('dark-mode')
  }, [currentColor])

  const changeColor = (color) => {
    setCurrentColor(color)
  }

  return (
    <ThemeContext.Provider value={{ theme, currentColor, changeColor, mode }}>
      {children}
    </ThemeContext.Provider>
  )
}
