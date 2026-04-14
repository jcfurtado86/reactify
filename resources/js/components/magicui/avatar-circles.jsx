/* eslint-disable @next/next/no-img-element */
'use client'
import { cn } from '@/lib/utils'
import { User } from 'lucide-react'

export const AvatarCircles = ({ className, avatarUrls, maxVisible = 4 }) => {
  const overflow = Math.max(0, (avatarUrls?.length ?? 0) - maxVisible)
  return (
    <div className={cn('z-10 flex -space-x-4 rtl:space-x-reverse', className)}>
      {avatarUrls.slice(0, maxVisible).map((url, index) => (
        <a
          key={url.profileUrl ?? url.imageUrl ?? `avatar-${index}`}
          href={url.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {url.imageUrl ? (
            <img
              className="size-9 rounded-full border-2 bg-card border-border"
              src={url.imageUrl}
              width={40}
              height={40}
              alt={`Avatar ${index + 1}`}
            />
          ) : (
            <User className="size-9 rounded-full dark:text-slate-400 text-slate-800 border-border border bg-background" />
          )}
        </a>
      ))}
      {overflow > 0 && (
        <span className="flex size-9 items-center justify-center rounded-full border-2 border-border bg-background text-center text-xs font-medium text-foreground">
          +{overflow}
        </span>
      )}
    </div>
  )
}
