'use client'

interface PasswordStrengthProps {
  password: string
  className?: string
}

export default function PasswordStrength({ password, className = '' }: PasswordStrengthProps) {
  const getPasswordStrength = (password: string) => {
    let score = 0
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    score = Object.values(checks).filter(Boolean).length

    const strength = score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong'
    
    return { score, checks, strength }
  }

  if (!password) return null

  const { score, checks, strength } = getPasswordStrength(password)

  const strengthColors = {
    weak: 'text-red-600 bg-red-100',
    medium: 'text-yellow-600 bg-yellow-100',
    strong: 'text-green-600 bg-green-100'
  }

  const barColors = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500'
  }

  return (
    <div className={`mt-2 ${className}`}>
      <div className="flex items-center space-x-2 mb-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${barColors[strength]}`}
            style={{ width: `${(score / 5) * 100}%` }}
          />
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${strengthColors[strength]}`}
        >
          {strength === 'weak' && 'Weak'}
          {strength === 'medium' && 'Medium'}
          {strength === 'strong' && 'Strong'}
        </span>
      </div>

      <div className="text-xs space-y-1">
        <div className={`flex items-center space-x-1 ${checks.length ? 'text-green-600' : 'text-gray-400'}`}>
          <span>{checks.length ? '✓' : '○'}</span>
          <span>At least 8 characters</span>
        </div>
        <div className={`flex items-center space-x-1 ${checks.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
          <span>{checks.lowercase ? '✓' : '○'}</span>
          <span>One lowercase letter</span>
        </div>
        <div className={`flex items-center space-x-1 ${checks.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
          <span>{checks.uppercase ? '✓' : '○'}</span>
          <span>One uppercase letter</span>
        </div>
        <div className={`flex items-center space-x-1 ${checks.numbers ? 'text-green-600' : 'text-gray-400'}`}>
          <span>{checks.numbers ? '✓' : '○'}</span>
          <span>One number</span>
        </div>
        <div className={`flex items-center space-x-1 ${checks.special ? 'text-green-600' : 'text-gray-400'}`}>
          <span>{checks.special ? '✓' : '○'}</span>
          <span>One special character</span>
        </div>
      </div>
    </div>
  )
}
