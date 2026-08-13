import React from 'react'
import { Check, Loader2 } from 'lucide-react'

const SearchProgressIndicator = ({ currentStepIndex }) => {
  const steps = [
    'Reformatting your question…',
    'Querying AI model…',
    'Fetching relevant information…',
    'Preparing final response…'
  ]

  return (
    <div className="flex flex-col gap-2 py-1 max-w-[280px]">
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex
        const isActive = index === currentStepIndex
        const isPending = index > currentStepIndex

        return (
          <div key={index} className="flex items-center gap-3">
            {/* Left Side: Loader or Tick */}
            <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
              {isCompleted && (
                <div className="w-4 h-4 rounded-full bg-green-50 flex items-center justify-center border border-green-200">
                  <Check className="w-2.5 h-2.5 text-green-600 stroke-[3]" />
                </div>
              )}
              {isActive && (
                <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
              )}
              {isPending && (
                <div className="w-3 h-3 rounded-full border border-gray-200 bg-white" />
              )}
            </div>

            {/* Right Side: Step Text */}
            <span
              className={`text-[11.5px] leading-none transition-all duration-300 ${
                isCompleted
                  ? 'text-gray-500 font-medium'
                  : isActive
                  ? 'text-gray-800 font-semibold'
                  : 'text-gray-300'
              }`}
            >
              {step}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default SearchProgressIndicator
