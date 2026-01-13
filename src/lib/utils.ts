import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function onlyDigits(value: string) {
  return (value || "").replace(/\D/g, "")
}

export function maskCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function maskPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length === 0) return ""
  if (digits.length <= 2) return `(${digits}`

  const area = digits.slice(0, 2)
  const rest = digits.slice(2)

  if (rest.length === 0) return `(${area})`
  if (rest.length <= 4) return `(${area}) ${rest}`
  if (rest.length <= 8) return `(${area}) ${rest.slice(0, 4)}-${rest.slice(4)}`
  return `(${area}) ${rest.slice(0, 5)}-${rest.slice(5)}`
}

export function maskZip(value: string) {
  const digits = onlyDigits(value).slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}
