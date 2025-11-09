interface AlvesbettLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  animated?: boolean
}

export function AlvesbettLogo({ size = 'md', className = '', animated = false }: AlvesbettLogoProps) {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
    xl: 'h-20'
  }

  const textSizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
    xl: 'text-5xl'
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon */}
      <div className={`${sizeClasses[size]} aspect-square relative`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={animated ? 'animate-pulse' : ''}
        >
          {/* Outer Glow Ring */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="url(#gradient1)"
            strokeWidth="2"
            fill="none"
            opacity="0.5"
          />
          
          {/* Main Circle */}
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="url(#gradient2)"
          />
          
          {/* Letter A Design */}
          <path
            d="M 50 25 L 65 65 L 60 65 L 56 55 L 44 55 L 40 65 L 35 65 Z M 50 35 L 45 50 L 55 50 Z"
            fill="white"
            strokeWidth="1.5"
            stroke="white"
          />
          
          {/* Casino Chip Details */}
          <circle cx="50" cy="50" r="38" stroke="white" strokeWidth="1" fill="none" opacity="0.3" />
          <circle cx="50" cy="50" r="35" stroke="white" strokeWidth="0.5" fill="none" opacity="0.2" />
          
          {/* Chip Segments */}
          {[...Array(8)].map((_, i) => {
            const angle = (i * 45 * Math.PI) / 180
            const x1 = 50 + 35 * Math.cos(angle)
            const y1 = 50 + 35 * Math.sin(angle)
            const x2 = 50 + 38 * Math.cos(angle)
            const y2 = 50 + 38 * Math.sin(angle)
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="white"
                strokeWidth="2"
                opacity="0.4"
              />
            )
          })}
          
          {/* Gradients */}
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Logo Text */}
      <div className="flex flex-col">
        <h1 
          className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent leading-none ${animated ? 'animate-pulse' : ''}`}
        >
          ALVESBETT
        </h1>
        <p className="text-purple-400 text-xs tracking-wider opacity-80">
          BETTING ARENA
        </p>
      </div>
    </div>
  )
}
