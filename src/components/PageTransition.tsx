import './PageTransition.css'

type Props = {
  children: React.ReactNode
  dir: 'forward' | 'back' | 'none'
}

export function PageTransition({ children, dir }: Props) {
  return (
    <div className={`page-transition${dir !== 'none' ? ` page-transition--${dir}` : ''}`}>
      {children}
    </div>
  )
}
