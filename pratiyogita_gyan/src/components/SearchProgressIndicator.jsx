import React from 'react'
import { Loader2 } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const SearchProgressIndicator = ({ isVisible }) => {
  const { theme } = useTheme()
  
  if (!isVisible) return null

  return (
    <div className="flex items-center justify-center py-2">
      <Loader2 
        className="w-5 h-5 animate-spin"
        style={{ 
          color: '#000000'
        }}
      />
    </div>
  )
}

export default SearchProgressIndicator
