import React, { useState } from 'react'

const ProgressIcon = ({
  value = 0,
  max = 100,
  variant = 'primary',
  label = 'Journeys',
  link = '#',
  icon: IconComponent,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const currentValue = value > 0 ? 100 : 0
  const percentage =
    max === 0 ? 0 : Math.min(Math.round((currentValue / max) * 100), 100)
  const circumference = 2 * Math.PI * 45
  const offset = circumference - (percentage / 100) * circumference

  const colorVariants = {
    primary: 'stroke-primary border-t-primary text-primary',
    secondary: 'stroke-secondary border-t-secondary text-secondary',
    accent: 'stroke-accent border-t-accent text-accent',
    destructive: 'stroke-destructive border-t-destructive text-destructive',
  }

  const selectedVariant = colorVariants[variant] || colorVariants.primary

  const IconDisplay = () => {
    if (IconComponent) {
      return <IconComponent size={24} className={`mb-1 ${selectedVariant}`} />
    }
    return null
  }

  return (
    <div
      className={`flex flex-col mx-auto items-center w-22 h-min cursor-default transition-all duration-200 ${isHovered ? 'scale-105' : 'scale-100'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => (window.location.href = link)}
    >
      <div className="relative flex items-center justify-center size-16 mb-2">
        <svg className="size-16 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            className="stroke-muted"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            className={selectedVariant}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{value}</span>
        </div>
      </div>

      <div
        className={`w-full px-2 py-1 text-center !text-muted-foreground text-sm font-semibold bg-card rounded-md shadow-md border-t-4 ${selectedVariant}`}
      >
        {label}
      </div>
    </div>
  )
}

export default ProgressIcon
